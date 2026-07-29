package main

import (
	"fmt"
	"io"
	"os"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

const usageText = `homedex - companheiro de terminal do HomeDex

Uso:
  homedex <comando>

Comandos:
  config   Mostra a URL base da API HomeDex em uso
  help     Mostra esta mensagem

Ambiente:
  HOMEDEX_API_URL   Sobrescreve a URL base da API (padrão: produção)
`

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}

func run(args []string, stdout, stderr io.Writer) int {
	if len(args) == 0 {
		return write(stdout, usageText, 0)
	}

	switch args[0] {
	case "help", "-h", "--help":
		return write(stdout, usageText, 0)
	case "config":
		return write(stdout, config.Resolve()+"\n", 0)
	default:
		return write(stderr, fmt.Sprintf("comando desconhecido: %q\n\n%s", args[0], usageText), 2)
	}
}

func write(w io.Writer, text string, code int) int {
	if _, err := io.WriteString(w, text); err != nil {
		return 1
	}

	return code
}
