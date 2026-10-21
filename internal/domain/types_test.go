package domain

import "testing"

func TestUnitsRejectAmbiguousAndOverflow(t *testing.T) {
	for _, s := range []string{"0", "-1", "1.1", "1e6", "NaN", " 1", "01", "+1", "115792089237316195423570985008687907853269984665640564039457584007913129639936"} {
		if _, err := Units(s); err == nil {
			t.Fatalf("accepted invalid units %q", s)
		}
	}
	for _, s := range []string{"1", "1000000", "115792089237316195423570985008687907853269984665640564039457584007913129639935"} {
		if _, err := Units(s); err != nil {
			t.Fatal(err)
		}
	}
}
