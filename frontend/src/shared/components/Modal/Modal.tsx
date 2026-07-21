import { useId } from 'react'
import type { JSX, ReactNode } from 'react'
import styles from './Modal.module.css'

type ModalProps = {
  title: string
  children: ReactNode
}

export function Modal({ title, children }: ModalProps): JSX.Element {
  const titleId = useId()

  return (
    <div className={styles.overlay}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id={titleId}>
            {title}
          </h2>
        </header>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
