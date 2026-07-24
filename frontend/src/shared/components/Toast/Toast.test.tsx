import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withProviders } from '../../../test/renderWithProviders.tsx'
import { Toast } from './Toast.tsx'

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mostra a mensagem', () => {
    render(withProviders(<Toast message="Falhou" onDismiss={vi.fn()} />))

    expect(screen.getByRole('alert')).toHaveTextContent('Falhou')
  })

  it('some sozinho após o tempo limite', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(withProviders(<Toast message="Falhou" onDismiss={onDismiss} />))

    expect(onDismiss).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(4000)
    })

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('some ao clicar em fechar', async () => {
    const onDismiss = vi.fn()
    render(withProviders(<Toast message="Falhou" onDismiss={onDismiss} />))

    await userEvent.click(screen.getByRole('button'))

    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
