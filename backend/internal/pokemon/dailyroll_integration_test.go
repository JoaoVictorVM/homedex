package pokemon

import (
	"context"
	"errors"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/JoaoVictorVM/homedex/backend/internal/collection"
	"github.com/JoaoVictorVM/homedex/backend/internal/games"
)

const testDatabaseURLEnvVar = "HOMEDEX_TEST_DATABASE_URL"

func poolDeTeste(t *testing.T) *pgxpool.Pool {
	t.Helper()

	url := os.Getenv(testDatabaseURLEnvVar)
	if url == "" {
		t.Skipf("defina %s para rodar os testes de integração", testDatabaseURLEnvVar)
	}

	pool, err := pgxpool.New(t.Context(), url)
	if err != nil {
		t.Fatalf("abrir pool de teste: %v", err)
	}
	t.Cleanup(pool.Close)

	if err := pool.Ping(t.Context()); err != nil {
		t.Fatalf("conectar no banco de teste: %v", err)
	}

	return pool
}

func colecaoDeTeste(t *testing.T, pool *pgxpool.Pool) collection.Collection {
	t.Helper()

	repo := collection.NewRepository(pool)
	service := collection.NewService(repo, games.OfficialNames(), games.SystemGameName)

	criada, err := service.Create(t.Context())
	if err != nil {
		t.Fatalf("criar coleção de teste: %v", err)
	}

	t.Cleanup(func() {
		ctx := context.Background()
		if _, err := pool.Exec(ctx, `DELETE FROM collections WHERE id = $1`, criada.ID); err != nil {
			t.Errorf("limpar coleção de teste: %v", err)
		}
	})

	return criada
}

func idDoJogoDoSistema(t *testing.T, pool *pgxpool.Pool, collectionID int64) int64 {
	t.Helper()

	id, err := games.NewRepository(pool).SystemGameID(t.Context(), collectionID)
	if err != nil {
		t.Fatalf("buscar jogo do sistema: %v", err)
	}

	return id
}

func contaPokemons(t *testing.T, pool *pgxpool.Pool, collectionID int64) int {
	t.Helper()

	var total int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM pokemons WHERE collection_id = $1`, collectionID,
	).Scan(&total); err != nil {
		t.Fatalf("contar pokémons: %v", err)
	}

	return total
}

func ultimoResgate(t *testing.T, pool *pgxpool.Pool, collectionID int64) *time.Time {
	t.Helper()

	var quando *time.Time
	if err := pool.QueryRow(t.Context(),
		`SELECT last_roll_claimed_at FROM collections WHERE id = $1`, collectionID,
	).Scan(&quando); err != nil {
		t.Fatalf("consultar último resgate: %v", err)
	}

	return quando
}

func rollDeTeste() DailyRoll {
	return DailyRoll{PokemonName: "pikachu", Gender: GenderMale}
}

func TestIntegracaoPrimeiroResgateDoDiaGravaTudoJunto(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	repo := NewRepository(pool)

	criado, _, err := repo.RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste())
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if criado.ID == 0 {
		t.Error("pokémon criado sem id")
	}
	if criado.BoxNumber != 1 || criado.Slot != 0 {
		t.Errorf("posição = box %d slot %d, esperado box 1 slot 0", criado.BoxNumber, criado.Slot)
	}
	if contaPokemons(t, pool, colecao.ID) != 1 {
		t.Error("o pokémon não foi persistido")
	}
	if ultimoResgate(t, pool, colecao.ID) == nil {
		t.Error("last_roll_claimed_at não foi gravado junto com o insert")
	}
}

func TestIntegracaoResgateUsaOJogoDoSistema(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)

	criado, _, err := NewRepository(pool).RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste())
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if esperado := idDoJogoDoSistema(t, pool, colecao.ID); criado.GameID != esperado {
		t.Errorf("game_id = %d, esperado o jogo do sistema %d", criado.GameID, esperado)
	}
}

func TestIntegracaoSegundoResgateNoMesmoDiaEhBloqueado(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	repo := NewRepository(pool)

	if _, _, err := repo.RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste()); err != nil {
		t.Fatalf("primeiro resgate: erro inesperado: %v", err)
	}

	antes := ultimoResgate(t, pool, colecao.ID)

	_, proximo, err := repo.RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste())
	if !errors.Is(err, ErrDailyRollClaimed) {
		t.Fatalf("erro = %v, esperado ErrDailyRollClaimed", err)
	}

	if proximo.IsZero() {
		t.Error("o bloqueio deveria informar quando o próximo resgate libera")
	}
	if !proximo.After(time.Now().UTC()) {
		t.Errorf("próximo resgate %s deveria estar no futuro", proximo)
	}
	if contaPokemons(t, pool, colecao.ID) != 1 {
		t.Error("o segundo resgate não deveria ter inserido nada")
	}
	if depois := ultimoResgate(t, pool, colecao.ID); !depois.Equal(*antes) {
		t.Error("last_roll_claimed_at não deveria ter mudado")
	}
}

func TestIntegracaoResgateLiberaAposMeiaNoiteUTC(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	repo := NewRepository(pool)

	if _, _, err := repo.RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste()); err != nil {
		t.Fatalf("primeiro resgate: erro inesperado: %v", err)
	}

	if _, err := pool.Exec(t.Context(),
		`UPDATE collections
		 SET last_roll_claimed_at = ((now() AT TIME ZONE 'UTC')::date - 1 + time '23:59')
		     AT TIME ZONE 'UTC'
		 WHERE id = $1`,
		colecao.ID,
	); err != nil {
		t.Fatalf("recuar o último resgate para ontem: %v", err)
	}

	if _, _, err := repo.RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste()); err != nil {
		t.Fatalf("resgate do novo dia deveria funcionar, veio: %v", err)
	}

	if contaPokemons(t, pool, colecao.ID) != 2 {
		t.Error("o resgate do novo dia deveria ter inserido um segundo pokémon")
	}
}

func TestIntegracaoColecaoCheiaNaoGravaNada(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	sistema := idDoJogoDoSistema(t, pool, colecao.ID)

	for slot := 0; slot < SlotsPerBox; slot++ {
		if _, err := pool.Exec(t.Context(),
			`INSERT INTO pokemons (collection_id, game_id, pokemon_name, gender, box_number, slot)
			 VALUES ($1, $2, 'rattata', 'male', 1, $3)`,
			colecao.ID, sistema, slot,
		); err != nil {
			t.Fatalf("preencher slot %d: %v", slot, err)
		}
	}

	_, _, err := NewRepository(pool).RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste())
	if !errors.Is(err, ErrCollectionFull) {
		t.Fatalf("erro = %v, esperado ErrCollectionFull", err)
	}

	if contaPokemons(t, pool, colecao.ID) != SlotsPerBox {
		t.Error("nada deveria ter sido inserido na coleção cheia")
	}
	if ultimoResgate(t, pool, colecao.ID) != nil {
		t.Error("o dia não deveria ter sido consumido quando a coleção está cheia")
	}
}

func TestIntegracaoResgateOcupaOPrimeiroSlotLivre(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	sistema := idDoJogoDoSistema(t, pool, colecao.ID)

	for _, slot := range []int{0, 1, 3} {
		if _, err := pool.Exec(t.Context(),
			`INSERT INTO pokemons (collection_id, game_id, pokemon_name, gender, box_number, slot)
			 VALUES ($1, $2, 'rattata', 'male', 1, $3)`,
			colecao.ID, sistema, slot,
		); err != nil {
			t.Fatalf("preencher slot %d: %v", slot, err)
		}
	}

	criado, _, err := NewRepository(pool).RedeemDailyRoll(t.Context(), colecao.ID, rollDeTeste())
	if err != nil {
		t.Fatalf("erro inesperado: %v", err)
	}

	if criado.BoxNumber != 1 || criado.Slot != 2 {
		t.Errorf("posição = box %d slot %d, esperado box 1 slot 2", criado.BoxNumber, criado.Slot)
	}
}

func TestIntegracaoResgatesConcorrentesSerializam(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	repo := NewRepository(pool)

	const tentativas = 4

	var wg sync.WaitGroup
	erros := make([]error, tentativas)

	for i := range tentativas {
		wg.Add(1)
		go func() {
			defer wg.Done()
			_, _, erros[i] = repo.RedeemDailyRoll(context.Background(), colecao.ID, rollDeTeste())
		}()
	}
	wg.Wait()

	sucessos := 0
	bloqueios := 0
	for _, err := range erros {
		switch {
		case err == nil:
			sucessos++
		case errors.Is(err, ErrDailyRollClaimed):
			bloqueios++
		default:
			t.Errorf("erro inesperado: %v", err)
		}
	}

	if sucessos != 1 {
		t.Errorf("sucessos = %d, esperado exatamente 1", sucessos)
	}
	if bloqueios != tentativas-1 {
		t.Errorf("bloqueios = %d, esperado %d", bloqueios, tentativas-1)
	}
	if total := contaPokemons(t, pool, colecao.ID); total != 1 {
		t.Errorf("pokémons inseridos = %d, esperado 1", total)
	}
}

func TestIntegracaoColecaoNovaJaNasceComOJogoDoSistema(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)

	var nome string
	var visible bool
	var isOfficial bool

	if err := pool.QueryRow(t.Context(),
		`SELECT name, visible, is_official FROM games WHERE collection_id = $1 AND is_system`,
		colecao.ID,
	).Scan(&nome, &visible, &isOfficial); err != nil {
		t.Fatalf("consultar jogo do sistema: %v", err)
	}

	if nome != games.SystemGameName {
		t.Errorf("nome = %q, esperado %q", nome, games.SystemGameName)
	}
	if visible {
		t.Error("o jogo do sistema não deveria nascer visível")
	}
	if isOfficial {
		t.Error("o jogo do sistema não deveria ser marcado como oficial")
	}
}

func TestIntegracaoJogoDoSistemaEhProtegidoContraGestao(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)
	sistema := idDoJogoDoSistema(t, pool, colecao.ID)

	repo := games.NewRepository(pool)

	if _, err := repo.UpdateName(t.Context(), colecao.ID, sistema, "Outro Nome"); !errors.Is(err, games.ErrSystem) {
		t.Errorf("renomear: erro = %v, esperado ErrSystem", err)
	}
	if _, err := repo.UpdateVisibility(t.Context(), colecao.ID, sistema, true); !errors.Is(err, games.ErrSystem) {
		t.Errorf("ocultar/exibir: erro = %v, esperado ErrSystem", err)
	}
	if err := repo.Delete(t.Context(), colecao.ID, sistema); !errors.Is(err, games.ErrSystem) {
		t.Errorf("excluir: erro = %v, esperado ErrSystem", err)
	}
}

func TestIntegracaoHackromNaoPodeUsarONomeHomeDex(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)

	repo := games.NewRepository(pool)

	for _, nome := range []string{"HomeDex", "homedex", "HOMEDEX"} {
		if _, err := repo.Insert(t.Context(), colecao.ID, nome); !errors.Is(err, games.ErrNameTaken) {
			t.Errorf("nome %q: erro = %v, esperado ErrNameTaken", nome, err)
		}
	}
}

func TestIntegracaoBackfillEhIdempotente(t *testing.T) {
	pool := poolDeTeste(t)
	colecao := colecaoDeTeste(t, pool)

	const backfill = `
		INSERT INTO games (collection_id, name, is_official, is_system, visible)
		SELECT c.id, 'HomeDex', false, true, false
		FROM collections c
		WHERE NOT EXISTS (
		    SELECT 1 FROM games g WHERE g.collection_id = c.id AND g.is_system
		)`

	for i := 0; i < 3; i++ {
		if _, err := pool.Exec(t.Context(), backfill); err != nil {
			t.Fatalf("rodar backfill (tentativa %d): %v", i+1, err)
		}
	}

	var total int
	if err := pool.QueryRow(t.Context(),
		`SELECT count(*) FROM games WHERE collection_id = $1 AND is_system`, colecao.ID,
	).Scan(&total); err != nil {
		t.Fatalf("contar jogos do sistema: %v", err)
	}

	if total != 1 {
		t.Errorf("jogos do sistema = %d, esperado 1 mesmo após rodar o backfill 3 vezes", total)
	}
}
