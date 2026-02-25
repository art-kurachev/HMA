import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { EndIcon } from './Icons'
import instructionStyles from './InstructionStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'
import styles from './FeedbackStep.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_LIKE_DISLIKE = '/icons/like-dislike.svg'
const ICON_TICK_CIRCLE = '/icons/tick-circle.svg'

const REASONS = [
  { value: 'горчит', label: 'Горчит' },
  { value: 'слабый вкус', label: 'Слабый вкус' },
  { value: 'слишком крепко', label: 'Слишком крепко' },
  { value: 'не зашло', label: 'Не зашло' },
  { value: 'другое', label: 'Другое' },
]

interface FeedbackStepProps {
  onSubmit: (rating: boolean, reason: string) => void
  onSkip: () => void
  onBack: () => void
  loading: boolean
}

export function FeedbackStep({ onSubmit, onSkip, onBack, loading }: FeedbackStepProps) {
  const [rating, setRating] = useState<boolean | null>(null)
  const [reason, setReason] = useState('')

  const handleSubmit = () => {
    if (rating === null) return
    onSubmit(rating, reason || (rating ? 'понравилось' : 'другое'))
  }

  return (
    <ScreenLayout onBack={onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={`${instructionStyles.wrap} ${styles.wrapFeedback}`}>
        <header className={welcomeStyles.topBar}>
          <div className={welcomeStyles.headerRow}>
            <img
              src={ICON_LOGO}
              alt="Iprit"
              className={welcomeStyles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className={instructionStyles.tag} aria-hidden>
              <span className={instructionStyles.tagText}>Фидбек</span>
              <img
                src={ICON_LIKE_DISLIKE}
                alt=""
                className={instructionStyles.tagIconSvg}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        </header>

        <div className={`${instructionStyles.bowlPlaceholder} ${styles.bowlPlaceholderBehind}`} aria-hidden>
          <img src="/hand-thumbs-up.png" alt="" width={193} height={224} className={instructionStyles.bowlImage} />
        </div>

        <div className={`${instructionStyles.mainContent} ${styles.mainContentFront}`}>
          <div className={instructionStyles.headerBlock}>
            <h2 className={instructionStyles.title}>Оценка рекомендации</h2>
          </div>

          <div className={instructionStyles.cardsList}>
            {/* Placeholder: вставить <img src="..." /> — картинка будет позже */}
            <div className={styles.imagePlaceholder} />

            <section className={instructionStyles.sectionCard}>
              <div className={styles.rating}>
                <button
                  type="button"
                  className={`${styles.ratingBtn} ${rating === true ? styles.active : ''}`}
                  onClick={() => setRating(true)}
                >
                  <span className={styles.ratingIcon}>👍</span>
                  Зашло
                </button>
                <button
                  type="button"
                  className={`${styles.ratingBtn} ${rating === false ? styles.active : ''}`}
                  onClick={() => setRating(false)}
                >
                  <span className={styles.ratingIcon}>👎</span>
                  Не зашло
                </button>
              </div>
            </section>

            {rating === false && (
              <section className={instructionStyles.sectionCard}>
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
                  value={REASONS.some((r) => r.value === reason) ? '' : reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </section>
            )}
          </div>
        </div>

        <div className={`${welcomeStyles.bottom} ${instructionStyles.bottomInstruction} ${styles.bottomFront}`}>
          <div className={instructionStyles.bottomBlock}>
            <button
              type="button"
              className={instructionStyles.finishBtn}
              onClick={onSkip}
              disabled={loading}
            >
              <EndIcon size={24} />
              Не отправлять
            </button>
            <button
              type="button"
              className={styles.submitBtnWhite}
              onClick={() => handleSubmit()}
              disabled={loading || rating === null}
            >
              <img src={ICON_TICK_CIRCLE} alt="" width={24} height={24} aria-hidden />
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </div>
      </div>
    </ScreenLayout>
  )
}
