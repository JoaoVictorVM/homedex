package collection

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"strings"
	"time"

	"github.com/JoaoVictorVM/homedex/cli/internal/roll"
)

const MaxTentativas = 3

const (
	perguntaDoCodigo = "Digite o código da sua coleção (enter para cancelar): "

	mensagemCancelado = "Tudo bem, nada foi adicionado."
	mensagemSucesso   = "%s foi adicionado à Box %d, slot %d!"

	mensagemCodigoInvalido      = "Esse código não parece válido: são 8 caracteres, como A7K9-F2QX."
	mensagemCodigoNaoEncontrado = "Não encontrei nenhuma coleção com esse código."
	mensagemTentativasEsgotadas = "Código não encontrado depois de %d tentativas. Nada foi adicionado."
	mensagemJaResgatado         = "Você já resgatou o roll de hoje. O próximo sai em %s, nada foi adicionado."
	mensagemColecaoCheia        = "Sua coleção não tem mais slots livres. Libere um slot no app e tente de novo."
	mensagemFalhaDeRede         = "Não foi possível falar com o HomeDex. Nada foi adicionado."
)

func Redeem(leitor *bufio.Scanner, stdout io.Writer, resultado roll.Result) int {
	for tentativa := 1; tentativa <= MaxTentativas; tentativa++ {
		codigo, informado := pedeOCodigo(leitor, stdout)
		if !informado {
			return escreve(stdout, mensagemCancelado+"\n", 0)
		}

		resgate, err := Resgatar(context.Background(), codigo, resultado)
		if err == nil {
			return escreve(stdout, fmt.Sprintf(
				mensagemSucesso+"\n",
				resultado.Species.DisplayName, resgate.BoxNumber, resgate.Slot+1,
			), 0)
		}

		if !recusouOCodigo(err) {
			return escreve(stdout, mensagemDoErro(err)+"\n", 1)
		}

		if tentativa == MaxTentativas {
			break
		}

		if code := escreve(stdout, mensagemDoErro(err)+"\n", 0); code != 0 {
			return code
		}
	}

	return escreve(stdout, fmt.Sprintf(mensagemTentativasEsgotadas+"\n", MaxTentativas), 1)
}

func pedeOCodigo(leitor *bufio.Scanner, stdout io.Writer) (string, bool) {
	if code := escreve(stdout, "\n"+perguntaDoCodigo, 0); code != 0 {
		return "", false
	}

	if !leitor.Scan() {
		escreve(stdout, "\n", 0)

		return "", false
	}

	codigo := strings.TrimSpace(leitor.Text())

	return codigo, codigo != ""
}

func recusouOCodigo(err error) bool {
	return errors.Is(err, ErrCodigoNaoEncontrado) || errors.Is(err, ErrCodigoInvalido)
}

func mensagemDoErro(err error) string {
	var jaResgatado *JaResgatadoError

	switch {
	case errors.As(err, &jaResgatado):
		return fmt.Sprintf(mensagemJaResgatado, jaResgatado.ProximoResgate.Format(time.RFC3339))
	case errors.Is(err, ErrCodigoInvalido):
		return mensagemCodigoInvalido
	case errors.Is(err, ErrCodigoNaoEncontrado):
		return mensagemCodigoNaoEncontrado
	case errors.Is(err, ErrColecaoCheia):
		return mensagemColecaoCheia
	default:
		return mensagemFalhaDeRede
	}
}

func escreve(stdout io.Writer, texto string, code int) int {
	if _, err := io.WriteString(stdout, texto); err != nil {
		return 1
	}

	return code
}
