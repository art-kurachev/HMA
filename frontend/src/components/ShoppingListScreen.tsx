import { useEffect, useState, useCallback } from 'react'
import {
  getShoppingList,
  generateShoppingList,
  updateShoppingListChecked,
  type ShoppingMix,
  type ShoppingListResponse,
  type Mix,
} from '../api'
import { loadShelf, saveShelf } from '../shelfStorage'
import { ScreenLayout } from './ScreenLayout'
import styles from './ShoppingListScreen.module.css'
import welcomeStyles from './WelcomeScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_DATABASE = '/icons/Database.svg'

interface Props {
  telegramId: number
  onBack: () => void
  onSelectMix?: (mix: Mix) => void
  onOpenShelf?: () => void
}

interface BrandGroup {
  brand: string
  items: { name: string; mixCount: number }[]
}

const TWO_WORD_BRANDS = ['Black Burn', 'Daily Hookah', 'Black Horse']

function parseBrand(tobacco: string): string {
  for (const brand of TWO_WORD_BRANDS) {
    if (tobacco.startsWith(brand + ' ')) return brand
  }
  return tobacco.split(' ')[0]
}

function parseFlavor(tobacco: string, brand: string): string {
  return tobacco.slice(brand.length).trim()
}

function buildBrandGroups(mixes: ShoppingMix[]): BrandGroup[] {
  const counts: Record<string, number> = {}
  for (const mix of mixes) {
    for (const t of mix.tobaccos) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  const byBrand: Record<string, { name: string; mixCount: number }[]> = {}
  for (const [name, mixCount] of Object.entries(counts)) {
    const brand = parseBrand(name)
    if (!byBrand[brand]) byBrand[brand] = []
    byBrand[brand].push({ name, mixCount })
  }
  return Object.entries(byBrand)
    .map(([brand, items]) => ({
      brand,
      items: items.sort((a, b) => b.mixCount - a.mixCount),
    }))
    .sort((a, b) => a.brand.localeCompare(b.brand))
}

function isMixReady(mix: ShoppingMix, checked: string[]): boolean {
  return mix.tobaccos.every((t) => checked.includes(t))
}

export function ShoppingListScreen({ telegramId, onBack, onSelectMix, onOpenShelf }: Props) {
  const [state, setState] = useState<'loading' | 'empty' | 'loaded' | 'generating' | 'error'>('loading')
  const [mixes, setMixes] = useState<ShoppingMix[]>([])
  const [checked, setChecked] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const applyResponse = (res: ShoppingListResponse) => {
    setMixes(res.mixes)
    setChecked(res.checked_tobaccos)
    setState('loaded')
  }

  useEffect(() => {
    getShoppingList(telegramId)
      .then(applyResponse)
      .catch(() => setState('empty'))
  }, [telegramId])

  const handleGenerate = useCallback(async () => {
    setShowConfirm(false)
    setError(null)
    setState('generating')
    try {
      const res = await generateShoppingList(telegramId)
      applyResponse(res)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка'
      setError(msg === 'quota_exceeded' ? 'Лимит запросов исчерпан. Следующий — через неделю.' : msg)
      setState(mixes.length > 0 ? 'loaded' : 'empty')
    }
  }, [telegramId, mixes.length])

  const handleToggle = useCallback(async (name: string) => {
    const isNowChecked = !checked.includes(name)
    const next = isNowChecked
      ? [...checked, name]
      : checked.filter((t) => t !== name)
    setChecked(next)

    const shelf = loadShelf(telegramId)
    if (isNowChecked) {
      if (!shelf.includes(name)) {
        saveShelf(telegramId, [...shelf, name])
        showToast(`«${name}» добавлен на полку`)
      }
    } else {
      if (shelf.includes(name)) {
        saveShelf(telegramId, shelf.filter((t) => t !== name))
        showToast(`«${name}» убран с полки`)
      }
    }

    try {
      await updateShoppingListChecked(telegramId, next)
    } catch {
      // ignore
    }
  }, [checked, telegramId])

  const handleSelectMix = (mix: ShoppingMix) => {
    if (!onSelectMix) return
    onSelectMix({
      id: mix.id,
      title: mix.title,
      tobaccos: mix.tobaccos,
      flavor: mix.flavor,
    })
  }

  const brandGroups = buildBrandGroups(mixes)

  return (
    <ScreenLayout progressStep={0} totalSteps={0} fullBleed>
      <div className={styles.screen}>

        {/* Top bar: logo + Моя полка */}
        <header className={styles.topBar}>
          <img
            src={ICON_LOGO}
            alt="Iprit"
            className={styles.topBarLogo}
            onError={(e) => { e.currentTarget.style.display = 'none' }}
          />
          <button
            type="button"
            className={styles.topBarShelfBtn}
            onClick={onOpenShelf}
            aria-label="Моя полка"
          >
            Моя полка
            <img
              src={ICON_DATABASE}
              alt=""
              className={styles.topBarShelfBtnIcon}
              aria-hidden
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </button>
        </header>

        {/* Main scrollable area */}
        <div className={styles.mainContent}>
          <h2 className={styles.pageTitle}>Список покупок</h2>

          {error && (
            <div className={styles.error}>
              <span>{error}</span>
              <button type="button" onClick={() => setError(null)}>×</button>
            </div>
          )}

          {(state === 'loading' || state === 'generating') && (
            <div className={styles.centered}>
              <div className={styles.spinner} />
              <p className={styles.hint}>{state === 'generating' ? 'Подбираю 10 миксов…' : 'Загрузка…'}</p>
            </div>
          )}

          {state === 'empty' && (
            <div className={styles.onboarding}>
              <div className={styles.onboardingIcon}>🛒</div>
              <h3 className={styles.onboardingTitle}>Список покупок</h3>
              <p className={styles.onboardingText}>
                Сгенерирую 10 миксов из 5–6 табаков. Купи их все — и у тебя будет набор на несколько вечеров.
              </p>
              <p className={styles.onboardingQuota}>Будет использована 1 генерация</p>
              <button type="button" className={styles.generateBtn} onClick={handleGenerate}>
                Сгенерировать список
              </button>
            </div>
          )}

          {state === 'loaded' && (
            <div className={styles.scrollWrapper}>
            <div className={styles.scrollContent}>

              {/* Табаки сгруппированные по бренду */}
              {brandGroups.map((group) => (
                <div key={group.brand} className={styles.brandGroup}>
                  <h3 className={styles.brandName}>{group.brand}</h3>
                  <ul className={styles.tobaccoList}>
                    {group.items.map((item) => {
                      const isBought = checked.includes(item.name)
                      const flavor = parseFlavor(item.name, group.brand)
                      return (
                        <li
                          key={item.name}
                          className={`${styles.tobaccoItem} ${isBought ? styles.bought : ''}`}
                          onClick={() => handleToggle(item.name)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && handleToggle(item.name)}
                          aria-pressed={isBought}
                          aria-label={isBought ? `Убрать ${item.name}` : `Отметить ${item.name}`}
                        >
                          <span className={styles.checkbox} aria-hidden>
                            {isBought ? '✓' : ''}
                          </span>
                          <span className={styles.tobaccoFlavor}>{flavor}</span>
                          <span className={styles.tobaccoMixCount}>{item.mixCount} {item.mixCount === 1 ? 'микс' : 'микса'}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}

              {/* Миксы */}
              <div className={styles.mixesSection}>
                <h3 className={styles.mixesSectionTitle}>Миксы ({mixes.length})</h3>
                <ul className={styles.mixList}>
                  {mixes.map((mix) => {
                    const ready = isMixReady(mix, checked)
                    const readyCount = mix.tobaccos.filter((t) => checked.includes(t)).length
                    return (
                      <li key={mix.id} className={`${styles.mixItem} ${ready ? styles.mixReady : ''}`}>
                        <div className={styles.mixHeader}>
                          <div className={styles.mixInfo}>
                            <span className={styles.mixTitle}>{mix.title}</span>
                            <span className={styles.mixFlavor}>{mix.flavor}</span>
                          </div>
                          {ready && onSelectMix ? (
                            <button
                              type="button"
                              className={styles.mixReadyBtn}
                              onClick={() => handleSelectMix(mix)}
                              aria-label="К инструкции"
                            >
                              Курить
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                                <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M12 10C17 10 16.6 22 9 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M12.3115 14C7.31152 14 7.71152 2 15.3115 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M10.6316 10.6959C14.1671 7.16041 22.3695 15.9285 16.9955 21.3025" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                                <path d="M13.6799 13.3041C10.1444 16.8396 1.94198 8.07147 7.31599 2.69746" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                                <path d="M10.8513 13.5242C7.3158 9.98865 16.0839 1.78622 21.4579 7.16023" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                                <path d="M13.4602 10.4758C16.9957 14.0113 8.2276 22.2138 2.85359 16.8398" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                                <path d="M10 12.3115C10 7.31152 22 7.71152 22 15.3115" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M14 12C14 17 2 16.6 2 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              </svg>
                            </button>
                          ) : (
                            <span className={styles.mixProgress}>{readyCount}/{mix.tobaccos.length}</span>
                          )}
                        </div>
                        <div className={styles.mixTobaccos}>
                          {mix.tobaccos.map((t) => (
                            <span
                              key={t}
                              className={`${styles.mixTobacco} ${checked.includes(t) ? styles.mixTobaccoBought : ''}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && <div className={styles.toast}>{toast}</div>}

        {/* Footer */}
        <div className={`${welcomeStyles.bottom} ${styles.bottomShopping}`}>
          <div className={styles.bottomBlock}>
            <button type="button" className={`${welcomeStyles.primaryBtn} ${styles.backBtn}`} onClick={onBack} aria-label="Назад">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={welcomeStyles.primaryBtnIcon}>
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            {state === 'loaded' && (
              <button
                type="button"
                className={welcomeStyles.secondaryBtn}
                onClick={() => setShowConfirm(true)}
                aria-label="Обновить список"
              >
                Обновить
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className={welcomeStyles.secondaryBtnIcon}>
                  <path d="M21 12a9 9 0 11-9-9c2.52 0 4.93 1 6.74 2.74L21 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Confirm modal */}
        {showConfirm && (
          <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Обновить список?</h3>
              <p className={styles.modalQuota}>Будет использована 1 генерация.</p>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancel} onClick={() => setShowConfirm(false)}>Отмена</button>
                <button type="button" className={styles.modalConfirm} onClick={handleGenerate}>Обновить</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenLayout>
  )
}
