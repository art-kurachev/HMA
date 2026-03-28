import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ACCENT_PRESETS,
  applyAccentColor,
  loadAccent,
  saveAccent,
} from '../accentTheme'
import { CloseIcon } from './Icons'
import styles from './AccentPaletteSheet.module.css'

interface AccentPaletteSheetProps {
  onClose: () => void
}

export function AccentPaletteSheet({ onClose }: AccentPaletteSheetProps) {
  const [current, setCurrent] = useState(() => loadAccent())

  const pick = (hex: string) => {
    setCurrent(hex)
    applyAccentColor(hex)
    saveAccent(hex)
  }

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const content = (
    <div
      className={styles.backdrop}
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Цвет интерфейса"
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Акцентный цвет</h2>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Закрыть"
          >
            <CloseIcon size={24} />
          </button>
        </div>
        <p className={styles.hint}>
          Кнопки, прогресс и выделения будут в выбранном цвете.
        </p>
        <div className={styles.grid} role="list">
          {ACCENT_PRESETS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={styles.swatch}
              style={{ background: p.value }}
              onClick={() => pick(p.value)}
              aria-label={p.label}
              aria-current={current === p.value ? 'true' : undefined}
            >
              {current === p.value && <span className={styles.check} aria-hidden />}
            </button>
          ))}
        </div>
        <label className={styles.customRow}>
          <span className={styles.customLabel}>Свой цвет</span>
          <input
            type="color"
            className={styles.colorInput}
            value={current}
            onChange={(e) => pick(e.target.value)}
          />
        </label>
        <button type="button" className={styles.doneBtn} onClick={onClose}>
          Готово
        </button>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
