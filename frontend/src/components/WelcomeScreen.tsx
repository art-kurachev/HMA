import { useEffect, useState } from 'react'

import {
  createStarsInvoice,
  getQuota,
  getStarsPackages,
  type StarsPackage,
} from '../api'
import { openInvoice } from '../telegram'
import { ScreenLayout } from './ScreenLayout'
import progressRowStyles from './ProgressRow.module.css'
import styles from './WelcomeScreen.module.css'

/* Локальные SVG из frontend/public/icons/ (имена как в макете) */
const ICON_LOGO = '/icons/Union.svg'
const ICON_ADD_CIRCLE = '/icons/add-circle.svg'
const ICON_DATABASE = '/icons/Database.svg'
const ICON_SHARE_CIRCLE = '/icons/ShareCircle.svg'
const ICON_ROUND_GRAPH = '/icons/RoundGraph.svg'

const IMG_HOOKAH = '/hookah.png'

interface WelcomeScreenProps {
  telegramId: number
  onStart: () => void
  onSetup: () => void
  onOpenShelf?: () => void
  onOpenShoppingList?: () => void
}

export function WelcomeScreen({
  telegramId,
  onStart,
  onSetup,
  onOpenShelf,
  onOpenShoppingList,
}: WelcomeScreenProps) {
  const [remaining, setRemaining] = useState<number | null>(null)
  const [packages, setPackages] = useState<StarsPackage[]>([])
  const [showPackages, setShowPackages] = useState(false)
  const [loading, setLoading] = useState(false)
  const [buyError, setBuyError] = useState<string | null>(null)

  const refreshQuota = () => {
    getQuota(telegramId)
      .then((q) => setRemaining(q.remaining))
      .catch(() => setRemaining(0))
  }

  useEffect(() => {
    refreshQuota()
  }, [telegramId])

  const handleBuyClick = async () => {
    setBuyError(null)
    setLoading(true)
    try {
      const { packages: pkgs } = await getStarsPackages()
      if (pkgs.length === 0) {
        setBuyError('Нет доступных пакетов')
        return
      }
      setPackages(pkgs)
      setShowPackages(true)
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Ошибка загрузки пакетов')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPackage = async (pkg: StarsPackage) => {
    setBuyError(null)
    setLoading(true)
    try {
      const { invoice_link } = await createStarsInvoice(
        telegramId,
        pkg.generations,
        pkg.stars
      )
      setShowPackages(false)
      openInvoice(invoice_link, (status) => {
        if (status === 'paid') {
          refreshQuota()
        }
      })
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Ошибка оплаты')
    } finally {
      setLoading(false)
    }
  }

  const quotaDisplay =
    remaining === null ? '—' : remaining === -1 ? '∞' : String(remaining)

  return (
    <>
      <ScreenLayout progressStep={0} totalSteps={0} fullBleed>
        <div className={styles.welcome}>
          <div className={styles.heroWrap}>
          <div className={styles.heroInner}>
            <img
              src={IMG_HOOKAH}
              alt=""
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        </div>

        <header className={styles.topBar}>
          <div className={progressRowStyles.progressRow} aria-hidden />
          <div className={styles.headerRow}>
            <img
              src={ICON_LOGO}
              alt="Iprit"
              className={styles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <button
              type="button"
              className={styles.shelfBtn}
              onClick={onOpenShelf}
              aria-label="Моя полка"
            >
              Моя полка
              <img
                src={ICON_DATABASE}
                alt=""
                className={styles.shelfBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
          </div>
        </header>

        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.buyGenerationsBtn}
            onClick={handleBuyClick}
            disabled={loading}
            aria-label="Добавить генерации"
          >
            <img src={ICON_ADD_CIRCLE} alt="" className={styles.buyGenerationsIcon} aria-hidden />
            Добавить
          </button>
          <div className={styles.quotaRow}>
            <div className={styles.quotaBadge}>{quotaDisplay}</div>
            <span className={styles.quotaLabel}>
              Доступно
              <br />
              рекомендаций
            </span>
          </div>
          <h1 className={styles.title}>
            {`Ассистент —\nнастройка,\nпрогрев,\nрезультат.`}
          </h1>
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.primaryBtn} ${styles.primaryBtnPadding} ${styles.primaryBtnWelcome}`}
              onClick={onStart}
            >
              Просто и быстро
              <img
                src={ICON_SHARE_CIRCLE}
                alt=""
                className={styles.primaryBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onSetup}
              title="Сетап"
              aria-label="Сетап"
            >
              Сетап
              <img
                src={ICON_ROUND_GRAPH}
                alt=""
                className={styles.secondaryBtnIcon}
                aria-hidden
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </button>
          </div>
          <button
            type="button"
            className={styles.shoppingListBtn}
            onClick={onOpenShoppingList}
          >
            🛒 Список покупок
          </button>
        </div>
      </div>

      {showPackages && (
        <div className={styles.packagesOverlay} onClick={() => setShowPackages(false)}>
          <div
            className={styles.packagesModal}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.packagesHeader}>
              <h3>Добавить</h3>
              <button
                type="button"
                className={styles.packagesClose}
                onClick={() => setShowPackages(false)}
                aria-label="Закрыть"
              >
                ×
              </button>
            </div>
            {buyError && <div className={styles.packagesError}>{buyError}</div>}
            <div className={styles.packagesList}>
              {packages.map((pkg, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles.packageBtn}
                  onClick={() => handleSelectPackage(pkg)}
                  disabled={loading}
                >
                  <span className={styles.packageLabel}>
                    {pkg.generations} рекомендаций
                  </span>
                  <span className={styles.packageStars}>⭐ {pkg.stars}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </ScreenLayout>
    </>
  )
}
