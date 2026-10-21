package domain

import "time"

// RFQRequest is exact-input: all amounts are integer base units on one network.
type RFQRequest struct {
	ID         string `json:"id"`
	UserID     string `json:"user_id"`
	Network    string `json:"network"`
	SellAsset  string `json:"sell_asset"`
	BuyAsset   string `json:"buy_asset"`
	SellAmount string `json:"sell_amount"`
}

// RFQOffer binds the maker, taker, request, fee and expiration. BuyAmount is NET
// of FeeAmount; both are denominated in BuyAsset. This is a lab protocol, not a
// 0x/EIP-712 compatible order or a mainnet execution authorization.
type RFQOffer struct {
	RFQRequest
	QuoteID   string `json:"quote_id"`
	MakerID   string `json:"maker_id"`
	BuyAmount string `json:"buy_amount"`
	FeeAmount string `json:"fee_amount"`
	ExpiresAt int64  `json:"expires_at"`
	Mode      string `json:"mode"`
}

type RFQQuote struct {
	RFQOffer
	Signature string `json:"signature"`
}

type RFQResult struct {
	RequestID string            `json:"request_id"`
	Quotes    []RFQQuote        `json:"quotes"`
	BestID    string            `json:"best_quote_id"`
	Rejected  map[string]string `json:"rejected_sources"`
	Mode      string            `json:"mode"`
}

type RFQAccept struct {
	UserID       string `json:"user_id"`
	QuoteID      string `json:"quote_id"`
	MinBuyAmount string `json:"min_buy_amount"`
}

type RFQTradeIntent struct {
	TradeID      string   `json:"trade_id"`
	UserID       string   `json:"user_id"`
	Quote        RFQQuote `json:"quote"`
	MinBuyAmount string   `json:"min_buy_amount"`
}

type RFQTrade struct {
	RFQTradeIntent
	State     string    `json:"state"`
	CreatedAt time.Time `json:"created_at"`
}
