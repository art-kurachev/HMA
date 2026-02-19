import type { Mix } from '../api'
import styles from './MixesStep.module.css'

interface MixesStepProps {
  mixes: Mix[]
  onSelect: (mix: Mix) => void
}

export function MixesStep({ mixes, onSelect }: MixesStepProps) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Выбери микс</h2>
      <div className={styles.grid}>
        {mixes.map((mix) => (
          <button
            key={mix.id}
            type="button"
            className={styles.card}
            onClick={() => onSelect(mix)}
          >
            <h3 className={styles.cardTitle}>{mix.title}</h3>
            <div className={styles.composition}>
              {mix.composition.map((c) => (
                <span key={c.name}>{c.name} {c.percent}%</span>
              ))}
            </div>
            <ul className={styles.why}>
              {mix.why.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
            <span className={styles.cta}>Инструкция →</span>
          </button>
        ))}
      </div>
    </div>
  )
}
