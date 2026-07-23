import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../test/renderWithProviders.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'

function render(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  renderWithProviders(
    <ConfirmDialog
      title="Remover"
      message="Tem certeza?"
      confirmLabel="Remover"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )

  return { onConfirm, onCancel }
}

describe('ConfirmDialog', () => {
  it('mostra título e mensagem', () => {
    render()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Tem certeza?')).toBeInTheDocument()
  })

  it('confirma e cancela', async () => {
    const { onConfirm, onCancel } = render()

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(onConfirm).toHaveBeenCalledOnce()

    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('mostra erro e desabilita durante a ação', () => {
    render({ errorMessage: 'Falhou', isPending: true })

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
    expect(screen.getByRole('button', { name: /loading/i })).toBeDisabled()
  })
})
