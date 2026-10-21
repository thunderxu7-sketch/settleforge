package main

import (
	"bytes"
	"context"
	"crypto/ed25519"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/thunderxu7-sketch/settleforge/internal/chain"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/httpapi"
	"github.com/thunderxu7-sketch/settleforge/internal/rfq"
	"github.com/thunderxu7-sketch/settleforge/internal/service"
	"github.com/thunderxu7-sketch/settleforge/internal/signer"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

func main() {
	if err := run(); err != nil {
		slog.Error("command failed", "error", err)
		os.Exit(1)
	}
}
func loadEnv(path string) error {
	b, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		return nil
	}
	if err != nil {
		return err
	}
	for _, line := range strings.Split(string(b), "\n") {
		if strings.HasPrefix(line, "#") || strings.TrimSpace(line) == "" {
			continue
		}
		key, val, ok := strings.Cut(line, "=")
		if ok && os.Getenv(key) == "" {
			if err = os.Setenv(key, strings.Trim(val, "'\"")); err != nil {
				return err
			}
		}
	}
	return nil
}
func initDev() error {
	if err := os.MkdirAll(".local", 0700); err != nil {
		return err
	}
	actors, err := signing.GenerateApprovers(".local/approvers")
	if err != nil {
		return err
	}
	if _, err = os.Stat(".local/dev.env"); err == nil {
		fmt.Println("Development environment already initialized.")
		return nil
	}
	raw := make([]byte, 32)
	if _, err = rand.Read(raw); err != nil {
		return err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	text := "DATABASE_URL=postgres://settleforge:local-development-only@127.0.0.1:55432/settleforge?sslmode=disable\nLISTEN_ADDR=127.0.0.1:8080\nADMIN_TOKEN=" + token + "\nAPPROVER_PUBLIC_KEYS=" + signing.PublicApprovers(actors) + "\nKEYS_DIR=.local/keys\nSIMULATOR_FILE=.local/simulated-chain.json\n"
	if err = os.WriteFile(".local/dev.env", []byte(text), 0600); err != nil {
		return err
	}
	fmt.Println("Initialized .local/dev.env and two operator keys; secret values are not printed.")
	return nil
}
func run() error {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stderr, nil)))
	command := "serve"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}
	if command == "init" {
		return initDev()
	}
	if err := loadEnv(".local/dev.env"); err != nil {
		return err
	}
	if command == "approve" {
		return approve(os.Args[2:])
	}
	if command != "serve" && command != "migrate" {
		return fmt.Errorf("unknown command %q", command)
	}
	url := os.Getenv("DATABASE_URL")
	if url == "" {
		return fmt.Errorf("DATABASE_URL is required; run settleforge init")
	}
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	st, err := store.Open(ctx, url)
	if err != nil {
		return err
	}
	defer st.Close()
	if err = st.Migrate(ctx); err != nil {
		return err
	}
	if err = st.Seed(ctx); err != nil {
		return err
	}
	if command == "migrate" {
		return nil
	}
	token := os.Getenv("ADMIN_TOKEN")
	if len(token) < 24 {
		return fmt.Errorf("ADMIN_TOKEN must contain at least 24 characters")
	}
	actors := signing.Approvers{}
	if err = json.Unmarshal([]byte(os.Getenv("APPROVER_PUBLIC_KEYS")), &actors); err != nil || len(actors) < 2 {
		return fmt.Errorf("two trusted APPROVER_PUBLIC_KEYS are required")
	}
	keys := signing.LocalKeys{Dir: os.Getenv("KEYS_DIR")}
	if keys.Dir == "" {
		return fmt.Errorf("KEYS_DIR required")
	}
	sim, err := chain.OpenSimulator(os.Getenv("SIMULATOR_FILE"))
	if err != nil {
		return err
	}
	svc := &service.Service{Store: st, Keys: keys, Provider: keys, Approvers: actors, Chains: map[string]chain.Adapter{"tron-nile": sim, "evm-dev": sim, "btc-regtest": sim}}
	if endpoint := os.Getenv("SIGNER_URL"); endpoint != "" {
		if !strings.HasPrefix(endpoint, "http://127.0.0.1:") {
			return fmt.Errorf("lab SIGNER_URL must be loopback")
		}
		svc.Backend = signer.Client{URL: endpoint, Token: os.Getenv("SIGNER_TOKEN")}
	}
	if module := os.Getenv("PKCS11_MODULE"); module != "" {
		provider, e := signing.OpenPKCS11(module, os.Getenv("PKCS11_TOKEN"), os.Getenv("PKCS11_PIN"))
		if e != nil {
			return e
		}
		defer provider.Close()
		svc.Keys = provider
		svc.Provider = provider
	}
	if endpoint := os.Getenv("BITCOIN_RPC_URL"); endpoint != "" {
		btc := &chain.Bitcoin{RPC: chain.RPC{URL: endpoint, User: os.Getenv("BITCOIN_RPC_USER"), Password: os.Getenv("BITCOIN_RPC_PASSWORD")}, Store: st, Confirmations: 2, SatPerVByte: 2}
		if err = btc.Ensure(ctx); err != nil {
			return err
		}
		svc.Chains["btc-regtest"] = btc
		go func() {
			timer := time.NewTicker(time.Second)
			defer timer.Stop()
			for {
				select {
				case <-ctx.Done():
					return
				case <-timer.C:
					scanCtx, stop := context.WithTimeout(ctx, 30*time.Second)
					scanErr := btc.Sync(scanCtx)
					stop()
					if scanErr != nil {
						slog.Error("Bitcoin indexer paused", "error", scanErr)
					}
				}
			}
		}()
	}
	addr := os.Getenv("LISTEN_ADDR")
	if addr == "" {
		addr = "127.0.0.1:8080"
	}
	if !strings.HasPrefix(addr, "127.0.0.1:") {
		return fmt.Errorf("development server must bind to loopback")
	}
	api := &httpapi.API{Service: svc, Token: token}
	if os.Getenv("RFQ_LAB") == "1" {
		sources, e := rfq.OpenLab(ctx, st, ".local/rfq-makers")
		if e != nil {
			return e
		}
		api.RFQ = &rfq.Service{Store: st, Sources: sources, Approvers: actors}
		go api.RFQ.RunWorker(ctx)
	}
	server := &http.Server{Addr: addr, Handler: api.Handler(), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 15 * time.Second, WriteTimeout: 15 * time.Second, IdleTimeout: 30 * time.Second}
	go svc.RunWorker(ctx, nil)
	go func() {
		<-ctx.Done()
		shutdown, stop := context.WithTimeout(context.Background(), 5*time.Second)
		defer stop()
		_ = server.Shutdown(shutdown)
	}()
	slog.Info("SettleForge API ready", "address", addr, "mode", "development", "approval_quorum", 2, "bitcoin_rpc", os.Getenv("BITCOIN_RPC_URL") != "")
	err = server.ListenAndServe()
	if err == http.ErrServerClosed {
		return nil
	}
	return err
}
func approve(args []string) error {
	flags := flag.NewFlagSet("approve", flag.ContinueOnError)
	id := flags.String("id", "", "withdrawal or RFQ trade ID")
	actor := flags.String("actor", "", "operator-a or operator-b")
	base := flags.String("url", "http://127.0.0.1:8080", "API URL")
	kind := flags.String("kind", "withdrawal", "withdrawal or rfq")
	if err := flags.Parse(args); err != nil {
		return err
	}
	if *actor != "operator-a" && *actor != "operator-b" {
		return domain.ErrInvalid
	}
	if *id == "" {
		return domain.ErrInvalid
	}
	resource := "/v1/withdrawals/"
	if *kind == "rfq" {
		resource = "/v1/rfq/trades/"
	} else if *kind != "withdrawal" {
		return domain.ErrInvalid
	}
	client := &http.Client{Timeout: 10 * time.Second}
	request, err := http.NewRequest(http.MethodGet, *base+resource+*id, nil)
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+os.Getenv("ADMIN_TOKEN"))
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return fmt.Errorf("intent fetch failed: HTTP %d", response.StatusCode)
	}
	raw, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if err != nil {
		return err
	}
	key, err := os.ReadFile(filepath.Join(".local/approvers", *actor+".key"))
	if err != nil {
		return err
	}
	if len(key) != ed25519.PrivateKeySize {
		return domain.ErrInvalid
	}
	var proof domain.Approval
	if *kind == "rfq" {
		var t domain.RFQTrade
		if err = json.Unmarshal(raw, &t); err != nil {
			return err
		}
		proof = rfq.SignApproval(t.RFQTradeIntent, *actor, ed25519.PrivateKey(key))
	} else {
		var w domain.Withdrawal
		if err = json.Unmarshal(raw, &w); err != nil {
			return err
		}
		proof = signing.SignApproval(w.Intent, *actor, ed25519.PrivateKey(key))
	}
	body, _ := json.Marshal(proof)
	request, err = http.NewRequest(http.MethodPost, *base+resource+*id+"/approvals", bytes.NewReader(body))
	if err != nil {
		return err
	}
	request.Header.Set("Authorization", "Bearer "+os.Getenv("ADMIN_TOKEN"))
	request.Header.Set("Content-Type", "application/json")
	response, err = client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		_, _ = io.Copy(io.Discard, response.Body)
		return fmt.Errorf("approval rejected: HTTP %d", response.StatusCode)
	}
	fmt.Printf("%s approved %s\n", *actor, *id)
	return nil
}
