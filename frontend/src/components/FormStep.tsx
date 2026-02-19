import { useState } from 'react'
import type { FormState } from '../types'
import { BOWL_OPTIONS, HEAT_OPTIONS, STRENGTH_OPTIONS, PROFILE_OPTIONS } from '../types'
import styles from './FormStep.module.css'

interface FormStepProps {
  onSubmit: (params: FormState) => void
  loading: boolean
}

export function FormStep({ onSubmit, loading }: FormStepProps) {
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

  const toggleProfile = (p: string) => {
    setParams((prev) => ({
      ...prev,
      profiles: prev.profiles.includes(p)
        ? prev.profiles.filter((x) => x !== p)
        : [...prev.profiles, p],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!params.available_tobaccos_text.trim()) return
    onSubmit(params)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2 className={styles.title}>Подбор микса</h2>

      <label className={styles.label}>Чаша</label>
      <div className={styles.row}>
        {BOWL_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`${styles.btn} ${params.bowl === o.value ? styles.active : ''}`}
            onClick={() => setParams((p) => ({ ...p, bowl: o.value }))}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className={styles.label}>Жар</label>
      <div className={styles.row}>
        {HEAT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`${styles.btn} ${params.heat_control === o.value ? styles.active : ''}`}
            onClick={() => setParams((p) => ({ ...p, heat_control: o.value }))}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={params.has_cap}
          onChange={(e) => setParams((p) => ({ ...p, has_cap: e.target.checked }))}
        />
        Есть колпак
      </label>

      <label className={styles.label}>Размер угля (мм)</label>
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.btn} ${params.coal_size === 25 ? styles.active : ''}`}
          onClick={() => setParams((p) => ({ ...p, coal_size: 25 }))}
        >
          25
        </button>
        <button
          type="button"
          className={`${styles.btn} ${params.coal_size === 26 ? styles.active : ''}`}
          onClick={() => setParams((p) => ({ ...p, coal_size: 26 }))}
        >
          26
        </button>
      </div>

      <label className={styles.label}>Углей в начале</label>
      <div className={styles.row}>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.btn} ${params.coal_count_start === n ? styles.active : ''}`}
            onClick={() => setParams((p) => ({ ...p, coal_count_start: n as 2 | 3 | 4 }))}
          >
            {n}
          </button>
        ))}
      </div>

      <label className={styles.label}>Крепость</label>
      <div className={styles.row}>
        {STRENGTH_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`${styles.btn} ${params.strength === o.value ? styles.active : ''}`}
            onClick={() => setParams((p) => ({ ...p, strength: o.value }))}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label className={styles.label}>Профили вкуса</label>
      <div className={styles.profiles}>
        {PROFILE_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            className={`${styles.chip} ${params.profiles.includes(p) ? styles.active : ''}`}
            onClick={() => toggleProfile(p)}
          >
            {p}
          </button>
        ))}
      </div>

      <label className={styles.label}>Доступные табаки (через запятую)</label>
      <textarea
        className={styles.textarea}
        value={params.available_tobaccos_text}
        onChange={(e) => setParams((p) => ({ ...p, available_tobaccos_text: e.target.value }))}
        placeholder="Black Nana, Blue Horse, Darkside Core..."
        rows={3}
        required
      />

      <button type="submit" className={styles.submit} disabled={loading}>
        {loading ? 'Подбор...' : 'Подобрать миксы'}
      </button>
    </form>
  )
}
