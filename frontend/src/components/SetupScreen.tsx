import { useState } from 'react'
import type { FormState } from '../types'
import { BOWL_OPTIONS, PROFILE_OPTIONS } from '../types'
import { loadShelf, shelfToText } from '../shelfStorage'
import { ScreenLayout } from './ScreenLayout'
import { ProgressRow } from './ProgressRow'
import { BowlTurkaIcon, BowlPhunnelIcon, BowlKillerIcon, TobaccoIcon, ArrowLeftIcon, BlackHoleIcon } from './Icons'
import instructionStyles from './InstructionStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'
import feedbackStyles from './FeedbackStep.module.css'
import styles from './SetupScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_ROUND_GRAPH = '/icons/RoundGraph.svg'

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
  coal_size: 25 as const,
  coal_count_start: 3 as const,
  strength: 'medium' as const,
}

const EMPTY_UI = {
  bowl: null as 'turka' | 'phunnel' | 'killer' | null,
  has_cap: null as boolean | null,
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
        has_cap: initialFormState.has_cap as boolean | null,
        profiles: initialFormState.profiles,
        hasTobacco: initialFormState.available_tobaccos_text.trim()
          ? true
          : (false as boolean | null),
        available_tobaccos_text: initialFormState.available_tobaccos_text,
      }
    : EMPTY_UI
  const [bowl, setBowl] = useState<'turka' | 'phunnel' | 'killer' | null>(initial.bowl)
  const [has_cap, setHasCap] = useState<boolean | null>(initial.has_cap)
  const [profiles, setProfiles] = useState<string[]>(initial.profiles)
  const [hasTobacco, setHasTobacco] = useState<boolean | null>(initial.hasTobacco)
  const [available_tobaccos_text, setAvailableTobaccosText] = useState(
    initial.available_tobaccos_text
  )

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
    if (bowl === null || has_cap === null || hasTobacco === null) return
    onSubmit({
      bowl,
      has_cap,
      heat_control: API_DEFAULTS.heat_control,
      coal_size: API_DEFAULTS.coal_size,
      coal_count_start: API_DEFAULTS.coal_count_start,
      strength: API_DEFAULTS.strength,
      profiles,
      available_tobaccos_text: hasTobacco ? available_tobaccos_text : '',
    })
  }

  const canSubmit =
    bowl !== null &&
    has_cap !== null &&
    hasTobacco !== null &&
    !(hasTobacco && !available_tobaccos_text.trim())

  return (
    <ScreenLayout onBack={onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={`${instructionStyles.wrap} ${styles.wrapSetup}`}>
        <header className={welcomeStyles.topBar}>
          <ProgressRow total={3} activeStep={1} />
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
          <div className={instructionStyles.headerBlock}>
            <h2 className={instructionStyles.title}>Всего три параметра</h2>
          </div>
          <form className={styles.blocksLayout} onSubmit={handleSubmit}>
            <div className={styles.blocksRow}>
              <section className={styles.blockCard}>
                <h3 className={styles.blockTitle}>Чаша?</h3>
                <p className={styles.blockSubtitle}>Дам совет по забивке</p>
                <div className={styles.pills}>
                  {BOWL_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      className={`${styles.pill} ${bowl === o.value ? styles.active : ''}`}
                      onClick={() => setBowl(o.value)}
                    >
                      {o.value === 'turka' && <BowlTurkaIcon size={24} />}
                      {o.value === 'phunnel' && <BowlPhunnelIcon size={24} />}
                      {o.value === 'killer' && <BowlKillerIcon size={24} />}
                      {o.label}
                    </button>
                  ))}
                </div>
              </section>
              <section className={styles.blockCard}>
                <h3 className={styles.blockTitle}>Колпак?</h3>
                <p className={styles.blockSubtitle}>Учту при рекомендациях</p>
                <div className={styles.pills}>
                  <button
                    type="button"
                    className={`${styles.pill} ${has_cap === true ? styles.active : ''}`}
                    onClick={() => setHasCap(true)}
                  >
                    Да, есть
                  </button>
                  <button
                    type="button"
                    className={`${styles.pill} ${has_cap === false ? styles.active : ''}`}
                    onClick={() => setHasCap(false)}
                  >
                    Нет
                  </button>
                </div>
              </section>
            </div>

            <div className={styles.blocksRow}>
              <section className={`${styles.blockCard} ${styles.blockFull}`}>
                <h3 className={styles.blockTitle}>Вкус?</h3>
                <p className={styles.blockSubtitle}>Подберу лучший микс</p>
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

            <section className={`${styles.blockCard} ${styles.blockFullLast}`}>
              <h3 className={styles.blockTitle}>Есть табак?</h3>
              <p className={styles.blockSubtitle}>Будет проще</p>
              <div className={styles.pills}>
                <button
                  type="button"
                  className={`${styles.pill} ${hasTobacco === true ? styles.active : ''}`}
                  onClick={() => {
                    setHasTobacco(true)
                    if (!available_tobaccos_text.trim()) {
                      const fromShelf = shelfToText(loadShelf(telegramId))
                      if (fromShelf) setAvailableTobaccosText(fromShelf)
                    }
                  }}
                >
                  <TobaccoIcon size={24} />
                  Да, есть
                </button>
                <button
                  type="button"
                  className={`${styles.pill} ${hasTobacco === false ? styles.active : ''}`}
                  onClick={() => {
                    setHasTobacco(false)
                    setAvailableTobaccosText('')
                  }}
                >
                  Нет, пусто
                </button>
              </div>
              {hasTobacco === true && (
                <textarea
                  className={styles.textarea}
                  value={available_tobaccos_text}
                  onChange={(e) => setAvailableTobaccosText(e.target.value)}
                  placeholder="название табаков"
                  rows={2}
                />
              )}
            </section>
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
    </ScreenLayout>
  )
}
