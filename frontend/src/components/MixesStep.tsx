import type { Mix } from '../api'
import { ScreenLayout } from './ScreenLayout'
import { ShareIcon } from './Icons'
import styles from './MixesStep.module.css'

interface MixesStepProps {
  mixes: Mix[]
  onSelect: (mix: Mix) => void
  onBack: () => void
}

export function MixesStep({ mixes, onSelect, onBack }: MixesStepProps) {
  return (
    <ScreenLayout onBack={onBack} progressStep={3} totalSteps={4}>
    <div className={styles.wrap}>
      <div className={styles.titleRow}>
        <div>
          <h2 className={styles.title}>Выбери микс</h2>
          <p className={styles.subtitle}>3 предложения под твой сетап</p>
        </div>
        <button type="button" className={styles.shareBtn} aria-label="Поделиться">
          <ShareIcon size={20} />
        </button>
      </div>
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
              {mix.tobaccos.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <p className={styles.flavor}>{mix.flavor}</p>
            <span className={styles.cta}>Инструкция →</span>
          </button>
        ))}
      </div>
    </div>
    </ScreenLayout>
  )
}
