import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { BoxScreen } from './BoxScreen.tsx'

describe('BoxScreen', () => {
  it('mostra o código da coleção formatado', () => {
    renderWithProviders(<BoxScreen code="A7K9F2QX" onLeave={vi.fn()} />)

    expect(screen.getByText('A7K9-F2QX')).toBeInTheDocument()
  })

  it('mostra as áreas de detalhe e da box', () => {
    renderWithProviders(<BoxScreen code="A7K9F2QX" onLeave={vi.fn()} />)

    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(
      screen.getByRole('region', { name: /current box/i }),
    ).toBeInTheDocument()
  })

  it('renderiza o conteúdo recebido nas duas áreas', () => {
    renderWithProviders(
      <BoxScreen
        code="A7K9F2QX"
        onLeave={vi.fn()}
        detail={<p>detalhe do pokemon</p>}
        box={<p>grade da box</p>}
      />,
    )

    expect(screen.getByText('detalhe do pokemon')).toBeInTheDocument()
    expect(screen.getByText('grade da box')).toBeInTheDocument()
  })

  it('desabilita as ações ainda não disponíveis', () => {
    renderWithProviders(<BoxScreen code="A7K9F2QX" onLeave={vi.fn()} />)

    expect(screen.getByRole('button', { name: /add pok/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^games$/i })).toBeDisabled()
  })

  it('aciona as ações quando disponíveis', async () => {
    const onAddPokemon = vi.fn()
    const onOpenGames = vi.fn()
    renderWithProviders(
      <BoxScreen
        code="A7K9F2QX"
        onLeave={vi.fn()}
        onAddPokemon={onAddPokemon}
        onOpenGames={onOpenGames}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /add pok/i }))
    await userEvent.click(screen.getByRole('button', { name: /^games$/i }))

    expect(onAddPokemon).toHaveBeenCalledOnce()
    expect(onOpenGames).toHaveBeenCalledOnce()
  })

  it('permite sair da coleção', async () => {
    const onLeave = vi.fn()
    renderWithProviders(<BoxScreen code="A7K9F2QX" onLeave={onLeave} />)

    await userEvent.click(screen.getByRole('button', { name: /switch/i }))

    expect(onLeave).toHaveBeenCalledOnce()
  })
})
