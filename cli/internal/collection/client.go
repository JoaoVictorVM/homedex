package collection

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

const (
	RequestTimeout = 5 * time.Second

	maxErrorSize = 4 << 10
)

var (
	ErrCodigoInvalido      = errors.New("código de coleção inválido")
	ErrCodigoNaoEncontrado = errors.New("código de coleção não encontrado")
	ErrColecaoCheia        = errors.New("coleção sem slots livres")
	ErrResgateIndisponivel = errors.New("resgate indisponível no HomeDex")
)

type JaResgatadoError struct {
	ProximoResgate time.Time
}

func (e *JaResgatadoError) Error() string {
	return "resgate diário já utilizado hoje"
}

type Resgate struct {
	BoxNumber int `json:"boxNumber"`
	Slot      int `json:"slot"`
}

type pedidoDeResgate struct {
	Species string `json:"species"`
	Gender  string `json:"gender"`
	Shiny   bool   `json:"shiny"`
}

type respostaDeErro struct {
	Error           string    `json:"error"`
	NextAvailableAt time.Time `json:"nextAvailableAt"`
}

func Resgatar(ctx context.Context, codigo string, resultado roll.Result) (resgate Resgate, err error) {
	endpoint, err := dailyRollURL(config.Resolve(), codigo)
	if err != nil {
		return Resgate{}, err
	}

	corpo, err := json.Marshal(pedidoDeResgate{
		Species: resultado.Species.Name,
		Gender:  string(resultado.Gender),
		Shiny:   resultado.Shiny,
	})
	if err != nil {
		return Resgate{}, fmt.Errorf("montar corpo do resgate: %w", err)
	}

	ctx, cancel := context.WithTimeout(ctx, RequestTimeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(corpo))
	if err != nil {
		return Resgate{}, fmt.Errorf("montar requisição do resgate: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return Resgate{}, fmt.Errorf("resgatar no HomeDex: %w", err)
	}
	defer func() {
		if erroAoFechar := resp.Body.Close(); erroAoFechar != nil && err == nil {
			err = fmt.Errorf("fechar corpo do resgate: %w", erroAoFechar)
		}
	}()

	if resp.StatusCode != http.StatusCreated {
		return Resgate{}, erroDoResgate(resp)
	}

	if err := json.NewDecoder(io.LimitReader(resp.Body, maxErrorSize)).Decode(&resgate); err != nil {
		return Resgate{}, fmt.Errorf("ler resposta do resgate: %w", err)
	}

	return resgate, nil
}

func erroDoResgate(resp *http.Response) error {
	var falha respostaDeErro
	if err := json.NewDecoder(io.LimitReader(resp.Body, maxErrorSize)).Decode(&falha); err != nil {
		falha = respostaDeErro{}
	}

	switch resp.StatusCode {
	case http.StatusBadRequest:
		return ErrCodigoInvalido
	case http.StatusNotFound:
		return ErrCodigoNaoEncontrado
	case http.StatusConflict:
		return &JaResgatadoError{ProximoResgate: falha.NextAvailableAt.UTC()}
	case http.StatusUnprocessableEntity:
		return ErrColecaoCheia
	default:
		return fmt.Errorf("%w: servidor respondeu %s", ErrResgateIndisponivel, resp.Status)
	}
}

func dailyRollURL(baseURL string, codigo string) (string, error) {
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return "", fmt.Errorf("url base inválida %q: %w", baseURL, err)
	}

	return parsed.JoinPath("collections", codigo, "daily-roll").String(), nil
}
