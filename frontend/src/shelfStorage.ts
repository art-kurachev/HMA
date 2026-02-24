const SHELF_KEY_PREFIX = 'hma_shelf_'

export function getShelfKey(telegramId: number): string {
  return `${SHELF_KEY_PREFIX}${telegramId}`
}

export function loadShelf(telegramId: number): string[] {
  try {
    const raw = localStorage.getItem(getShelfKey(telegramId))
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === 'string' && x.trim() !== '')
      : []
  } catch {
    return []
  }
}

export function saveShelf(telegramId: number, tobaccos: string[]): void {
  try {
    const list = tobaccos.map((s) => s.trim()).filter(Boolean)
    localStorage.setItem(getShelfKey(telegramId), JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/** Формат для API: строка через запятую */
export function shelfToText(tobaccos: string[]): string {
  return tobaccos.map((s) => s.trim()).filter(Boolean).join(', ')
}

export function textToShelf(text: string): string[] {
  return text
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}
