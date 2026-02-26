declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string
        initDataUnsafe: { user?: { id: number } }
        ready: () => void
        expand: () => void
        close: () => void
        /** Bot API 8.0+ — fullscreen (скрывает панели Telegram) */
        requestFullscreen?: () => void
        isVersionAtLeast?: (version: string) => boolean
        /** Открывает окно оплаты Stars по invoice link */
        openInvoice?: (url: string, callback?: (status: string) => void) => void
      }
    }
  }
}

export function openInvoice(url: string, callback?: (status: string) => void): void {
  window.Telegram?.WebApp?.openInvoice?.(url, callback)
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
    // Bot API 8.0+: всегда fullscreen (main button и menu button)
    if (typeof tg.requestFullscreen === 'function' && tg.isVersionAtLeast?.('8.0')) {
      tg.requestFullscreen()
    }
  }
}
