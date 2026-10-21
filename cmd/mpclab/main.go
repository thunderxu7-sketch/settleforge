package main

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"flag"
	"fmt"
	"github.com/ethereum/go-ethereum/crypto"
	"github.com/thunderxu7-sketch/settleforge/internal/mpclab"
	"os"
	"time"
)

func main() {
	dir := flag.String("dir", ".local/mpc", "per-party shares directory")
	generate := flag.Bool("generate", false, "generate fresh 2-of-3 shares")
	flag.Parse()
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute)
	defer cancel()
	if *generate {
		if err := mpclab.Generate(ctx, *dir, func(message string) { fmt.Println(message) }); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	}
	digest := sha256.Sum256([]byte("SettleForge MPC acceptance v1"))
	provider := &mpclab.Provider{Dir: *dir, Participants: []int{1, 3}}
	pub, err := provider.PublicKey(ctx, "mpc-2of3")
	if err != nil {
		panic(err)
	}
	sig, err := provider.SignDigest(ctx, "mpc-2of3", digest[:])
	if err != nil {
		panic(err)
	}
	if !crypto.VerifySignature(pub, digest[:], sig[:64]) {
		panic("signature invalid")
	}
	provider.Participants = []int{1}
	if _, err = provider.SignDigest(ctx, "mpc-2of3", digest[:]); err == nil {
		panic("single party unexpectedly signed")
	}
	fmt.Printf("PASS: actual 2-of-3 ECDSA verified; 1-of-3 rejected; public key %s\n", hex.EncodeToString(pub))
}
