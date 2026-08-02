package sprite

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

const (
	RequestTimeout = 3 * time.Second

	maxSpriteSize = 2 << 20
	spritePath    = "/sprite/image"
)

var ErrSpriteIndisponivel = errors.New("sprite indisponível no HomeDex")

func Fetch(ctx context.Context, species string, shiny bool) (image []byte, err error) {
	endpoint, err := spriteURL(config.Resolve(), species, shiny)
	if err != nil {
		return nil, err
	}

	ctx, cancel := context.WithTimeout(ctx, RequestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, fmt.Errorf("montar requisição da sprite: %w", err)
	}
	req.Header.Set("Accept", "image/png")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("buscar sprite no HomeDex: %w", err)
	}
	defer func() {
		if erroAoFechar := resp.Body.Close(); erroAoFechar != nil && err == nil {
			err = fmt.Errorf("fechar corpo da sprite: %w", erroAoFechar)
		}
	}()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%w: servidor respondeu %s", ErrSpriteIndisponivel, resp.Status)
	}

	image, err = io.ReadAll(io.LimitReader(resp.Body, maxSpriteSize))
	if err != nil {
		return nil, fmt.Errorf("ler bytes da sprite: %w", err)
	}
	if len(image) == 0 {
		return nil, ErrSpriteIndisponivel
	}

	return image, nil
}

func spriteURL(baseURL string, species string, shiny bool) (string, error) {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return "", fmt.Errorf("url base inválida %q: %w", baseURL, err)
	}

	parsed.Path = strings.TrimSuffix(parsed.Path, "/") + spritePath

	query := parsed.Query()
	query.Set("name", species)
	query.Set("shiny", strconv.FormatBool(shiny))
	parsed.RawQuery = query.Encode()

	return parsed.String(), nil
}
