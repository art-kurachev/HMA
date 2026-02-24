import styles from './ProgressRow.module.css'

interface ProgressRowProps {
  /** Всего сегментов (полос) */
  total?: number
  /** Индекс активного сегмента (0-based) */
  activeStep?: number
}

export function ProgressRow({ total = 3, activeStep = 0 }: ProgressRowProps) {
  return (
    <div className={styles.progressRow}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={i === activeStep ? styles.progressBar : `${styles.progressBar} ${styles.progressBarInactive}`}
        />
      ))}
    </div>
  )
}
