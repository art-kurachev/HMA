import { useState } from 'react'
import { ScreenLayout } from './ScreenLayout'
import { BottomNav } from './BottomNav'
import styles from './DirectionScreen.module.css'

export type Direction = 'taste' | 'relax' | 'movie' | null

interface DirectionScreenProps {
  onBack: () => void
  onNext: (direction: Direction) => void
}

const DIRECTIONS = [
  { id: 'taste' as const, label: 'Вкусно покурить', subtitle: 'Hookah maker assistant' },
  { id: 'relax' as const, label: 'Расслабиться', subtitle: 'Hookah maker assistant' },
  { id: 'movie' as const, label: 'Под фильм', subtitle: 'Hookah maker assistant' },
]

export function DirectionScreen({ onBack, onNext }: DirectionScreenProps) {
  const [selected, setSelected] = useState<Direction>(null)

  const handleNext = () => {
    onNext(selected)
  }

  return (
    <ScreenLayout onBack={onBack} progressStep={1} totalSteps={4}>
      <h2 className={styles.title}>Твоя цель вечера?</h2>
      <div className={styles.cards}>
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`${styles.card} ${selected === d.id ? styles.selected : ''}`}
            onClick={() => setSelected(d.id)}
          >
            <div>
              <span className={styles.cardLabel}>{d.label}</span>
              <span className={styles.cardSubtitle}>{d.subtitle}</span>
            </div>
            <span className={styles.arrow}>→</span>
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
