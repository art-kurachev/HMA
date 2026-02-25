/**
 * Экран предзагрузки — макет Figma node 48:350 «Enter - 2». Скрывается через 2 с.
 */
import { useEffect } from 'react'
import styles from './SplashScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const IMG_OVERLAY =
  'https://www.figma.com/api/mcp/asset/ef24c265-ea40-4e9d-9781-a7586e974768'

interface SplashScreenProps {
  onDismiss: () => void
}

export function SplashScreen({ onDismiss }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 2000)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div
      className={styles.splash}
      aria-label="Загрузка приложения Iprit"
    >
      <div className={styles.bg} aria-hidden />
      <div className={styles.overlay} aria-hidden>
        <img
          src={IMG_OVERLAY}
          alt=""
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <p className={styles.topText}>
        <span className={styles.topTextLine}>
          {'Кальянный ассистент,\nне просто «советчик\nпо миксам»'}
        </span>
      </p>

      <div className={styles.bottomBlock}>
        <img
          src={ICON_LOGO}
          alt=""
          className={styles.logo}
          width={135}
          height={62}
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
        <p className={styles.subtitle}>{'hookah maker\nassistent'}</p>
      </div>
    </div>
  )
}
