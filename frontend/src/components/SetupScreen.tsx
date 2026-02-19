import { useState } from 'react'
import type { FormState } from '../types'
import { BOWL_OPTIONS, PROFILE_OPTIONS } from '../types'
import { ScreenLayout } from './ScreenLayout'
import { BottomNav } from './BottomNav'
import styles from './SetupScreen.module.css'

const PROFILE_LABELS: Record<string, string> = {
  tea: 'Чайные',
  dessert: 'Десертный',
  berry: 'Ягодный',
  fruit: 'Фруктовый',
  fresh: 'Свежий',
  sour: 'Цитрусовый',
}

interface SetupScreenProps {
  onBack: () => void
  onSubmit: (params: FormState) => void
  loading: boolean
}

export function SetupScreen({ onBack, onSubmit, loading }: SetupScreenProps) {
  const [params, setParams] = useState<FormState>({
    bowl: 'phunnel',
    heat_control: 'kaloud',
    has_cap: true,
    coal_size: 25,
    coal_count_start: 3,
    strength: 'medium',
    profiles: [],
    available_tobaccos_text: '',
  })

  const [hasTobacco, setHasTobacco] = useState(false)

  const toggleProfile = (p: string) => {
    setParams((prev) => ({
      ...prev,
      profiles: prev.profiles.includes(p)
        ? prev.profiles.filter((x) => x !== p)
        : [...prev.profiles, p],
    }))
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    onSubmit(params)
  }

  return (
    <ScreenLayout onBack={onBack} progressStep={2} totalSteps={4}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Всего три параметра</h2>

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
                className={`${styles.pill} ${params.bowl === o.value ? styles.active : ''}`}
                onClick={() => setParams((p) => ({ ...p, bowl: o.value }))}
              >
                {o.label}
              </button>
            ))}
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
                className={`${styles.chip} ${params.profiles.includes(p) ? styles.active : ''}`}
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
              className={`${styles.pill} ${hasTobacco ? styles.active : ''}`}
              onClick={() => setHasTobacco(true)}
            >
              Да, есть
            </button>
            <button
              type="button"
              className={`${styles.pill} ${!hasTobacco ? styles.active : ''}`}
              onClick={() => {
                setHasTobacco(false)
                setParams((p) => ({ ...p, available_tobaccos_text: '' }))
              }}
            >
              Нет, пусто
            </button>
          </div>
          {hasTobacco && (
            <textarea
              className={styles.textarea}
              value={params.available_tobaccos_text}
              onChange={(e) => setParams((p) => ({ ...p, available_tobaccos_text: e.target.value }))}
              placeholder="Black Nana, Blue Horse, Darkside Core..."
              rows={2}
            />
          )}
        </section>
      </form>
      <BottomNav
        onBack={onBack}
        primaryLabel="Подобрать миксы"
        onPrimary={() => handleSubmit()}
        primaryDisabled={loading || (hasTobacco && !params.available_tobaccos_text.trim())}
        primaryAccent
      />
    </ScreenLayout>
  )
}
