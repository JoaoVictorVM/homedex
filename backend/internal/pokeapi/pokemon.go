package pokeapi

import (
	"context"
	"errors"
	"fmt"
	"strings"
)

var ErrInvalidName = errors.New("nome de Pokémon inválido")

type Sprites struct {
	Default string `json:"default"`
	Shiny   string `json:"shiny"`
}

type Pokemon struct {
	ID      int      `json:"id"`
	Name    string   `json:"name"`
	Sprites Sprites  `json:"sprites"`
	Forms   []string `json:"forms"`
}

type pokemonResponse struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Sprites struct {
		FrontDefault string `json:"front_default"`
		FrontShiny   string `json:"front_shiny"`
	} `json:"sprites"`
	Forms []struct {
		Name string `json:"name"`
	} `json:"forms"`
}

func (c *Client) Pokemon(ctx context.Context, rawName string) (Pokemon, error) {
	name, err := NormalizeName(rawName)
	if err != nil {
		return Pokemon{}, err
	}

	var resp pokemonResponse
	if err := c.Get(ctx, "pokemon/"+name, &resp); err != nil {
		return Pokemon{}, fmt.Errorf("buscar pokémon %q: %w", name, err)
	}

	forms := make([]string, 0, len(resp.Forms))
	for _, form := range resp.Forms {
		forms = append(forms, form.Name)
	}

	return Pokemon{
		ID:   resp.ID,
		Name: resp.Name,
		Sprites: Sprites{
			Default: resp.Sprites.FrontDefault,
			Shiny:   resp.Sprites.FrontShiny,
		},
		Forms: forms,
	}, nil
}

func NormalizeName(raw string) (string, error) {
	name := strings.ToLower(strings.TrimSpace(raw))
	name = strings.NewReplacer(" ", "-", "_", "-", ".", "", "'", "", ":", "").Replace(name)
	name = strings.Trim(name, "-")

	if name == "" {
		return "", ErrInvalidName
	}

	for _, r := range name {
		isAllowed := (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-'
		if !isAllowed {
			return "", ErrInvalidName
		}
	}

	return name, nil
}
