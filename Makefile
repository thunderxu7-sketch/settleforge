GO ?= go
TEST_DATABASE_URL ?= postgres://settleforge:local-development-only@127.0.0.1:55432/settleforge?sslmode=disable
TEST_BITCOIN_RPC_URL ?= http://127.0.0.1:18443
.PHONY: build test test-integration test-bitcoin vet
build:
	$(GO) build -o bin/settleforge ./cmd/settleforge
	$(GO) build -o bin/signer ./cmd/signer
test:
	$(GO) test -race ./...
test-integration:
	TEST_DATABASE_URL='$(TEST_DATABASE_URL)' TEST_BITCOIN_RPC_URL='$(TEST_BITCOIN_RPC_URL)' $(GO) test -race -count=1 ./...
test-bitcoin:
	TEST_DATABASE_URL='$(TEST_DATABASE_URL)' TEST_BITCOIN_RPC_URL='$(TEST_BITCOIN_RPC_URL)' $(GO) test -race -count=1 -v ./internal/service -run TestBitcoinCoreRegtest
vet:
	$(GO) vet ./...
