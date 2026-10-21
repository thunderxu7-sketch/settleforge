CREATE TABLE IF NOT EXISTS users (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), external_ref TEXT NOT NULL UNIQUE,
 state TEXT NOT NULL DEFAULT 'active' CHECK(state IN ('active','review','disabled')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS networks (
 id TEXT PRIMARY KEY, family TEXT NOT NULL, native_asset TEXT NOT NULL,
 confirmations INT NOT NULL CHECK(confirmations>0), enabled BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS assets (
 id TEXT PRIMARY KEY, network TEXT NOT NULL REFERENCES networks(id),
 symbol TEXT NOT NULL, decimals INT NOT NULL CHECK(decimals BETWEEN 0 AND 255),
 contract TEXT NOT NULL DEFAULT '', UNIQUE(network,contract)
);
CREATE TABLE IF NOT EXISTS wallets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id),
 network TEXT NOT NULL REFERENCES networks(id), address TEXT NOT NULL, key_ref TEXT NOT NULL,
 purpose TEXT NOT NULL CHECK(purpose IN ('deposit','treasury','vault')),
 UNIQUE(network,address), UNIQUE(id,network)
);
CREATE UNIQUE INDEX IF NOT EXISTS user_deposit_wallet ON wallets(user_id,network) WHERE purpose='deposit';
CREATE TABLE IF NOT EXISTS accounts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), asset TEXT NOT NULL REFERENCES assets(id),
 code TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('asset','liability','expense','equity')),
 UNIQUE(asset,code), UNIQUE(id,asset)
);
CREATE TABLE IF NOT EXISTS journals (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), asset TEXT NOT NULL REFERENCES assets(id),
 ref TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(id,asset)
);
CREATE TABLE IF NOT EXISTS entries (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 journal_id UUID NOT NULL, account_id UUID NOT NULL, asset TEXT NOT NULL,
 amount NUMERIC(78,0) NOT NULL CHECK(amount<>0),
 FOREIGN KEY(journal_id,asset) REFERENCES journals(id,asset),
 FOREIGN KEY(account_id,asset) REFERENCES accounts(id,asset)
);
CREATE INDEX IF NOT EXISTS entries_account ON entries(account_id);
CREATE OR REPLACE FUNCTION check_balanced_journal() RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE target UUID; total NUMERIC; n INT;
BEGIN
 IF TG_TABLE_NAME='journals' THEN target:=NEW.id; ELSE target:=COALESCE(NEW.journal_id,OLD.journal_id); END IF;
 SELECT COALESCE(sum(amount),0),count(*) INTO total,n FROM entries WHERE journal_id=target;
 IF total<>0 OR n<2 THEN RAISE EXCEPTION 'unbalanced journal %',target USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION reject_ledger_mutation() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'ledger records are append only' USING ERRCODE='42501'; END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='entries_append_only' AND tgrelid='entries'::regclass) THEN
 CREATE TRIGGER entries_append_only BEFORE UPDATE OR DELETE ON entries FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
 CREATE TRIGGER journals_append_only BEFORE UPDATE OR DELETE ON journals FOR EACH ROW EXECUTE FUNCTION reject_ledger_mutation();
 END IF;
END $$;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_trigger WHERE tgname='entries_balanced' AND tgrelid='entries'::regclass) THEN
  CREATE CONSTRAINT TRIGGER entries_balanced AFTER INSERT OR UPDATE OR DELETE ON entries DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_balanced_journal();
  CREATE CONSTRAINT TRIGGER journal_nonempty AFTER INSERT ON journals DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION check_balanced_journal();
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS deposits (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), network TEXT NOT NULL REFERENCES networks(id),
 txid TEXT NOT NULL, event_index INT NOT NULL, block_hash TEXT NOT NULL, height BIGINT NOT NULL,
 wallet_id UUID NOT NULL, asset TEXT NOT NULL REFERENCES assets(id), amount NUMERIC(78,0) NOT NULL CHECK(amount>0),
 state TEXT NOT NULL CHECK(state IN ('observed','credited','orphaned')),
 UNIQUE(network,txid,event_index), FOREIGN KEY(wallet_id,network) REFERENCES wallets(id,network)
);
CREATE TABLE IF NOT EXISTS withdrawals (
 id UUID PRIMARY KEY, user_id UUID NOT NULL REFERENCES users(id), asset TEXT NOT NULL REFERENCES assets(id),
	 kind TEXT NOT NULL CHECK(kind IN ('withdrawal','sweep')), wallet_id UUID NOT NULL REFERENCES wallets(id),
 network TEXT NOT NULL REFERENCES networks(id), destination TEXT NOT NULL, amount NUMERIC(78,0) NOT NULL CHECK(amount>0),
 fee_cap NUMERIC(78,0) NOT NULL CHECK(fee_cap>0), expires_at BIGINT NOT NULL,
 idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL, intent_json JSONB NOT NULL,
 state TEXT NOT NULL CHECK(state IN ('pending_approval','approved','prepared','signed','broadcast_unknown','broadcast','confirmed','failed','review')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), UNIQUE(user_id,idempotency_key)
);
ALTER TABLE deposits ADD COLUMN IF NOT EXISTS generation INT NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS approvals (
 withdrawal_id UUID NOT NULL REFERENCES withdrawals(id), actor TEXT NOT NULL,
 signature TEXT NOT NULL, PRIMARY KEY(withdrawal_id,actor)
);
CREATE TABLE IF NOT EXISTS attempts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), withdrawal_id UUID NOT NULL UNIQUE REFERENCES withdrawals(id),
 wallet_id UUID NOT NULL REFERENCES wallets(id), prepared JSONB NOT NULL,
 txid TEXT, signed JSONB, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS jobs (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), withdrawal_id UUID NOT NULL UNIQUE REFERENCES withdrawals(id),
 state TEXT NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','leased','done')),
 lease_until TIMESTAMPTZ, lease_token UUID, next_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 attempts INT NOT NULL DEFAULT 0, last_error TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS nonce_reservations (
 network TEXT NOT NULL, wallet_id UUID NOT NULL REFERENCES wallets(id), nonce BIGINT NOT NULL,
 withdrawal_id UUID NOT NULL UNIQUE REFERENCES withdrawals(id), PRIMARY KEY(network,wallet_id,nonce)
);
CREATE TABLE IF NOT EXISTS utxos (
 network TEXT NOT NULL, txid TEXT NOT NULL, vout INT NOT NULL,
 wallet_id UUID NOT NULL REFERENCES wallets(id), amount BIGINT NOT NULL CHECK(amount>0), script TEXT NOT NULL,
 reserved_by UUID REFERENCES withdrawals(id), spent BOOLEAN NOT NULL DEFAULT false,
 PRIMARY KEY(network,txid,vout)
);
CREATE TABLE IF NOT EXISTS scans (
 network TEXT PRIMARY KEY REFERENCES networks(id), height BIGINT NOT NULL DEFAULT 0, block_hash TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS scanned_blocks (
 network TEXT NOT NULL REFERENCES networks(id), height BIGINT NOT NULL, block_hash TEXT NOT NULL,
 PRIMARY KEY(network,height)
);
CREATE TABLE IF NOT EXISTS audit (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL,
 subject TEXT NOT NULL, detail JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
