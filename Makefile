GO ?= go
TEST_DATABASE_URL ?= postgres://settleforge:local-development-only@127.0.0.1:55432/settleforge?sslmode=disable
TEST_BITCOIN_RPC_URL ?= http://127.0.0.1:18443
RFQ_LAB ?= 1
.PHONY: build test test-integration test-bitcoin test-rfq vet local-up local-demo local-rfq-demo local-check local-down
build:
	$(GO) build -o bin/settleforge ./cmd/settleforge
	$(GO) build -o bin/signer ./cmd/signer
test:
	$(GO) test -race ./...
test-integration:
	TEST_DATABASE_URL='$(TEST_DATABASE_URL)' TEST_BITCOIN_RPC_URL='$(TEST_BITCOIN_RPC_URL)' $(GO) test -race -count=1 ./...
test-bitcoin:
	TEST_DATABASE_URL='$(TEST_DATABASE_URL)' TEST_BITCOIN_RPC_URL='$(TEST_BITCOIN_RPC_URL)' $(GO) test -race -count=1 -v ./internal/service -run TestBitcoinCoreRegtest
test-rfq:
	TEST_DATABASE_URL='$(TEST_DATABASE_URL)' $(GO) test -race -count=1 -v ./internal/rfq ./internal/httpapi
vet:
	$(GO) vet ./...
local-up:
	docker compose up -d --wait
	$(MAKE) build
	./bin/settleforge init
	DATABASE_URL='postgres://settleforge:local-development-only@127.0.0.1:$(or $(PG_PORT),55432)/settleforge?sslmode=disable' BITCOIN_RPC_URL='http://127.0.0.1:$(or $(BITCOIN_RPC_PORT),18443)' BITCOIN_RPC_USER=settleforge BITCOIN_RPC_PASSWORD=local-regtest-only RFQ_LAB='$(RFQ_LAB)' ./bin/settleforge serve
local-demo:
	python3 scripts/demo.py
	BITCOIN_RPC_PORT='$(or $(BITCOIN_RPC_PORT),18443)' python3 scripts/demo-bitcoin.py
	$(MAKE) local-rfq-demo
local-rfq-demo:
	python3 scripts/demo-rfq.py
local-check:
	GO='$(GO)' python3 scripts/verify-local.py
local-down:
	docker compose down
