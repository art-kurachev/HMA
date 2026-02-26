import { createPortal } from 'react-dom'
import styles from './Loader.module.css'

interface LoaderProps {
  message?: string
}

export function Loader({ message = 'Загрузка...' }: LoaderProps) {
  const content = (
    <div className={styles.overlay} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <p className={styles.message}>{message}</p>
    </div>
  )
  return createPortal(content, document.body)
}
