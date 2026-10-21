package main

import (
	"encoding/json"
	"fmt"
	"github.com/thunderxu7-sketch/settleforge/internal/mpclab"
	"github.com/thunderxu7-sketch/settleforge/internal/signer"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"net/http"
	"os"
	"strings"
	"time"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func run() error {
	token := os.Getenv("SIGNER_TOKEN")
	if len(token) < 24 {
		return fmt.Errorf("SIGNER_TOKEN requires 24+ characters")
	}
	body, err := os.ReadFile(os.Getenv("SIGNER_BINDINGS"))
	if err != nil {
		return err
	}
	bindings := map[string]signer.Binding{}
	if err = json.Unmarshal(body, &bindings); err != nil {
		return err
	}
	approvers := signing.Approvers{}
	if err = json.Unmarshal([]byte(os.Getenv("APPROVER_PUBLIC_KEYS")), &approvers); err != nil || len(approvers) < 2 {
		return fmt.Errorf("two trusted approval keys required")
	}
	var provider signing.Provider = signing.LocalKeys{Dir: os.Getenv("SIGNER_KEYS_DIR")}
	if dir := os.Getenv("MPC_SHARE_DIR"); dir != "" {
		provider = &mpclab.Provider{Dir: dir, Participants: []int{1, 3}}
	}
	if module := os.Getenv("PKCS11_MODULE"); module != "" {
		hsm, e := signing.OpenPKCS11(module, os.Getenv("PKCS11_TOKEN"), os.Getenv("PKCS11_PIN"))
		if e != nil {
			return e
		}
		defer hsm.Close()
		provider = hsm
	}
	engine := &signer.Engine{Provider: provider, Approvers: approvers, Bindings: bindings, JournalPath: os.Getenv("SIGNER_JOURNAL")}
	addr := os.Getenv("SIGNER_LISTEN")
	if addr == "" {
		addr = "127.0.0.1:8081"
	}
	if !strings.HasPrefix(addr, "127.0.0.1:") {
		return fmt.Errorf("lab signer must bind to loopback; deploy behind mutually authenticated TLS for remote use")
	}
	server := &http.Server{Addr: addr, Handler: engine.Handler(token), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 75 * time.Second}
	fmt.Println("Independent signing policy service ready on", addr)
	return server.ListenAndServe()
}
