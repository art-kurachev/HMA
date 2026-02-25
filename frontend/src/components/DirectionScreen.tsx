import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { ProgressRow } from './ProgressRow'
import { ArrowLeftIcon } from './Icons'
import styles from './DirectionScreen.module.css'
import welcomeStyles from './WelcomeScreen.module.css'

export type Direction = 'movie' | 'relax' | 'surprise' | null

interface DirectionScreenProps {
  onBack: () => void
  onNext: (direction: Direction) => void
}

const ICON_LOGO = '/icons/Union.svg'
const ICON_SHARE_CIRCLE = '/icons/ShareCircle.svg'
const ICON_PLAY = '/icons/Play.svg'
const ICON_MEDITATION = '/icons/Meditation.svg'
const ICON_FLAME = '/icons/Flame.svg'

export function DirectionScreen({ onBack, onNext }: DirectionScreenProps) {
  const [selected, setSelected] = useState<Direction>(null)

  const handleCardClick = (direction: Direction) => {
    setSelected(direction)
    onNext(direction)
  }

  return (
    <ScreenLayout onBack={onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={styles.wrap}>
        {/* Хедер по макету: только прогресс-бары + лого + тег (без заголовка) */}
        <header className={welcomeStyles.topBar}>
          <ProgressRow total={3} activeStep={1} />
          <div className={welcomeStyles.headerRow}>
            <img src={ICON_LOGO} alt="Iprit" className={welcomeStyles.logo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <div className={styles.tag} aria-hidden>
              <span className={styles.tagText}>Просто и быстро</span>
              <img src={ICON_SHARE_CIRCLE} alt="" className={styles.tagIconSvg} aria-hidden />
            </div>
          </div>
        </header>

        {/* Контентный блок по макету (bottom-0): заголовок → карточки → кнопка */}
        <div className={styles.mainContent}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>Твоя цель вечера?</h2>
          </div>

          <div className={styles.bowlPlaceholder} aria-hidden>
            <img src="/bowl.png" alt="" width={193} height={224} className={styles.bowlImage} />
          </div>

          <div className={styles.cardsGrid}>
          <div className={styles.colLeft}>
            <button
              type="button"
              className={`${styles.card} ${styles.cardMovie} ${selected === 'movie' ? styles.selected : ''}`}
              onClick={() => handleCardClick('movie')}
            >
              <div className={styles.cardIconWrap}>
                <img src={ICON_PLAY} alt="" width={24} height={24} aria-hidden />
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardLabel}>Под фильм</span>
                <span className={styles.cardDesc}>Что-то привычное<br />и не навязчивое</span>
              </div>
            </button>
            <button
              type="button"
              className={`${styles.card} ${styles.cardRelax} ${selected === 'relax' ? styles.selected : ''}`}
              onClick={() => handleCardClick('relax')}
            >
              <div className={styles.cardText}>
                <span className={styles.cardLabel}>Расслабиться</span>
                <span className={styles.cardDesc}>Средние и крепкие<br />вариации табака</span>
              </div>
              <div className={styles.cardIconWrap}>
                <img src={ICON_MEDITATION} alt="" width={24} height={24} aria-hidden />
              </div>
            </button>
          </div>
          <div className={styles.colRight}>
            <button
              type="button"
              className={`${styles.card} ${styles.cardSurprise} ${selected === 'surprise' ? styles.selected : ''}`}
              onClick={() => handleCardClick('surprise')}
            >
              <div className={styles.cardIconTop}>
                <div className={styles.cardIconWrap}>
                  <img src={ICON_FLAME} alt="" width={24} height={24} aria-hidden />
                </div>
              </div>
              <div className={styles.cardText}>
                <span className={styles.cardLabel}>Удиви меня</span>
                <span className={styles.cardDesc}>Рандомный<br />кальянный микс</span>
              </div>
            </button>
          </div>
        </div>

        {/* Нижний блок как на первом экране, одна кнопка «Вернуться» */}
        <div className={`${welcomeStyles.bottom} ${styles.bottomDirection}`}>
          <button
            type="button"
            className={welcomeStyles.primaryBtn}
            onClick={onBack}
            aria-label="Вернуться"
          >
            <ArrowLeftIcon size={24} />
            Вернуться
          </button>
        </div>
        </div>
      </div>
    </ScreenLayout>
  )
}
