import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
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

    expect(
      within(todos[0]!).getByRole('button', { name: 'bulbasaur' }),
    ).toBeInTheDocument()
    expect(
      within(todos[29]!).getByRole('button', { name: 'mew' }),
    ).toBeInTheDocument()
    expect(within(todos[1]!).queryByRole('button')).not.toBeInTheDocument()
  })

  it('usa o apelido como identificação quando existe', () => {
    renderWithProviders(<BoxGrid pokemons={[pokemon({ nickname: 'Bulby' })]} />)

    expect(screen.getByRole('button', { name: 'Bulby' })).toBeInTheDocument()
  })

  it('não quebra quando a sprite não veio', () => {
    renderWithProviders(<BoxGrid pokemons={[pokemon({ sprite: '' })]} />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'bulbasaur' }),
    ).toBeInTheDocument()
  })

  it('avisa a seleção ao clicar num pokémon', async () => {
    const onSelect = vi.fn()
    renderWithProviders(
      <BoxGrid pokemons={[pokemon({ slot: 4 })]} onSelect={onSelect} />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'bulbasaur' }))

    expect(onSelect).toHaveBeenCalledWith(4)
  })

  it('carrega as sprites sob demanda, com espaço reservado', () => {
    renderWithProviders(<BoxGrid pokemons={[pokemon()]} />)

    const sprite = screen.getByRole('presentation', { hidden: true })

    expect(sprite).toHaveAttribute('loading', 'lazy')
    expect(sprite).toHaveAttribute('decoding', 'async')
    expect(sprite).toHaveAttribute('width', '48')
    expect(sprite).toHaveAttribute('height', '48')
  })

  it('marca o slot selecionado', () => {
    renderWithProviders(
      <BoxGrid pokemons={[pokemon({ slot: 4 })]} selectedSlot={4} />,
    )

    expect(screen.getByRole('button', { name: 'bulbasaur' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
