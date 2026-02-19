import { ScreenLayout } from './ScreenLayout'
import styles from './WelcomeScreen.module.css'

const USAGE_KEY = 'hma_usage_count'

export function getUsageCount(): number {
  try {
    return parseInt(localStorage.getItem(USAGE_KEY) ?? '0', 10)
  } catch {
    return 0
  }
}

export function incrementUsageCount(): void {
  try {
    const n = getUsageCount() + 1
    localStorage.setItem(USAGE_KEY, String(n))
  } catch {
    /* ignore */
  }
}

interface WelcomeScreenProps {
  onStart: () => void
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const usageCount = getUsageCount()

  return (
    <ScreenLayout progressStep={1} totalSteps={3}>
      <div className={styles.welcome}>
        <p className={styles.subtitle}>Hookah maker assistant</p>
        <h1 className={styles.title}>
          Кальянный ассистент, а не просто «советчик по миксам»
        </h1>
        {usageCount > 0 && (
          <p className={styles.counter}>Использований: {usageCount}</p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onStart}
          >
            Хочу просто и быстро
            <span>→</span>
          </button>
          <button type="button" className={styles.secondaryBtn} aria-label="Настройки">
            ⚙
          </button>
        </div>
      </div>
    </ScreenLayout>
  )
}
