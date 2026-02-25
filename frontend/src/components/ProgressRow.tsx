import styles from './ProgressRow.module.css'

interface ProgressRowProps {
  /** Всего сегментов (полос) */
  total?: number
  /** Индекс активного сегмента (0-based) — для экранов навигации */
  activeStep?: number
  /** Количество заполненных полос (0..4) — режим Setup: полупрозрачные → #FF6544 по мере выбора */
  filledCount?: number
}

export function ProgressRow({ total = 3, activeStep = 0, filledCount }: ProgressRowProps) {
  const useFilledMode = filledCount !== undefined
  const bars = useFilledMode ? 4 : total

  return (
    <div className={styles.progressRow}>
      {Array.from({ length: bars }, (_, i) => {
        if (useFilledMode) {
          const filled = i < filledCount
          return (
            <div
              key={i}
              className={filled ? `${styles.progressBar} ${styles.progressBarFilled}` : `${styles.progressBar} ${styles.progressBarEmpty}`}
            />
          )
        }
        const active = i === activeStep
        return (
          <div
            key={i}
            className={active ? styles.progressBar : `${styles.progressBar} ${styles.progressBarInactive}`}
          />
        )
      })}
    </div>
  )
}
