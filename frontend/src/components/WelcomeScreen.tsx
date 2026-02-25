import { useEffect, useState } from 'react'

import { getQuota } from '../api'
import { ScreenLayout } from './ScreenLayout'
import progressRowStyles from './ProgressRow.module.css'
import styles from './WelcomeScreen.module.css'

/* Локальные SVG из frontend/public/icons/ (имена как в макете) */
const ICON_LOGO = '/icons/Union.svg'
const ICON_DATABASE = '/icons/Database.svg'
const ICON_SHARE_CIRCLE = '/icons/ShareCircle.svg'
const ICON_ROUND_GRAPH = '/icons/RoundGraph.svg'

const IMG_HOOKAH = '/hookah.png'

interface WelcomeScreenProps {
  telegramId: number
  onStart: () => void
  onSetup: () => void
  onOpenShelf?: () => void
}

export function WelcomeScreen({
  telegramId,
  onStart,
  onSetup,
  onOpenShelf,
}: WelcomeScreenProps) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    getQuota(telegramId)
      .then((q) => setRemaining(q.remaining))
      .catch(() => setRemaining(0))
  }, [telegramId])

  const quotaDisplay =
    remaining === null ? '—' : remaining === -1 ? '∞' : String(remaining)

  return (
    <>
      <ScreenLayout progressStep={0} totalSteps={0} fullBleed>
        <div className={styles.welcome}>
          <div className={styles.heroWrap}>
          <div className={styles.heroInner}>
            <img
              src={IMG_HOOKAH}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>

        <header className={styles.topBar}>
          <div className={progressRowStyles.progressRow} aria-hidden />
          <div className={styles.headerRow}>
            <img
              src={ICON_LOGO}
              alt="Iprit"
              className={styles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <button
              type="button"
              className={styles.shelfBtn}
              onClick={onOpenShelf}
              aria-label="Моя полка"
            >
              Моя полка
              <img
                src={ICON_DATABASE}
                alt=""
                className={styles.shelfBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
          </div>
        </header>

        <div className={styles.bottom}>
          <div className={styles.quotaRow}>
            <div className={styles.quotaBadge}>{quotaDisplay}</div>
            <span className={styles.quotaLabel}>
              Доступно
              <br />
              рекомендаций
            </span>
          </div>
          <h1 className={styles.title}>
            {`Ассистент —\nнастройка,\nпрогрев,\nрезультат.`}
          </h1>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.primaryBtn} ${styles.primaryBtnPadding} ${styles.primaryBtnWelcome}`}
              onClick={onStart}
            >
              Просто и быстро
              <img
                src={ICON_SHARE_CIRCLE}
                alt=""
                className={styles.primaryBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSetup}
              title="Сетап"
              aria-label="Сетап"
            >
              Сетап
              <img
                src={ICON_ROUND_GRAPH}
                alt=""
                className={styles.secondaryBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
          </div>
        </div>
      </div>
    </ScreenLayout>
    </>
  )
}
