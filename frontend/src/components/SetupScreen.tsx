import { useState } from 'react'
import type { FormState } from '../types'
import { BOWL_OPTIONS, PROFILE_OPTIONS } from '../types'
import { ScreenLayout } from './ScreenLayout'
import { BottomNav } from './BottomNav'
import { ShareIcon, BowlTurkaIcon, BowlPhunnelIcon, BowlKillerIcon, TobaccoIcon } from './Icons'
import styles from './SetupScreen.module.css'

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
  onBack: () => void
  onSubmit: (params: FormState) => void
  loading: boolean
  initialFormState?: FormState | null
}

export function SetupScreen({ onBack, onSubmit, loading, initialFormState }: SetupScreenProps) {
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
    <ScreenLayout onBack={onBack} progressStep={2} totalSteps={3}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.titleRow}>
          <h2 className={styles.title}>Всего три параметра</h2>
          <button type="button" className={styles.shareBtn} aria-label="Поделиться">
            <ShareIcon size={20} />
          </button>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Чаша?</h3>
            <span className={styles.hint}>Дам совет по забивке</span>
          </div>
          <div className={styles.pills}>
            {BOWL_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`${styles.pill} ${bowl === o.value ? styles.active : ''}`}
                onClick={() => setBowl(o.value)}
              >
                {o.value === 'turka' && <BowlTurkaIcon size={28} />}
                {o.value === 'phunnel' && <BowlPhunnelIcon size={28} />}
                {o.value === 'killer' && <BowlKillerIcon size={28} />}
                {o.label}
              </button>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Наличие колпака?</h3>
            <span className={styles.hint}>Колпак в наличии, я это учту!</span>
          </div>
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

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Вкус?</h3>
            <span className={styles.hint}>Подберу лучший микс</span>
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

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Есть табак?</h3>
            <span className={styles.hint}>Будет проще</span>
          </div>
          <div className={styles.pills}>
            <button
              type="button"
              className={`${styles.pill} ${hasTobacco === true ? styles.active : ''}`}
              onClick={() => setHasTobacco(true)}
            >
              <TobaccoIcon size={28} />
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
      <BottomNav
        onBack={onBack}
        primaryLabel="Подобрать миксы"
        onPrimary={() => handleSubmit()}
        primaryDisabled={loading || !canSubmit}
        primaryAccent
      />
    </ScreenLayout>
  )
}
