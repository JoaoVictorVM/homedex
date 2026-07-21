package pokeapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

const (
	defaultBaseURL  = "https://pokeapi.co/api/v2"
	defaultTimeout  = 10 * time.Second
	maxResponseSize = 5 << 20
	userAgent       = "HomeDex/1.0"
)

var ErrNotFound = errors.New("recurso não encontrado na PokéAPI")

type Options struct {
	BaseURL   string
	HTTP      *http.Client
	CacheSize int
}

type Client struct {
	baseURL   string
	http      *http.Client
	pokemons  *cache[Pokemon]
	varieties *cache[string]
}

func New(opts Options) *Client {
	baseURL := opts.BaseURL
	if baseURL == "" {
		baseURL = defaultBaseURL
	}

	httpClient := opts.HTTP
	if httpClient == nil {
		httpClient = &http.Client{Timeout: defaultTimeout}
	}

	cacheSize := opts.CacheSize
	if cacheSize <= 0 {
		cacheSize = defaultCacheSize
	}

	return &Client{
		baseURL:   strings.TrimSuffix(baseURL, "/"),
		http:      httpClient,
		pokemons:  newCache[Pokemon](cacheSize),
		varieties: newCache[string](cacheSize),
	}
}

func (c *Client) Get(ctx context.Context, path string, dst any) error {
	url := c.baseURL + "/" + strings.TrimPrefix(path, "/")

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("montar requisição para %s: %w", path, err)
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", userAgent)

	resp, err := c.http.Do(req)
	if err != nil {
		return fmt.Errorf("consultar %s na PokéAPI: %w", path, err)
	}
	defer func() {
		if err := resp.Body.Close(); err != nil {
			slog.Warn("fechar corpo da resposta da PokéAPI", "erro", err)
		}
	}()

	if resp.StatusCode == http.StatusNotFound {
		return ErrNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("PokéAPI respondeu %s para %s", resp.Status, path)
	}

	if err := json.NewDecoder(io.LimitReader(resp.Body, maxResponseSize)).Decode(dst); err != nil {
		return fmt.Errorf("decodificar resposta de %s: %w", path, err)
	}

	return nil
}
