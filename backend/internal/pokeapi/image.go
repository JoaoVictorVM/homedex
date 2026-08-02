package pokeapi

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/url"
)

const maxImageSize = 2 << 20

var ErrInvalidSpriteURL = errors.New("endereço de sprite inválido")

func (c *Client) SpriteImage(ctx context.Context, rawName string, rawForm string, shiny bool) ([]byte, error) {
	spriteURL, err := c.Sprite(ctx, rawName, rawForm, shiny)
	if err != nil {
		return nil, err
	}
	if spriteURL == "" {
		return nil, ErrNoSprite
	}

	if image, ok := c.images.get(spriteURL); ok {
		return image, nil
	}

	image, err := c.downloadImage(ctx, spriteURL)
	if err != nil {
		return nil, err
	}

	c.images.set(spriteURL, image)

	return image, nil
}

func (c *Client) downloadImage(ctx context.Context, raw string) ([]byte, error) {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "https" && parsed.Scheme != "http") {
		return nil, fmt.Errorf("%w: %q", ErrInvalidSpriteURL, raw)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return nil, fmt.Errorf("montar requisição da sprite: %w", err)
	}
	req.Header.Set("Accept", "image/png")
	req.Header.Set("User-Agent", userAgent)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("baixar sprite: %w", err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			slog.Warn("fechar corpo da sprite", "erro", err)
		}
	}()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("host de sprites respondeu %s", resp.Status)
	}

	image, err := io.ReadAll(io.LimitReader(resp.Body, maxImageSize))
	if err != nil {
		return nil, fmt.Errorf("ler bytes da sprite: %w", err)
	}
	if len(image) == 0 {
		return nil, ErrNoSprite
	}

	return image, nil
}
