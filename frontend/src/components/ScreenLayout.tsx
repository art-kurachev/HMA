import styles from './ScreenLayout.module.css'

interface ScreenLayoutProps {
  children: React.ReactNode
  onBack?: () => void
  /** Скрыть кнопку «Назад» сверху (навигация только снизу) */
  hideBackButton?: boolean
  /** Текущий шаг (1-based), отображается один активный сегмент */
  currentStep?: number
  /** Всего шагов (сегментов в индикаторе) */
  totalSteps?: number
  /** Устаревший вариант: сколько шагов заполнено (0..totalSteps) */
  progressStep?: number
  fullBleed?: boolean
}

export function ScreenLayout({ children, onBack, hideBackButton = false, currentStep, totalSteps = 4, progressStep = 0, fullBleed = false }: ScreenLayoutProps) {
  const showProgress = totalSteps > 0
  const useCurrentStep = currentStep != null

  return (
    <div className={styles.screen}>
      {showProgress && (
        <div className={styles.progress}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const isActive = useCurrentStep
              ? i + 1 === currentStep
              : i < progressStep
            return (
              <div
                key={i}
                className={`${styles.progressDot} ${isActive ? styles.active : ''}`}
              />
            )
          })}
        </div>
      )}
      {onBack && !hideBackButton && (
        <button type="button" className={styles.back} onClick={onBack} aria-label="Назад">
          ←
        </button>
      )}
      <div className={fullBleed ? `${styles.content} ${styles.contentFullBleed}` : styles.content}>{children}</div>
    </div>
  )
}
