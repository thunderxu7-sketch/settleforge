package chain

import (
	"bytes"
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"sort"
	"strings"
	"time"

	"github.com/btcsuite/btcd/btcec/v2"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/btcutil/psbt"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/chaincfg/chainhash"
	"github.com/btcsuite/btcd/txscript"
	"github.com/btcsuite/btcd/wire"
	"github.com/thunderxu7-sketch/settleforge/internal/domain"
	"github.com/thunderxu7-sketch/settleforge/internal/signing"
	"github.com/thunderxu7-sketch/settleforge/internal/store"
)

type RPC struct {
	URL, User, Password string
	Client              *http.Client
}
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

func (e *RPCError) Error() string { return fmt.Sprintf("Bitcoin RPC error %d", e.Code) }
func (r RPC) Call(ctx context.Context, method string, params any, out any) error {
	body, err := json.Marshal(map[string]any{"jsonrpc": "2.0", "id": "settleforge", "method": method, "params": params})
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, "POST", r.URL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.SetBasicAuth(r.User, r.Password)
	req.Header.Set("Content-Type", "application/json")
	client := r.Client
	if client == nil {
		client = &http.Client{Timeout: 15 * time.Second}
	}
	res, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Bitcoin RPC transport unavailable")
	}
	defer res.Body.Close()
	var envelope struct {
		Result json.RawMessage `json:"result"`
		Error  *RPCError       `json:"error"`
	}
	if err = json.NewDecoder(io.LimitReader(res.Body, 16<<20)).Decode(&envelope); err != nil {
		return fmt.Errorf("Bitcoin RPC response invalid")
	}
	if envelope.Error != nil {
		return envelope.Error
	}
	if res.StatusCode != 200 {
		return fmt.Errorf("Bitcoin RPC HTTP %d", res.StatusCode)
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(envelope.Result, out)
}

// Satoshis parses JSON decimal amounts without IEEE-754 rounding.
func Satoshis(n json.Number) (int64, error) {
	r, ok := new(big.Rat).SetString(string(n))
	if !ok || r.Sign() < 0 {
		return 0, domain.ErrInvalid
	}
	r.Mul(r, big.NewRat(100000000, 1))
	if !r.IsInt() || !r.Num().IsInt64() || r.Num().Int64() > 21000000*100000000 {
		return 0, domain.ErrInvalid
	}
	return r.Num().Int64(), nil
}

type Bitcoin struct {
	RPC           RPC
	Store         *store.Store
	Confirmations int64
	SatPerVByte   int64
}

func (b *Bitcoin) walletRPC() RPC {
	r := b.RPC
	r.URL = strings.TrimRight(r.URL, "/") + "/wallet/settleforge-watch"
	return r
}
func (b *Bitcoin) Ensure(ctx context.Context) error {
	var info struct {
		Chain string `json:"chain"`
	}
	if err := b.RPC.Call(ctx, "getblockchaininfo", []any{}, &info); err != nil {
		return err
	}
	if info.Chain != "regtest" {
		return fmt.Errorf("Bitcoin adapter is restricted to regtest")
	}
	var result any
	err := b.RPC.Call(ctx, "createwallet", []any{"settleforge-watch", true, true, "", false, true, true}, &result)
	var rpcErr *RPCError
	if errors.As(err, &rpcErr) && (rpcErr.Code == -4 || rpcErr.Code == -35) {
		err = b.RPC.Call(ctx, "loadwallet", []any{"settleforge-watch"}, &result)
		if errors.As(err, &rpcErr) && rpcErr.Code == -35 {
			return nil
		}
	}
	return err
}
func (b *Bitcoin) Register(ctx context.Context, w domain.Wallet, pub []byte) error {
	key, err := btcec.ParsePubKey(pub)
	if err != nil {
		return err
	}
	var descriptor struct {
		Descriptor string `json:"descriptor"`
	}
	if err = b.RPC.Call(ctx, "getdescriptorinfo", []any{"wpkh(" + hex.EncodeToString(key.SerializeCompressed()) + ")"}, &descriptor); err != nil {
		return err
	}
	var results []struct {
		Success bool      `json:"success"`
		Error   *RPCError `json:"error"`
	}
	if err = b.walletRPC().Call(ctx, "importdescriptors", []any{[]any{map[string]any{"desc": descriptor.Descriptor, "timestamp": 0, "label": w.Address}}}, &results); err != nil {
		return err
	}
	if len(results) != 1 || !results[0].Success {
		return fmt.Errorf("watch descriptor import failed")
	}
	return nil
}
func (b *Bitcoin) unspent(ctx context.Context, address string) ([]store.UTXO, error) {
	var list []struct {
		TxID   string      `json:"txid"`
		Vout   uint32      `json:"vout"`
		Amount json.Number `json:"amount"`
		Script string      `json:"scriptPubKey"`
	}
	if err := b.walletRPC().Call(ctx, "listunspent", []any{b.Confirmations, 9999999, []string{address}}, &list); err != nil {
		return nil, err
	}
	coins := []store.UTXO{}
	for _, row := range list {
		amount, err := Satoshis(row.Amount)
		if err != nil {
			return nil, err
		}
		script, err := hex.DecodeString(row.Script)
		if err != nil {
			return nil, err
		}
		coins = append(coins, store.UTXO{TxID: row.TxID, Vout: row.Vout, Amount: amount, Script: script})
	}
	sort.Slice(coins, func(i, j int) bool {
		if coins[i].TxID == coins[j].TxID {
			return coins[i].Vout < coins[j].Vout
		}
		return coins[i].TxID < coins[j].TxID
	})
	return coins, nil
}
func btcScript(address string) ([]byte, error) {
	a, err := btcutil.DecodeAddress(address, &chaincfg.RegressionNetParams)
	if err != nil || !a.IsForNet(&chaincfg.RegressionNetParams) {
		return nil, domain.ErrInvalid
	}
	return txscript.PayToAddrScript(a)
}
func btcUnits(s string) (int64, error) {
	n, err := domain.Units(s)
	if err != nil || !n.IsInt64() || n.Int64() > 21000000*100000000 {
		return 0, domain.ErrInvalid
	}
	return n.Int64(), nil
}

type bitcoinPayload struct {
	PSBT   string `json:"psbt"`
	Sender string `json:"sender"`
	Fee    int64  `json:"fee"`
}
type bitcoinSigned struct {
	Hex string `json:"hex"`
	Fee string `json:"fee"`
}

func (b *Bitcoin) Build(ctx context.Context, w domain.Wallet, a domain.Asset, i domain.Intent) (domain.Prepared, error) {
	if w.Network != "btc-regtest" || a.ID != "btc-regtest/BTC" || i.Network != w.Network || i.WalletID != w.ID || i.Asset != a.ID {
		return domain.Prepared{}, domain.ErrInvalid
	}
	amount, err := btcUnits(i.Amount)
	if err != nil {
		return domain.Prepared{}, err
	}
	cap, err := btcUnits(i.FeeCap)
	if err != nil {
		return domain.Prepared{}, err
	}
	dest, err := btcScript(i.Destination)
	if err != nil {
		return domain.Prepared{}, err
	}
	sender, err := btcScript(w.Address)
	if err != nil {
		return domain.Prepared{}, err
	}
	if bytes.Equal(dest, sender) {
		return domain.Prepared{}, domain.ErrInvalid
	}
	coins, err := b.unspent(ctx, w.Address)
	if err != nil {
		return domain.Prepared{}, err
	}
	rate := b.SatPerVByte
	if rate < 1 || rate > 100 {
		return domain.Prepared{}, domain.ErrInvalid
	}
	coins, fee, err := b.Store.ReserveCoins(ctx, w, i.ID, coins, amount, cap, rate)
	if err != nil {
		return domain.Prepared{}, err
	}
	tx := wire.NewMsgTx(2)
	var total int64
	for _, u := range coins {
		h, e := chainhash.NewHashFromStr(u.TxID)
		if e != nil {
			return domain.Prepared{}, e
		}
		input := wire.NewTxIn(wire.NewOutPoint(h, u.Vout), nil, nil)
		input.Sequence = 0xfffffffd
		tx.AddTxIn(input)
		total += u.Amount
	}
	tx.AddTxOut(wire.NewTxOut(amount, dest))
	if total-amount-fee > 0 {
		tx.AddTxOut(wire.NewTxOut(total-amount-fee, sender))
	}
	packet, err := psbt.NewFromUnsignedTx(tx)
	if err != nil {
		return domain.Prepared{}, err
	}
	for index, u := range coins {
		packet.Inputs[index].WitnessUtxo = wire.NewTxOut(u.Amount, u.Script)
		packet.Inputs[index].SighashType = txscript.SigHashAll
	}
	encoded, err := packet.B64Encode()
	if err != nil {
		return domain.Prepared{}, err
	}
	payload, _ := json.Marshal(bitcoinPayload{encoded, w.Address, fee})
	return domain.Prepared{Network: w.Network, WalletID: w.ID, KeyRef: w.KeyRef, Intent: i, Payload: payload}, nil
}
func (b *Bitcoin) Sign(ctx context.Context, p domain.Prepared, provider signing.Provider) (domain.Signed, error) {
	var data bitcoinPayload
	if err := json.Unmarshal(p.Payload, &data); err != nil {
		return domain.Signed{}, err
	}
	packet, err := psbt.NewFromRawBytes(strings.NewReader(data.PSBT), true)
	if err != nil {
		return domain.Signed{}, err
	}
	pub, err := provider.PublicKey(ctx, p.KeyRef)
	if err != nil {
		return domain.Signed{}, err
	}
	sender, err := signing.Address("btc-regtest", pub)
	if err != nil || sender != data.Sender || p.Network != "btc-regtest" || p.Intent.Network != p.Network || p.Intent.WalletID != p.WalletID || p.Intent.Asset != "btc-regtest/BTC" {
		return domain.Signed{}, domain.ErrInvalid
	}
	if p.Intent.Kind != "withdrawal" && p.Intent.Kind != "sweep" {
		return domain.Signed{}, domain.ErrInvalid
	}
	ownScript, err := btcScript(sender)
	if err != nil {
		return domain.Signed{}, err
	}
	destScript, err := btcScript(p.Intent.Destination)
	if err != nil || bytes.Equal(destScript, ownScript) {
		return domain.Signed{}, domain.ErrInvalid
	}
	amount, err := btcUnits(p.Intent.Amount)
	if err != nil {
		return domain.Signed{}, err
	}
	cap, err := btcUnits(p.Intent.FeeCap)
	if err != nil {
		return domain.Signed{}, err
	}
	tx := packet.UnsignedTx
	if len(tx.TxIn) == 0 || len(tx.TxIn) > 64 || len(tx.TxOut) < 1 || len(tx.TxOut) > 2 || tx.Version != 2 || tx.LockTime != 0 || len(packet.Inputs) != len(tx.TxIn) {
		return domain.Signed{}, domain.ErrInvalid
	}
	fetcher := txscript.NewMultiPrevOutFetcher(nil)
	var totalIn, totalOut int64
	seen := map[wire.OutPoint]bool{}
	for index, in := range packet.Inputs {
		if in.WitnessUtxo == nil || !bytes.Equal(in.WitnessUtxo.PkScript, ownScript) || in.WitnessUtxo.Value <= 0 || in.WitnessUtxo.Value > 21000000*100000000 || in.SighashType != txscript.SigHashAll || seen[tx.TxIn[index].PreviousOutPoint] {
			return domain.Signed{}, domain.ErrInvalid
		}
		seen[tx.TxIn[index].PreviousOutPoint] = true
		totalIn += in.WitnessUtxo.Value
		fetcher.AddPrevOut(tx.TxIn[index].PreviousOutPoint, in.WitnessUtxo)
	}
	for index, out := range tx.TxOut {
		if out.Value < 0 || out.Value > 21000000*100000000 {
			return domain.Signed{}, domain.ErrInvalid
		}
		totalOut += out.Value
		if index == 0 {
			if out.Value != amount || !bytes.Equal(out.PkScript, destScript) {
				return domain.Signed{}, domain.ErrInvalid
			}
		} else if !bytes.Equal(out.PkScript, ownScript) || out.Value < 330 {
			return domain.Signed{}, domain.ErrInvalid
		}
	}
	fee := totalIn - totalOut
	if fee <= 0 || fee > cap || fee != data.Fee {
		return domain.Signed{}, domain.ErrInvalid
	}
	compressed, _ := btcec.ParsePubKey(pub)
	pkh, _ := btcutil.NewAddressPubKeyHash(btcutil.Hash160(compressed.SerializeCompressed()), &chaincfg.RegressionNetParams)
	scriptCode, _ := txscript.PayToAddrScript(pkh)
	hashes := txscript.NewTxSigHashes(tx, fetcher)
	for index, in := range packet.Inputs {
		digest, e := txscript.CalcWitnessSigHash(scriptCode, hashes, txscript.SigHashAll, tx, index, in.WitnessUtxo.Value)
		if e != nil {
			return domain.Signed{}, e
		}
		sig, e := provider.SignDigest(ctx, p.KeyRef, digest)
		if e != nil {
			return domain.Signed{}, e
		}
		if len(sig) != 65 {
			return domain.Signed{}, domain.ErrInvalid
		}
		der, e := signing.DER(sig)
		if e != nil {
			return domain.Signed{}, e
		}
		packet.Inputs[index].PartialSigs = []*psbt.PartialSig{{PubKey: compressed.SerializeCompressed(), Signature: append(der, byte(txscript.SigHashAll))}}
	}
	if err = psbt.MaybeFinalizeAll(packet); err != nil {
		return domain.Signed{}, err
	}
	signed, err := psbt.Extract(packet)
	if err != nil {
		return domain.Signed{}, err
	}
	// Execute each witness locally before any transaction reaches Bitcoin Core.
	for index, in := range packet.Inputs {
		engine, e := txscript.NewEngine(in.WitnessUtxo.PkScript, signed, index, txscript.StandardVerifyFlags, nil, hashes, in.WitnessUtxo.Value, fetcher)
		if e != nil {
			return domain.Signed{}, e
		}
		if e = engine.Execute(); e != nil {
			return domain.Signed{}, e
		}
	}
	var raw bytes.Buffer
	if err = signed.Serialize(&raw); err != nil {
		return domain.Signed{}, err
	}
	body, _ := json.Marshal(bitcoinSigned{hex.EncodeToString(raw.Bytes()), fmt.Sprint(fee)})
	return domain.Signed{TxID: signed.TxHash().String(), Raw: body}, nil
}
func (b *Bitcoin) Broadcast(ctx context.Context, s domain.Signed) error {
	var body bitcoinSigned
	if err := json.Unmarshal(s.Raw, &body); err != nil {
		return err
	}
	var txid string
	err := b.RPC.Call(ctx, "sendrawtransaction", []any{body.Hex}, &txid)
	if err != nil {
		var rpcErr *RPCError
		if errors.As(err, &rpcErr) && rpcErr.Code == -27 {
			return nil
		}
		return ErrUnknown
	}
	if txid != s.TxID {
		return domain.ErrConflict
	}
	return nil
}
func (b *Bitcoin) Receipt(ctx context.Context, txid string) (domain.Receipt, error) {
	var tx struct {
		Confirmations int64  `json:"confirmations"`
		BlockHash     string `json:"blockhash"`
	}
	err := b.RPC.Call(ctx, "getrawtransaction", []any{txid, true}, &tx)
	if err != nil {
		var e *RPCError
		if errors.As(err, &e) && e.Code == -5 {
			return domain.Receipt{}, nil
		}
		return domain.Receipt{}, err
	}
	fee, err := b.Store.TransactionFee(ctx, txid)
	if err != nil {
		return domain.Receipt{}, err
	}
	var block struct {
		Height int64 `json:"height"`
	}
	if tx.BlockHash != "" {
		if err = b.RPC.Call(ctx, "getblockheader", []any{tx.BlockHash}, &block); err != nil {
			return domain.Receipt{}, err
		}
	}
	return domain.Receipt{Found: true, Confirmed: tx.Confirmations >= b.Confirmations, Success: true, Fee: fee, BlockHash: tx.BlockHash, Height: block.Height}, nil
}
func (b *Bitcoin) Balance(ctx context.Context, w domain.Wallet, a domain.Asset) (string, error) {
	if a.ID != "btc-regtest/BTC" || w.Network != "btc-regtest" {
		return "", domain.ErrInvalid
	}
	coins, err := b.unspent(ctx, w.Address)
	if err != nil {
		return "", err
	}
	var total int64
	for _, u := range coins {
		total += u.Amount
	}
	return fmt.Sprint(total), nil
}

// Sync indexes confirmed blocks by stable (network, txid, vout), and compensates
// orphaned credits before replaying a changed branch. A reorg quarantines users.
func (b *Bitcoin) Sync(ctx context.Context) error {
	var tip int64
	if err := b.RPC.Call(ctx, "getblockcount", []any{}, &tip); err != nil {
		return err
	}
	target := tip - b.Confirmations + 1
	if target < 0 {
		return nil
	}
	head, old, err := b.Store.ScanHead(ctx, "btc-regtest")
	if err != nil {
		return err
	}
	if old != "" {
		var current string
		if head <= tip {
			err = b.RPC.Call(ctx, "getblockhash", []any{head}, &current)
			if err != nil {
				return err
			}
		}
		if current != old {
			fork := head
			if fork > target {
				fork = target
			}
			for fork > 0 {
				saved, e := b.Store.ScannedHash(ctx, "btc-regtest", fork)
				if e != nil {
					return e
				}
				var canonical string
				if e = b.RPC.Call(ctx, "getblockhash", []any{fork}, &canonical); e != nil {
					return e
				}
				if canonical == saved {
					break
				}
				fork--
			}
			if e := b.Store.QuarantineNetwork(ctx, "btc-regtest"); e != nil {
				return e
			}
			blocks, e := b.Store.DepositBlocksAfter(ctx, "btc-regtest", fork)
			if e != nil {
				return e
			}
			for _, h := range blocks {
				if e = b.Store.ReverseDeposit(ctx, "btc-regtest", h); e != nil {
					return e
				}
			}
			head = fork
			var forkHash string
			if e = b.RPC.Call(ctx, "getblockhash", []any{fork}, &forkHash); e != nil {
				return e
			}
			if e = b.Store.SaveScan(ctx, "btc-regtest", fork, forkHash); e != nil {
				return e
			}
		}
	}
	wallets, err := b.Store.Wallets(ctx)
	if err != nil {
		return err
	}
	addresses := map[string]domain.Wallet{}
	for _, w := range wallets {
		if w.Network == "btc-regtest" {
			addresses[w.Address] = w
		}
	}
	for height := head + 1; height <= target; height++ {
		var hash string
		if err = b.RPC.Call(ctx, "getblockhash", []any{height}, &hash); err != nil {
			return err
		}
		var block struct {
			Tx []struct {
				TxID string `json:"txid"`
				Vin  []struct {
					TxID string `json:"txid"`
				} `json:"vin"`
				Vout []struct {
					Value  json.Number `json:"value"`
					N      int         `json:"n"`
					Script struct {
						Address string `json:"address"`
					} `json:"scriptPubKey"`
				} `json:"vout"`
			} `json:"tx"`
		}
		if err = b.RPC.Call(ctx, "getblock", []any{hash, 2}, &block); err != nil {
			return err
		}
		for _, tx := range block.Tx {
			var known bool
			if err = b.Store.DB.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM attempts WHERE txid=$1)`, tx.TxID).Scan(&known); err != nil {
				return err
			}
			if known {
				continue
			}
			for _, out := range tx.Vout {
				w, ok := addresses[out.Script.Address]
				if !ok {
					continue
				}
				amount, e := Satoshis(out.Value)
				if e != nil || amount == 0 {
					continue
				}
				if w.Purpose == "deposit" {
					if e = b.Store.Observe(ctx, domain.Deposit{Network: w.Network, TxID: tx.TxID, Index: out.N, BlockHash: hash, Height: height, WalletID: w.ID, Asset: "btc-regtest/BTC", Amount: fmt.Sprint(amount), Confirmed: true}); e != nil {
						return e
					}
				} else {
					if e = b.Store.Capital(ctx, w.ID, "btc-regtest/BTC", fmt.Sprint(amount), "btc:"+tx.TxID+":"+fmt.Sprint(out.N)); e != nil {
						return e
					}
				}
			}
		}
		if err = b.Store.SaveScan(ctx, "btc-regtest", height, hash); err != nil {
			return err
		}
	}
	return nil
}
