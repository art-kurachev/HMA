import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { BottomNav } from './BottomNav'
import { LoginIcon, ShareIcon } from './Icons'
import styles from './DirectionScreen.module.css'

export type Direction = 'taste' | 'relax' | 'movie' | null

interface DirectionScreenProps {
  onBack: () => void
  onNext: (direction: Direction) => void
}

const DIRECTIONS = [
  { id: 'taste' as const, label: 'Вкусно покурить', subtitle: 'Hookah maker assistent' },
  { id: 'relax' as const, label: 'Расслабиться', subtitle: 'Hookah maker assistent' },
  { id: 'movie' as const, label: 'Под фильм', subtitle: 'Hookah maker assistent' },
]

export function DirectionScreen({ onBack, onNext }: DirectionScreenProps) {
  const [selected, setSelected] = useState<Direction>(null)

  const handleNext = () => {
    onNext(selected)
  }

  return (
    <ScreenLayout onBack={onBack} progressStep={1} totalSteps={3}>
      <div className={styles.titleRow}>
        <h2 className={styles.title}>Твоя цель вечера?</h2>
        <button type="button" className={styles.shareBtn} aria-label="Поделиться">
          <ShareIcon size={20} />
        </button>
      </div>
      <div className={styles.cards}>
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`${styles.card} ${selected === d.id ? styles.selected : ''}`}
            onClick={() => setSelected(d.id)}
          >
            <div>
              <span className={styles.cardSubtitle}>{d.subtitle}</span>
              <span className={styles.cardLabel}>{d.label}</span>
            </div>
            <span className={styles.arrow}><LoginIcon size={20} /></span>
          </button>
        ))}
      </div>
      <BottomNav
        onBack={onBack}
        primaryLabel="Настроить сетап"
        onPrimary={handleNext}
        primaryDisabled={!selected}
      />
    </ScreenLayout>
  )
}
