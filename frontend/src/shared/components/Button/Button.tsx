import type { ButtonHTMLAttributes, JSX } from 'react'
import styles from './Button.module.css'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}

export function Button({
  variant = 'primary',
  className,
  type = 'button',
  ...rest
}: ButtonProps): JSX.Element {
  const classes = [
    styles.button,
    variant === 'secondary' ? styles.secondary : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <button className={classes} type={type} {...rest} />
}
