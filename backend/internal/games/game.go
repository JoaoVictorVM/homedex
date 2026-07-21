package games

type Game struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	IsOfficial bool   `json:"isOfficial"`
	Visible    bool   `json:"visible"`
}
