package pokeapi

import (
	"context"
	"errors"
)

var ErrNoSprite = errors.New("sprite indisponível para o Pokémon")

func (c *Client) Sprite(ctx context.Context, rawName string, rawForm string, shiny bool) (string, error) {
	base, err := c.Pokemon(ctx, rawName)
	if err != nil {
		return "", err
	}

	url, err := c.formSprite(ctx, rawForm, base.Name, shiny)
	if err != nil {
		return "", err
	}
	if url != "" {
		return url, nil
	}

	if url := pickSprite(base.Sprites, shiny); url != "" {
		return url, nil
	}

	return "", ErrNoSprite
}

func (c *Client) formSprite(ctx context.Context, rawForm string, baseName string, shiny bool) (string, error) {
	form, err := NormalizeName(rawForm)
	if err != nil {
		return "", nil
	}
	if form == baseName {
		return "", nil
	}

	variant, err := c.Pokemon(ctx, form)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return "", nil
		}
		return "", err
	}

	return pickSprite(variant.Sprites, shiny), nil
}

func pickSprite(sprites Sprites, shiny bool) string {
	if shiny && sprites.Shiny != "" {
		return sprites.Shiny
	}

	return sprites.Default
}
