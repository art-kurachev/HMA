import { useState, useEffect } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { LoginIcon } from './Icons'
import { getQuota } from '../api'
import styles from './WelcomeScreen.module.css'

interface WelcomeScreenProps {
  onStart: () => void
  telegramId: number
}

export function WelcomeScreen({ onStart, telegramId }: WelcomeScreenProps) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    getQuota(telegramId).then((q) => setRemaining(q.remaining)).catch(() => setRemaining(0))
  }, [telegramId])

  const counterText =
    remaining === null ? 'Загрузка...' : remaining === -1 ? 'Без лимитов' : `Осталось запросов: ${remaining}`

  return (
    <ScreenLayout progressStep={1} totalSteps={3}>
      <div className={styles.welcome}>
        <img src="/welcome-screen.png" alt="" className={styles.figmaBg} aria-hidden onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <span className={styles.alphaBadge}>Альфа-тест</span>
        <p className={styles.subtitle}>Hookah maker assistent</p>
        <h1 className={styles.title}>
          {`Кальянный ассистент, а\u00A0не\u00A0просто «советчик по\u00A0миксам»`}
        </h1>
        <p className={styles.counter}>{counterText}</p>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onStart}
          >
            Хочу просто и быстро
            <LoginIcon size={18} />
          </button>
        </div>
      </div>
    </ScreenLayout>
  )
}
