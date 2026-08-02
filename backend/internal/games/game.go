package games

type Game struct {
	ID         int64  `json:"id"`
	Name       string `json:"name"`
	IsOfficial bool   `json:"isOfficial"`
	IsSystem   bool   `json:"isSystem"`
	Visible    bool   `json:"visible"`
}
