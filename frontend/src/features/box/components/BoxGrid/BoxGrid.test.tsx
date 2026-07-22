import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { BoxGrid } from './BoxGrid.tsx'
import type { Pokemon } from '../../../pokemon/pokemon.schema.ts'

function pokemon(overrides: Partial<Pokemon> = {}): Pokemon {
  return {
    id: 1,
    pokemonName: 'bulbasaur',
    nickname: '',
    isShiny: false,
    gender: 'male',
    form: '',
    gameId: 10,
    boxNumber: 1,
    slot: 0,
    sprite: 'https://sprites/1.png',
    ...overrides,
  }
}

function slots(): HTMLElement[] {
  return within(screen.getByRole('list')).getAllByRole('listitem')
}

describe('BoxGrid', () => {
  it('renderiza sempre os 30 slots da box', () => {
    renderWithProviders(<BoxGrid pokemons={[]} />)

    expect(slots()).toHaveLength(30)
  })

  it('coloca cada pokémon no seu slot', () => {
    renderWithProviders(
      <BoxGrid
        pokemons={[
          pokemon({ id: 1, slot: 0 }),
          pokemon({ id: 2, slot: 29, pokemonName: 'mew' }),
        ]}
      />,
    )

    const todos = slots()

    expect(within(todos[0]!).getByRole('img')).toHaveAttribute(
      'alt',
      'bulbasaur',
    )
    expect(within(todos[29]!).getByRole('img')).toHaveAttribute('alt', 'mew')
    expect(within(todos[1]!).queryByRole('img')).not.toBeInTheDocument()
  })

  it('usa o apelido como identificação quando existe', () => {
    renderWithProviders(<BoxGrid pokemons={[pokemon({ nickname: 'Bulby' })]} />)

    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Bulby')
  })

  it('não quebra quando a sprite não veio', () => {
    renderWithProviders(<BoxGrid pokemons={[pokemon({ sprite: '' })]} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(slots()).toHaveLength(30)
  })
})
