package chain

import (
	"encoding/json"
	"testing"
)

func TestSatoshisExact(t *testing.T) {
	for input, want := range map[string]int64{"0.00000001": 1, "0.01000000": 1000000, "21000000": 2100000000000000} {
		got, err := Satoshis(json.Number(input))
		if err != nil || got != want {
			t.Fatalf("%s => %d %v", input, got, err)
		}
	}
	for _, input := range []string{"0.000000001", "-1", "NaN", "21000001"} {
		if _, err := Satoshis(json.Number(input)); err == nil {
			t.Fatal("accepted", input)
		}
	}
}
