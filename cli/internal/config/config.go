package config

import "os"

const (
	APIURLEnvVar = "HOMEDEX_API_URL"

	defaultAPIURL = "https://homedex-server.onrender.com"
)

func Resolve() string {
	if url := os.Getenv(APIURLEnvVar); url != "" {
		return url
	}

	return defaultAPIURL
}
