import styles from './BottomNav.module.css'

interface BottomNavProps {
  onBack?: () => void
  primaryLabel: string
  onPrimary: () => void
  primaryDisabled?: boolean
  primaryAccent?: boolean
}

export function BottomNav({
  onBack,
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryAccent = false,
}: BottomNavProps) {
  return (
    <div className={styles.nav}>
      {onBack && (
        <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
          ←
        </button>
      )}
      <button
        type="button"
        className={`${styles.primaryBtn} ${primaryAccent ? styles.accent : ''}`}
        onClick={onPrimary}
        disabled={primaryDisabled}
      >
        {primaryLabel}
        <span>→</span>
      </button>
    </div>
  )
}
