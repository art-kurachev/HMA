/** Акцентный цвет приложения (localStorage + CSS-переменные на :root). */

const STORAGE_KEY = 'hma_accent'

export const DEFAULT_ACCENT = '#ff6544'

export const ACCENT_PRESETS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Оранжевый', value: '#ff6544' },
  { label: 'Коралл', value: '#e85d2a' },
  { label: 'Малина', value: '#e91e63' },
  { label: 'Фиолетовый', value: '#9c27b0' },
  { label: 'Индиго', value: '#5c6bc0' },
  { label: 'Бирюза', value: '#26a69a' },
  { label: 'Зелёный', value: '#66bb6a' },
  { label: 'Лайм', value: '#c0ca33' },
  { label: 'Золото', value: '#ffc107' },
  { label: 'Красный', value: '#ef5350' },
  { label: 'Розовый', value: '#f48fb1' },
  { label: 'Голубой', value: '#29b6f6' },
]

function isHex6(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s)
}

export function loadAccent(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v && isHex6(v)) return v
  } catch {
    /* ignore */
  }
  return DEFAULT_ACCENT
}

export function saveAccent(hex: string): void {
  if (!isHex6(hex)) return
  try {
    localStorage.setItem(STORAGE_KEY, hex)
  } catch {
    /* ignore */
  }
}

/** Выставляет --accent, --tg-theme-button-color и производные на documentElement. */
export function applyAccentColor(hex: string): void {
  if (!isHex6(hex)) return
  const root = document.documentElement
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--tg-theme-button-color', hex)
  root.style.setProperty(
    '--accent-light',
    `color-mix(in srgb, ${hex} 15%, transparent)`
  )
}
