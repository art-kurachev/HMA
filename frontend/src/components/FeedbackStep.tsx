import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { EndIcon } from './Icons'
import instructionStyles from './InstructionStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'
import mixesStyles from './MixesStep.module.css'
import styles from './FeedbackStep.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_LIKE = '/icons/like.svg'
const ICON_DISLIKE = '/icons/dislike.svg'
const ICON_LIKE_DISLIKE = '/icons/like-dislike.svg'
const ICON_TICK_CIRCLE = '/icons/submit-tick.svg'

const REASONS = [
  { value: 'горчит', label: 'Горчит' },
  { value: 'слабый вкус', label: 'Слабый вкус' },
  { value: 'крепко', label: 'Крепко' },
  { value: 'просто не то', label: 'Просто, не то' },
]

interface FeedbackStepProps {
  onSubmit: (rating: boolean, reason: string) => void
  onSkip: () => void
  onBack: () => void
  loading: boolean
}

export function FeedbackStep({ onSubmit, onSkip, onBack, loading }: FeedbackStepProps) {
  const [rating, setRating] = useState<boolean | null>(null)
  const [reasons, setReasons] = useState<string[]>([])
  const [comment, setComment] = useState('')

  const toggleReason = (value: string) => {
    setReasons((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    )
  }

  const handleSubmit = () => {
    if (rating === null) return
    const reasonText = reasons.join(', ')
    const text = comment.trim() || (rating ? 'понравилось' : reasonText || 'другое')
    onSubmit(rating, text)
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

        <div className={`${instructionStyles.mainContent} ${styles.mainContentFront}`}>
          <div className={mixesStyles.titleRow}>
            <div className={mixesStyles.bowlPlaceholder} aria-hidden>
              <img src="/hand-thumbs-up.png" alt="" width={193} height={224} className={mixesStyles.bowlImage} />
            </div>
            <h2 className={mixesStyles.title}>Оценка рекомендации</h2>
          </div>
          <div className={styles.blocksLayout}>
            {/* Верхний ряд: два блока подряд */}
            <div className={styles.blocksRow}>
              <section className={styles.blockCard}>
                <h3 className={styles.blockTitle}>Зашло?</h3>
                <p className={styles.blockSubtitle}>Общие впечатления</p>
                <div className={styles.ratingButtons}>
                  <button
                    type="button"
                    className={`${styles.ratingBtn} ${rating === true ? styles.active : ''}`}
                    onClick={() => setRating(true)}
                    aria-label="Зашло"
                  >
                    <span className={styles.ratingIcon}>
                      <img src={ICON_LIKE} alt="" width={24} height={24} aria-hidden />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.ratingBtn} ${rating === false ? styles.active : ''}`}
                    onClick={() => setRating(false)}
                    aria-label="Не зашло"
                  >
                    <span className={styles.ratingIcon}>
                      <img src={ICON_DISLIKE} alt="" width={24} height={24} aria-hidden />
                    </span>
                  </button>
                </div>
              </section>

              <section className={styles.blockCard}>
                <h3 className={styles.blockTitle}>Почему?</h3>
                <p className={styles.blockSubtitle}>Если нет</p>
                <div className={styles.tagsGrid}>
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      className={`${styles.chip} ${reasons.includes(r.value) ? styles.active : ''}`}
                      onClick={() => toggleReason(r.value)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Нижний блок во всю ширину */}
            <section className={`${styles.blockCard} ${styles.blockComment}`}>
              <h3 className={styles.blockTitle}>Комментарий</h3>
              <input
                type="text"
                className={styles.input}
                placeholder="Получилось очень вкусно!"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </section>
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
