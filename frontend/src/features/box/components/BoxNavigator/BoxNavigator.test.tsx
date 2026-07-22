import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { BoxNavigator } from './BoxNavigator.tsx'

describe('BoxNavigator', () => {
  it('mostra a box atual e o intervalo de posições', () => {
    renderWithProviders(
      <BoxNavigator boxNumber={4} boxCount={5} onChange={vi.fn()} />,
    )

    expect(screen.getByText('Box 4')).toBeInTheDocument()
    expect(screen.getByText('91-120')).toBeInTheDocument()
  })

  it('avança e retrocede entre boxes', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <BoxNavigator boxNumber={2} boxCount={3} onChange={onChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /next box/i }))
    expect(onChange).toHaveBeenCalledWith(3)

    await userEvent.click(screen.getByRole('button', { name: /previous box/i }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('circula da última para a primeira', async () => {
    const onChange = vi.fn()
    renderWithProviders(
      <BoxNavigator boxNumber={3} boxCount={3} onChange={onChange} />,
    )

    await userEvent.click(screen.getByRole('button', { name: /next box/i }))

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('desabilita a navegação quando só existe uma box', () => {
    renderWithProviders(
      <BoxNavigator boxNumber={1} boxCount={1} onChange={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /next box/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /previous box/i })).toBeDisabled()
  })
})
