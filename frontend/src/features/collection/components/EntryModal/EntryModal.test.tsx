import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { I18nProvider } from '../../../../shared/i18n/I18nProvider.tsx'
import { EntryModal } from './EntryModal.tsx'

function renderModal(
  onSubmitCode = vi.fn(),
  onCreate = vi.fn(),
): { onSubmitCode: typeof onSubmitCode; onCreate: typeof onCreate } {
  render(
    <I18nProvider>
      <EntryModal onSubmitCode={onSubmitCode} onCreate={onCreate} />
    </I18nProvider>,
  )

  return { onSubmitCode, onCreate }
}

function codeInput(): HTMLElement {
  return screen.getByRole('textbox')
}

describe('EntryModal', () => {
  it('mostra as duas opções de entrada', () => {
    renderModal()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
  })

  it('chama onCreate ao escolher nova coleção', async () => {
    const { onCreate } = renderModal()

    await userEvent.click(screen.getByRole('button', { name: /create/i }))

    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('mantém o envio desabilitado até o código ser válido', async () => {
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: /code/i }))
    expect(screen.getByRole('button', { name: /enter/i })).toBeDisabled()

    await userEvent.type(codeInput(), 'A7K9F2Q')
    expect(screen.getByRole('button', { name: /enter/i })).toBeDisabled()

    await userEvent.type(codeInput(), 'X')
    expect(screen.getByRole('button', { name: /enter/i })).toBeEnabled()
  })

  it('envia o código normalizado', async () => {
    const { onSubmitCode } = renderModal()

    await userEvent.click(screen.getByRole('button', { name: /code/i }))
    await userEvent.type(codeInput(), 'a7k9-f2qx')
    await userEvent.click(screen.getByRole('button', { name: /enter/i }))

    expect(onSubmitCode).toHaveBeenCalledWith('A7K9F2QX')
  })

  it('converte a digitação para maiúsculas', async () => {
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: /code/i }))
    await userEvent.type(codeInput(), 'a7k9')

    expect(codeInput()).toHaveValue('A7K9')
  })

  it('volta para a escolha inicial limpando o código', async () => {
    renderModal()

    await userEvent.click(screen.getByRole('button', { name: /code/i }))
    await userEvent.type(codeInput(), 'A7K9')
    await userEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /code/i }))
    expect(codeInput()).toHaveValue('')
  })
})
