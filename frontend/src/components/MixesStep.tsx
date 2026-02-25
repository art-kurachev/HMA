/**
 * Экран выбора микса — блок по макету Figma node 49-297:
 * https://www.figma.com/design/sstCrrH3CyVTfCkP9L7g1y/Iprit?node-id=49-297
 * Элементы с экранов «Первая» и «Выбор цели».
 */
import type { Mix } from '../api'
import { ScreenLayout } from './ScreenLayout'
import { ProgressRow } from './ProgressRow'
import { ArrowLeftIcon } from './Icons'
import styles from './MixesStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_SHARE_CIRCLE = '/icons/ShareCircle.svg'

interface MixesStepProps {
  mixes: Mix[]
  onSelect: (mix: Mix) => void
  onBack: () => void
}

export function MixesStep({ mixes, onSelect, onBack }: MixesStepProps) {
  const [first, second, third] = mixes

  return (
    <ScreenLayout onBack={onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={styles.wrap}>
        {/* Хедер как на «Выбор цели»: прогресс-бары + лого + тег */}
        <header className={welcomeStyles.topBar}>
          <ProgressRow total={3} activeStep={2} />
          <div className={welcomeStyles.headerRow}>
            <img
              src={ICON_LOGO}
              alt="Iprit"
              className={welcomeStyles.logo}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className={styles.tag} aria-hidden>
              <span className={styles.tagText}>Просто и быстро</span>
              <img src={ICON_SHARE_CIRCLE} alt="" className={styles.tagIconSvg} aria-hidden />
            </div>
          </div>
        </header>

        {/* Контент: заголовок + сетка карточек (1 слева, 2 справа) */}
        <div className={styles.mainContent}>
          <div className={styles.titleRow}>
            <div className={styles.bowlPlaceholder} aria-hidden>
              <img src="/bowl-mixes.png" alt="" width={193} height={224} className={styles.bowlImage} />
            </div>
            <h2 className={styles.title}>Предлагаю варианты</h2>
          </div>

          <div className={styles.cardsGrid}>
            <div className={styles.colLeft}>
              {first && (
                <button
                  type="button"
                  className={`${styles.card} ${styles.cardFirst}`}
                  onClick={() => onSelect(first)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.tagsRow} role="list">
                      {(first.tobaccos ?? []).map((t) => (
                        <span
                          key={t}
                          className={styles.tobaccoTag}
                          role="listitem"
                          style={{ border: '1px solid rgba(255, 101, 68, 0.2)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardBottom}>
                      <h3 className={styles.cardTitle}>{first.title}</h3>
                      {first.flavor ? <p className={styles.flavor}>{first.flavor}</p> : null}
                    </div>
                  </div>
                </button>
              )}
            </div>
            <div className={styles.colRight}>
              {second && (
                <button
                  type="button"
                  className={`${styles.card} ${styles.cardSecond}`}
                  onClick={() => onSelect(second)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.tagsRow} role="list">
                      {(second.tobaccos ?? []).map((t) => (
                        <span
                          key={t}
                          className={styles.tobaccoTag}
                          role="listitem"
                          style={{ border: '1px solid rgba(255, 101, 68, 0.2)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardBottom}>
                      <h3 className={styles.cardTitle}>{second.title}</h3>
                      {second.flavor ? <p className={styles.flavor}>{second.flavor}</p> : null}
                    </div>
                  </div>
                </button>
              )}
              {third && (
                <button
                  type="button"
                  className={`${styles.card} ${styles.cardThird}`}
                  onClick={() => onSelect(third)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.tagsRow} role="list">
                      {(third.tobaccos ?? []).map((t) => (
                        <span
                          key={t}
                          className={styles.tobaccoTag}
                          role="listitem"
                          style={{ border: '1px solid rgba(255, 101, 68, 0.2)' }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className={styles.cardBottom}>
                      <h3 className={styles.cardTitle}>{third.title}</h3>
                      {third.flavor ? <p className={styles.flavor}>{third.flavor}</p> : null}
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Нижний блок как на «Выбор цели»: кнопка «Вернуться» */}
        <div className={`${welcomeStyles.bottom} ${styles.bottomMixes}`}>
          <button
            type="button"
            className={welcomeStyles.primaryBtn}
            onClick={onBack}
            aria-label="Вернуться"
          >
            <ArrowLeftIcon size={24} />
            Вернуться
          </button>
        </div>
      </div>
    </ScreenLayout>
  )
}
