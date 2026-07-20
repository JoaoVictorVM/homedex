package collection

import "time"

type Collection struct {
	ID        int64     `json:"-"`
	Code      string    `json:"code"`
	BoxCount  int       `json:"boxCount"`
	CreatedAt time.Time `json:"createdAt"`
}
