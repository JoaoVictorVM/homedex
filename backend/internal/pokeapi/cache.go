package pokeapi

import "sync"

const defaultCacheSize = 5000

type cache[V any] struct {
	mu      sync.RWMutex
	entries map[string]V
	maxSize int
}

func newCache[V any](maxSize int) *cache[V] {
	return &cache[V]{
		entries: make(map[string]V),
		maxSize: maxSize,
	}
}

func (c *cache[V]) get(key string) (V, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	value, ok := c.entries[key]

	return value, ok
}

func (c *cache[V]) set(key string, value V) {
	c.mu.Lock()
	defer c.mu.Unlock()

	if len(c.entries) >= c.maxSize {
		c.entries = make(map[string]V)
	}

	c.entries[key] = value
}
