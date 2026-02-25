import { useState } from 'react'
import type { FormState } from '../types'
import { BOWL_OPTIONS, PROFILE_OPTIONS } from '../types'
import { loadShelf, shelfToText } from '../shelfStorage'
import { ScreenLayout } from './ScreenLayout'
import progressRowStyles from './ProgressRow.module.css'
import { ArrowLeftIcon, BlackHoleIcon } from './Icons'
import { ShelfSheet } from './ShelfSheet'
import instructionStyles from './InstructionStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'
import directionStyles from './DirectionScreen.module.css'
import feedbackStyles from './FeedbackStep.module.css'
import styles from './SetupScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_ROUND_GRAPH = '/icons/RoundGraph.svg'
const ICON_TICK_CIRCLE = '/icons/tick-circle.svg'

const PROFILE_LABELS: Record<string, string> = {
  tea: 'Чайные',
  dessert: 'Десертный',
  berry: 'Ягодный',
  fruit: 'Фруктовый',
  fresh: 'Свежий',
  sour: 'Цитрусовый',
  any: 'Любой',
}

const API_DEFAULTS = {
  heat_control: 'kaloud' as const,
  has_cap: true as const,
  coal_count_start: 3 as const,
  strength: 'medium' as const,
}

const EMPTY_UI = {
  bowl: null as 'turka' | 'phunnel' | 'killer' | null,
  coal_size: null as 23 | 25 | null,
  profiles: [] as string[],
  hasTobacco: null as boolean | null,
  available_tobaccos_text: '',
}

interface SetupScreenProps {
  telegramId: number
  onBack: () => void
  onSubmit: (params: FormState) => void
  loading: boolean
  initialFormState?: FormState | null
}

export function SetupScreen({ telegramId, onBack, onSubmit, loading, initialFormState }: SetupScreenProps) {
  const initial = initialFormState
    ? {
        bowl: initialFormState.bowl as 'turka' | 'phunnel' | 'killer' | null,
        coal_size: (initialFormState.coal_size === 23 || initialFormState.coal_size === 25
          ? initialFormState.coal_size
          : null) as 23 | 25 | null,
        profiles: initialFormState.profiles,
        hasTobacco: initialFormState.available_tobaccos_text.trim()
          ? true
          : (false as boolean | null),
        available_tobaccos_text: initialFormState.available_tobaccos_text,
      }
    : EMPTY_UI
  const [bowl, setBowl] = useState<'turka' | 'phunnel' | 'killer' | null>(initial.bowl)
  const [coal_size, setCoalSize] = useState<23 | 25 | null>(initial.coal_size)
  const [profiles, setProfiles] = useState<string[]>(initial.profiles)
  const [hasTobacco, setHasTobacco] = useState<boolean | null>(initial.hasTobacco)
  const [available_tobaccos_text, setAvailableTobaccosText] = useState(
    initial.available_tobaccos_text
  )
  const [hasCap, setHasCap] = useState(initialFormState?.has_cap ?? false)
  const [showTobaccoSheet, setShowTobaccoSheet] = useState(false)
  const [rotationDeg, setRotationDeg] = useState(-15)

  const toggleProfile = (p: string) => {
    setProfiles((prev) => {
      if (p === 'any') {
        return prev.includes('any') ? [] : ['any']
      }
      const withoutAny = prev.filter((x) => x !== 'any')
      return withoutAny.includes(p)
        ? withoutAny.filter((x) => x !== p)
        : [...withoutAny, p]
    })
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (bowl === null || coal_size === null || hasTobacco === null) return
    onSubmit({
      bowl,
      has_cap: hasCap,
      heat_control: API_DEFAULTS.heat_control,
      coal_size,
      coal_count_start: API_DEFAULTS.coal_count_start,
      strength: API_DEFAULTS.strength,
      profiles,
      available_tobaccos_text: hasTobacco ? available_tobaccos_text : '',
    })
  }

  const canSubmit =
    bowl !== null &&
    coal_size !== null &&
    hasTobacco !== null &&
    !(hasTobacco && !available_tobaccos_text.trim())

  return (
    <ScreenLayout onBack={onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={`${instructionStyles.wrap} ${styles.wrapSetup}`}>
        <header className={welcomeStyles.topBar}>
          <div className={progressRowStyles.progressRow} aria-hidden />
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
              <span className={instructionStyles.tagText}>Сетап</span>
              <img
                src={ICON_ROUND_GRAPH}
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

        <div className={`${instructionStyles.mainContent} ${styles.mainContentSetup}`}>
          <div className={styles.headerWithBowl}>
            <div className={`${directionStyles.titleRow} ${styles.titleRowSetup}`}>
              <div className={styles.headerText}>
                <h2 className={directionStyles.title}>Всего четыре параметра</h2>
                <p className={instructionStyles.flavor}>
                  {hasCap ? 'Колпак в наличии, я это учту!' : 'Нажми на колпак, если он у тебя есть!'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className={`${directionStyles.bowlPlaceholder} ${styles.kolpakWrap} ${hasCap ? styles.kolpakActive : ''}`}
              style={{ transform: `rotate(${rotationDeg}deg)` }}
              onClick={() => {
                const next = !hasCap
                setHasCap(next)
                setRotationDeg((r) => (next ? r + 45 : r - 45))
              }}
              aria-pressed={hasCap}
              aria-label={hasCap ? 'Колпак в наличии' : 'Нажми, если есть колпак'}
            >
              <img src="/bowl.png" alt="" width={193} height={224} className={directionStyles.bowlImage} />
              {hasCap && (
                <img
                  src={ICON_TICK_CIRCLE}
                  alt=""
                  className={styles.kolpakTick}
                  style={{ transform: `rotate(${-rotationDeg}deg)` }}
                  aria-hidden
                />
              )}
            </button>
          </div>
          <form className={styles.blocksLayout} onSubmit={handleSubmit}>
            <div className={styles.blocksRow}>
              <section className={styles.blockCard}>
                <div className={styles.blockHeader}>
                  <h3 className={styles.blockTitle}>Чаша?</h3>
                  <p className={styles.blockSubtitle}>Дам совет по забивке</p>
                </div>
                <div className={styles.pills}>
                  {BOWL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.pill} ${bowl === o.value ? styles.active : ''}`}
                      onClick={() => setBowl(o.value)}
                    >
                      {o.value === 'turka' && <img src="/icons/bowl-turka.png" alt="" width={24} height={24} />}
                      {o.value === 'phunnel' && <img src="/icons/bowl-phunnel.png" alt="" width={24} height={24} />}
                      {o.value === 'killer' && <img src="/icons/bowl-killer.png" alt="" width={24} height={24} />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>
              <section className={styles.blockCard}>
                <div className={styles.blockHeader}>
                  <h3 className={styles.blockTitle}>Вкус?</h3>
                  <p className={styles.blockSubtitle}>Подберу лучший микс</p>
                </div>
                <div className={styles.chips}>
                  {PROFILE_OPTIONS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`${styles.chip} ${profiles.includes(p) ? styles.active : ''}`}
                      onClick={() => toggleProfile(p)}
                    >
                      {PROFILE_LABELS[p] ?? p}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className={`${styles.blocksRow} ${styles.blocksRowBottom}`}>
              <section className={styles.blockCard}>
                <div className={styles.blockHeader}>
                  <h3 className={styles.blockTitle}>Есть табак?</h3>
                  <p className={styles.blockSubtitle}>Подберу из наличия</p>
                </div>
                <div className={`${styles.pills} ${styles.pillsRow}`}>
                  <button
                    type="button"
                    className={`${styles.pill} ${hasTobacco === true ? styles.active : ''}`}
                    onClick={() => setShowTobaccoSheet(true)}
                  >
                    Да
                  </button>
                  <button
                    type="button"
                    className={`${styles.pill} ${hasTobacco === false ? styles.active : ''}`}
                    onClick={() => {
                      setHasTobacco(false)
                      setAvailableTobaccosText('')
                    }}
                  >
                    Нет
                  </button>
                </div>
              </section>
              <section className={styles.blockCard}>
                <div className={styles.blockHeader}>
                  <h3 className={styles.blockTitle}>Уголь?</h3>
                  <p className={styles.blockSubtitle}>Скажу как долго греть</p>
                </div>
                <div className={`${styles.pills} ${styles.pillsRow}`}>
                  <button
                    type="button"
                    className={`${styles.pill} ${coal_size === 23 ? styles.active : ''}`}
                    onClick={() => setCoalSize(23)}
                  >
                    23
                  </button>
                  <button
                    type="button"
                    className={`${styles.pill} ${coal_size === 25 ? styles.active : ''}`}
                    onClick={() => setCoalSize(25)}
                  >
                    25
                  </button>
                </div>
              </section>
            </div>
          </form>
        </div>

        <div className={`${welcomeStyles.bottom} ${instructionStyles.bottomInstruction} ${styles.bottomSetup}`}>
          <div className={instructionStyles.bottomBlock}>
            <button
              type="button"
              className={`${instructionStyles.finishBtn} ${styles.finishBtnSetup}`}
              onClick={onBack}
              aria-label="Вернуться"
            >
              <ArrowLeftIcon size={24} />
            </button>
            <button
              type="button"
              className={`${feedbackStyles.submitBtnWhite} ${styles.submitBtnSetup}`}
              onClick={() => handleSubmit()}
              disabled={loading || !canSubmit}
            >
              {loading ? 'Загрузка...' : 'Миксуй'}
              <BlackHoleIcon size={24} />
            </button>
          </div>
        </div>
      </div>

      {showTobaccoSheet && (
        <ShelfSheet
          telegramId={telegramId}
          onClose={() => {
            setShowTobaccoSheet(false)
            const shelf = loadShelf(telegramId)
            if (shelf.length > 0) {
              setHasTobacco(true)
              setAvailableTobaccosText(shelfToText(shelf))
            }
          }}
        />
      )}
    </ScreenLayout>
  )
}
