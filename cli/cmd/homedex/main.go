package main

import (
	"fmt"
	"io"
	"os"

	"github.com/JoaoVictorVM/homedex/cli/internal/config"
)

const usageText = `homedex - HomeDex terminal companion

Usage:
  homedex <command>

Commands:
  config   Show the HomeDex API base URL currently in use
  help     Show this message

Environment:
  HOMEDEX_API_URL   Overrides the HomeDex API base URL (defaults to production)
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
		return write(stderr, fmt.Sprintf("unknown command: %q\n\n%s", args[0], usageText), 2)
	}
}

func write(w io.Writer, text string, code int) int {
	if _, err := io.WriteString(w, text); err != nil {
		return 1
	}

	return code
}
