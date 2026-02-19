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
  const user = window.Telegram.WebApp.initDataUnsafe?.user
  return user?.id ?? null
}

export function initTelegram() {
  const tg = window.Telegram?.WebApp
  if (tg) {
    tg.ready()
    tg.expand()
  }
}
