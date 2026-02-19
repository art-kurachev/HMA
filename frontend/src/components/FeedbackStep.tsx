import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import styles from './FeedbackStep.module.css'

const REASONS = [
  { value: 'горчит', label: 'Горчит' },
  { value: 'слабый вкус', label: 'Слабый вкус' },
  { value: 'слишком крепко', label: 'Слишком крепко' },
  { value: 'не зашло', label: 'Не зашло' },
  { value: 'другое', label: 'Другое' },
]

interface FeedbackStepProps {
  onSubmit: (rating: boolean, reason: string) => void
  onBack: () => void
  loading: boolean
}

export function FeedbackStep({ onSubmit, onBack, loading }: FeedbackStepProps) {
  const [rating, setRating] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === null) return
    onSubmit(rating, reason || (rating ? 'понравилось' : 'другое'))
  }

  return (
    <ScreenLayout onBack={onBack} totalSteps={0}>
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Как микса?</h2>
      <div className={styles.rating}>
        <button
          type="button"
          className={`${styles.ratingBtn} ${rating === true ? styles.active : ''}`}
          onClick={() => setRating(true)}
        >
          👍 Зашло
        </button>
        <button
          type="button"
          className={`${styles.ratingBtn} ${rating === false ? styles.active : ''}`}
          onClick={() => setRating(false)}
        >
          👎 Не зашло
        </button>
      </div>

      <label className={styles.label}>Почему? (если не зашло)</label>
      <div className={styles.reasons}>
        {REASONS.map((r) => (
          <button
            key={r.value}
            type="button"
            className={`${styles.chip} ${reason === r.value ? styles.active : ''}`}
            onClick={() => setReason(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        className={styles.input}
        placeholder="Свой вариант (опционально)"
        value={REASONS.some(r => r.value === reason) ? '' : reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <button type="submit" className={styles.submit} disabled={loading || rating === null}>
        {loading ? 'Отправка...' : 'Отправить'}
      </button>
    </form>
    </ScreenLayout>
  )
}
