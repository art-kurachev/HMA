import styles from './ScreenLayout.module.css'

interface ScreenLayoutProps {
  children: React.ReactNode
  onBack?: () => void
  progressStep?: number
  totalSteps?: number
}

export function ScreenLayout({ children, onBack, progressStep = 0, totalSteps = 4 }: ScreenLayoutProps) {
  return (
    <div className={styles.screen}>
      {totalSteps > 0 && (
        <div className={styles.progress}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`${styles.progressDot} ${i < progressStep ? styles.active : ''}`}
            />
          ))}
        </div>
      )}
      {onBack && (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Назад">
          ←
        </button>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  )
}
