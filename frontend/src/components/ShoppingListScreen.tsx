import { useEffect, useState, useCallback } from 'react'
import {
  getShoppingList,
  generateShoppingList,
  updateShoppingListChecked,
  type ShoppingMix,
  type ShoppingListResponse,
} from '../api'
import { ScreenLayout } from './ScreenLayout'
import styles from './ShoppingListScreen.module.css'

interface Props {
  telegramId: number
  onBack: () => void
}

interface TobaccoItem {
  name: string
  count: number // в скольких миксах встречается
}

function buildTobaccoList(mixes: ShoppingMix[]): TobaccoItem[] {
  const counts: Record<string, number> = {}
  for (const mix of mixes) {
    for (const t of mix.tobaccos) {
      counts[t] = (counts[t] ?? 0) + 1
    }
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
}

export function ShoppingListScreen({ telegramId, onBack }: Props) {
  const [state, setState] = useState<'loading' | 'empty' | 'loaded' | 'generating' | 'error'>('loading')
  const [mixes, setMixes] = useState<ShoppingMix[]>([])
  const [checked, setChecked] = useState<string[]>([])
  const [expandedMix, setExpandedMix] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)

  const applyResponse = (res: ShoppingListResponse) => {
    setMixes(res.mixes)
    setChecked(res.checked_tobaccos)
    setState('loaded')
  }

  useEffect(() => {
    getShoppingList(telegramId)
      .then(applyResponse)
      .catch((e) => {
        if (e instanceof Error && e.message === 'shopping_list_not_found') {
          setState('empty')
        } else {
          // 404 от fetch — тоже empty
          setState('empty')
        }
      })
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
    const next = checked.includes(name)
      ? checked.filter((t) => t !== name)
      : [...checked, name]
    setChecked(next)
    try {
      await updateShoppingListChecked(telegramId, next)
    } catch {
      // silently ignore — checked state already updated locally
    }
  }, [checked, telegramId])

  const tobaccos = buildTobaccoList(mixes)
  const checkedCount = tobaccos.filter((t) => checked.includes(t.name)).length

  return (
    <ScreenLayout progressStep={0} totalSteps={0} fullBleed>
      <div className={styles.screen}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={onBack} aria-label="Назад">
            ←
          </button>
          <h2 className={styles.title}>Список покупок</h2>
          {state === 'loaded' && (
            <button
              type="button"
              className={styles.regenBtn}
              onClick={() => setShowConfirm(true)}
              aria-label="Обновить список"
            >
              ↺
            </button>
          )}
        </header>

        {error && (
          <div className={styles.error}>
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {(state === 'loading' || state === 'generating') && (
          <div className={styles.centered}>
            <div className={styles.spinner} />
            <p className={styles.hint}>
              {state === 'generating' ? 'Подбираю 10 миксов…' : 'Загрузка…'}
            </p>
          </div>
        )}

        {state === 'empty' && (
          <div className={styles.onboarding}>
            <div className={styles.onboardingIcon}>🛒</div>
            <h3 className={styles.onboardingTitle}>Список покупок</h3>
            <p className={styles.onboardingText}>
              Сгенерируй 10 разнообразных миксов — и бери этот список в магазин.
              Отмечай купленные табаки прямо здесь.
            </p>
            <p className={styles.onboardingQuota}>Будет использована 1 генерация</p>
            <button
              type="button"
              className={styles.generateBtn}
              onClick={handleGenerate}
            >
              Сгенерировать список
            </button>
          </div>
        )}

        {state === 'loaded' && (
          <div className={styles.content}>
            <div className={styles.progress}>
              <span className={styles.progressText}>
                {checkedCount} / {tobaccos.length} куплено
              </span>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: tobaccos.length ? `${(checkedCount / tobaccos.length) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <ul className={styles.tobaccoList}>
              {tobaccos.map((item) => {
                const isBought = checked.includes(item.name)
                return (
                  <li key={item.name} className={`${styles.tobaccoItem} ${isBought ? styles.bought : ''}`}>
                    <button
                      type="button"
                      className={styles.checkbox}
                      onClick={() => handleToggle(item.name)}
                      aria-pressed={isBought}
                      aria-label={isBought ? `Убрать ${item.name}` : `Отметить ${item.name}`}
                    >
                      {isBought ? '✓' : ''}
                    </button>
                    <span className={styles.tobaccoName}>{item.name}</span>
                    {item.count > 1 && (
                      <span className={styles.tobaccoCount}>{item.count} микса</span>
                    )}
                  </li>
                )
              })}
            </ul>

            <div className={styles.mixesSection}>
              <h3 className={styles.mixesSectionTitle}>Миксы ({mixes.length})</h3>
              <ul className={styles.mixList}>
                {mixes.map((mix) => (
                  <li key={mix.id} className={styles.mixItem}>
                    <button
                      type="button"
                      className={styles.mixHeader}
                      onClick={() => setExpandedMix(expandedMix === mix.id ? null : mix.id)}
                      aria-expanded={expandedMix === mix.id}
                    >
                      <span className={styles.mixTitle}>{mix.title}</span>
                      <span className={styles.mixFlavor}>{mix.flavor}</span>
                      <span className={styles.mixChevron}>{expandedMix === mix.id ? '▲' : '▼'}</span>
                    </button>
                    {expandedMix === mix.id && (
                      <ul className={styles.mixTobaccos}>
                        {mix.tobaccos.map((t) => (
                          <li key={t} className={`${styles.mixTobacco} ${checked.includes(t) ? styles.mixTobaccoBought : ''}`}>
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {showConfirm && (
          <div className={styles.overlay} onClick={() => setShowConfirm(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <h3 className={styles.modalTitle}>Обновить список?</h3>
              <p className={styles.modalText}>
                Текущие отметки сбросятся. Будет использована 1 генерация.
              </p>
              <div className={styles.modalActions}>
                <button type="button" className={styles.modalCancel} onClick={() => setShowConfirm(false)}>
                  Отмена
                </button>
                <button type="button" className={styles.modalConfirm} onClick={handleGenerate}>
                  Обновить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScreenLayout>
  )
}
