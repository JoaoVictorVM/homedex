import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../../../test/renderWithProviders.tsx'
import { FormSelect } from './FormSelect.tsx'

function mockForms(forms: string[], status = 200): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify(status === 200 ? { forms } : { error: 'x' }),
          { status, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    ),
  )
}

describe('FormSelect', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('não aparece com o nome vazio', () => {
    mockForms([])
    const { container } = renderWithProviders(
      <FormSelect name="" value="" onChange={vi.fn()} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('não aparece quando há só a forma padrão', async () => {
    mockForms(['bulbasaur'])
    const { container } = renderWithProviders(
      <FormSelect name="bulbasaur" value="" onChange={vi.fn()} />,
    )

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })
    expect(container).toBeEmptyDOMElement()
  })

  it('lista as formas alternativas quando existem', async () => {
    mockForms(['rattata', 'rattata-alola'])
    renderWithProviders(
      <FormSelect name="rattata" value="" onChange={vi.fn()} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    expect(
      screen.getByRole('option', { name: /default form/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('option', { name: 'rattata-alola' }),
    ).toBeInTheDocument()
  })

  it('avisa a forma escolhida', async () => {
    mockForms(['rattata', 'rattata-alola'])
    const onChange = vi.fn()
    renderWithProviders(
      <FormSelect name="rattata" value="" onChange={onChange} />,
    )

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    await userEvent.selectOptions(screen.getByRole('combobox'), 'rattata-alola')

    expect(onChange).toHaveBeenCalledWith('rattata-alola')
  })
})
