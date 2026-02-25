declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: { id: number } }
        ready: () => void
        expand: () => void
        close: () => void
      }
    }
  }
}

export function getTelegramId(): number | null {
  if (typeof window === 'undefined' || !window.Telegram?.WebApp) return null
  const tg = window.Telegram.WebApp
  const user = tg.initDataUnsafe?.user
  if (user?.id != null) return user.id
  // initDataUnsafe может быть пустым — парсим initData строку
  const raw = tg.initData
  if (raw) {
    try {
      const params = new URLSearchParams(raw)
      const userStr = params.get('user')
      if (userStr) {
        const u = JSON.parse(decodeURIComponent(userStr)) as { id?: number }
        if (typeof u?.id === 'number') return u.id
      }
    } catch {
      /* ignore */
    }
  }
  return null
}

export function getInitData(): string {
  return (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) || ''
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
  }
}
