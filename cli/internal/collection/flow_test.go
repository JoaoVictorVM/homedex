package collection

import (
	"bufio"
	"bytes"
	"net/http"
	"strings"
	"testing"
)

func redeem(t *testing.T, entrada string) (string, int) {
	t.Helper()

	var stdout bytes.Buffer

	code := Redeem(bufio.NewScanner(strings.NewReader(entrada)), &stdout, resultadoDeTeste())

	return stdout.String(), code
}

func TestRedeemMostraBoxESlotNoSucesso(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		respondeCriado(t, w, 3, 11)
	})

	saida, code := redeem(t, "A7K9F2QX\n")

	if code != 0 {
		t.Errorf("Redeem() = %d, esperado 0", code)
	}
	for _, esperado := range []string{"Pikachu", "Box 3", "slot 12"} {
		if !strings.Contains(saida, esperado) {
			t.Errorf("saída não traz %q: %q", esperado, saida)
		}
	}
}

func TestRedeemEnviaOCodigoDigitado(t *testing.T) {
	var caminho string

	servidorDeResgate(t, func(w http.ResponseWriter, r *http.Request) {
		caminho = r.URL.Path
		respondeCriado(t, w, 1, 0)
	})

	redeem(t, "  a7k9f2qx  \n")

	if caminho != "/collections/a7k9f2qx/daily-roll" {
		t.Errorf("caminho = %q, o código digitado deveria ir na URL", caminho)
	}
}

func TestRedeemMostraOHorarioDeDesbloqueioQuandoJaResgatou(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusConflict)
		if _, err := w.Write([]byte(
			`{"error":"já resgatado","nextAvailableAt":"2026-08-02T00:00:00Z"}`,
		)); err != nil {
			t.Errorf("escrever resposta: %v", err)
		}
	})

	saida, code := redeem(t, "A7K9F2QX\n")

	if code == 0 {
		t.Error("Redeem() = 0, esperado código de falha no bloqueio")
	}
	if !strings.Contains(saida, "2026-08-02T00:00:00Z") {
		t.Errorf("saída não traz o horário UTC do próximo resgate: %q", saida)
	}
}

func TestRedeemMostraAMensagemDeColecaoCheia(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusUnprocessableEntity)
	})

	saida, code := redeem(t, "A7K9F2QX\n")

	if code == 0 {
		t.Error("Redeem() = 0, esperado código de falha com a coleção cheia")
	}
	if !strings.Contains(saida, mensagemColecaoCheia) {
		t.Errorf("saída não traz a mensagem de coleção cheia: %q", saida)
	}
}

func TestRedeemReperguntaOCodigoAteOLimite(t *testing.T) {
	var chamadas int

	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		chamadas++
		w.WriteHeader(http.StatusNotFound)
	})

	saida, code := redeem(t, "AAAAAAAA\nBBBBBBBB\nCCCCCCCC\nDDDDDDDD\n")

	if chamadas != MaxTentativas {
		t.Errorf("tentativas = %d, esperado %d", chamadas, MaxTentativas)
	}
	if got := strings.Count(saida, perguntaDoCodigo); got != MaxTentativas {
		t.Errorf("perguntas = %d, esperado %d: %q", got, MaxTentativas, saida)
	}
	if !strings.Contains(saida, mensagemCodigoNaoEncontrado) {
		t.Errorf("saída não avisa que o código não existe: %q", saida)
	}
	if code == 0 {
		t.Error("Redeem() = 0, esperado código de falha ao esgotar as tentativas")
	}
}

func TestRedeemAceitaOCodigoCorrigidoNaSegundaTentativa(t *testing.T) {
	var chamadas int

	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		chamadas++
		if chamadas == 1 {
			w.WriteHeader(http.StatusNotFound)

			return
		}
		respondeCriado(t, w, 1, 0)
	})

	saida, code := redeem(t, "ERRADO12\nA7K9F2QX\n")

	if code != 0 {
		t.Errorf("Redeem() = %d, esperado 0", code)
	}
	if !strings.Contains(saida, "Box 1") {
		t.Errorf("saída não confirma a adição: %q", saida)
	}
}

func TestRedeemAvisaQuandoOCodigoENegadoPeloServidor(t *testing.T) {
	servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
	})

	saida, _ := redeem(t, "abc\nabc\nabc\n")

	if !strings.Contains(saida, mensagemCodigoInvalido) {
		t.Errorf("saída não traz a mensagem de código inválido: %q", saida)
	}
}

func TestRedeemMostraAFalhaDeRedeSemAssumirAdicao(t *testing.T) {
	server := servidorDeResgate(t, func(http.ResponseWriter, *http.Request) {})
	server.Close()

	saida, code := redeem(t, "A7K9F2QX\n")

	if code == 0 {
		t.Error("Redeem() = 0, esperado código de falha de rede")
	}
	if !strings.Contains(saida, mensagemFalhaDeRede) {
		t.Errorf("saída não traz a mensagem de falha de rede: %q", saida)
	}
	if strings.Contains(saida, "adicionado à Box") {
		t.Errorf("saída não deveria confirmar adição: %q", saida)
	}
}

func TestRedeemCancelaSemChamarOServidor(t *testing.T) {
	entradas := map[string]string{
		"enter vazio":     "\n",
		"entrada fechada": "",
		"só espaços":      "   \n",
	}

	for nome, entrada := range entradas {
		t.Run(nome, func(t *testing.T) {
			var chamadas int

			servidorDeResgate(t, func(w http.ResponseWriter, _ *http.Request) {
				chamadas++
				respondeCriado(t, w, 1, 0)
			})

			saida, code := redeem(t, entrada)

			if chamadas != 0 {
				t.Errorf("chamadas = %d, o cancelamento não deveria chamar o servidor", chamadas)
			}
			if code != 0 {
				t.Errorf("Redeem() = %d, esperado 0 no cancelamento", code)
			}
			if !strings.Contains(saida, mensagemCancelado) {
				t.Errorf("saída não confirma o cancelamento: %q", saida)
			}
		})
	}
}
