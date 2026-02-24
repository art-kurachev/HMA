import { useState, useEffect, useRef, useCallback } from 'react'
import type { InstructionResponse } from '../api'
import { scheduleWarmupNotify } from '../api'
import type { TimerState } from '../draftStorage'
import { ScreenLayout } from './ScreenLayout'
import {
  EndIcon,
  TickCircleIcon,
  DangerIcon,
  PlayIcon,
  PauseIcon,
  RestartIcon,
  LayerIcon,
  TimerIcon,
  InstructionCard1Icon,
  InstructionCard2Icon,
  InstructionCard3Icon,
  InstructionCard4Icon,
  InstructionCard5Icon,
  CloseIcon,
} from './Icons'
import styles from './InstructionStep.module.css'
import welcomeStyles from './WelcomeScreen.module.css'

const ICON_LOGO = '/icons/Union.svg'
const ICON_SHARE_CIRCLE = '/icons/ShareCircle.svg'

interface InstructionStepProps {
  instruction: InstructionResponse
  mixTitle: string
  mixFlavor: string
  mixId: string
  telegramId: number
  initialTimerState: TimerState | null
  onTimerStateChange: (state: TimerState | null) => void
  onNext: () => void
  onBack: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const RESCUE_TIPS = [
  'Горчит — Сними колпак на 20–30 сек, убери 1 уголь или сдвинь к краю. Подожди 30 сек.',
  'Мало дыма — Добавь уголь или сдвинь угли к центру. Дай прогреться 1–2 мин.',
  'Привкус угля — Угли не разгорелись. Прогрей их полностью перед установкой.',
  'Слишком крепко — Короткие затяжки + паузы 30–40 сек. Угли к краю.',
  'Вкус пропал — Переверни угли, сдвинь к центру на 1 мин.',
  'Течёт сироп — Табак слишком мокрый. В следующий раз промокни салфеткой.',
  'Тяжёлая тяга — Проверь забивку и чистоту шахты.',
  'Быстро перегревается — Сними 1 уголь и держи угли по краю.',
]

export function InstructionStep({
  instruction,
  mixTitle,
  mixFlavor,
  mixId,
  telegramId,
  initialTimerState,
  onTimerStateChange,
  onNext,
  onBack,
}: InstructionStepProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [timeLeft, setTimeLeft] = useState(instruction.warmup_seconds)
  const [isRunning, setIsRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timerDismissed, setTimerDismissed] = useState(false)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const durationRef = useRef<number>(instruction.warmup_seconds)
  const restoredRef = useRef(false)

  useEffect(() => {
    if (restoredRef.current || !initialTimerState || initialTimerState.mixId !== mixId) return
    restoredRef.current = true
    const ts = initialTimerState
    durationRef.current = ts.duration
    if (ts.state === 'running') {
      const elapsed = (Date.now() - ts.startTime) / 1000
      const remaining = Math.max(0, Math.ceil(ts.duration - elapsed))
      setTimeLeft(remaining)
      if (remaining <= 0) {
        setTimerDone(true)
        setTimerStarted(true)
        return
      }
      startTimeRef.current = ts.startTime
      setIsRunning(true)
      setTimerStarted(true)
    } else if (ts.state === 'paused' && ts.remainingWhenPaused != null) {
      setTimeLeft(ts.remainingWhenPaused)
      setPaused(true)
      setTimerStarted(true)
    } else if (ts.state === 'done') {
      setTimeLeft(0)
      setTimerDone(true)
      setTimerStarted(true)
    } else if (ts.state === 'dismissed') {
      setTimerDismissed(true)
      setTimerStarted(true)
    }
  }, [initialTimerState, mixId])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    startTimeRef.current = null
  }, [])

  const recalcTimeLeft = useCallback(() => {
    if (startTimeRef.current === null) return
    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const remaining = Math.max(0, Math.ceil(durationRef.current - elapsed))
    setTimeLeft(remaining)
    if (remaining <= 0) {
      const st = startTimeRef.current
      const dur = durationRef.current
      clearTimer()
      setIsRunning(false)
      setTimerDone(true)
      onTimerStateChange({ mixId, state: 'done', startTime: st!, duration: dur })
    }
  }, [clearTimer, mixId, onTimerStateChange])

  useEffect(() => {
    if (isRunning) {
      recalcTimeLeft()
      intervalRef.current = setInterval(recalcTimeLeft, 500)
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, recalcTimeLeft])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && isRunning && startTimeRef.current !== null) {
        recalcTimeLeft()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isRunning, recalcTimeLeft])

  const handleStart = () => {
    setPaused(false)
    setTimerDone(false)
    setTimerStarted(true)
    const duration = instruction.warmup_seconds
    const startTime = Date.now()
    durationRef.current = duration
    startTimeRef.current = startTime
    setIsRunning(true)
    onTimerStateChange({ mixId, state: 'running', startTime, duration })
    scheduleWarmupNotify(telegramId, instruction.warmup_seconds).catch(() => {
      /* ignore — уведомление опционально */
    })
  }

  const handlePause = () => {
    const elapsed = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0
    const remaining = Math.max(0, Math.ceil(durationRef.current - elapsed))
    setTimeLeft(remaining)
    clearTimer()
    setIsRunning(false)
    setPaused(true)
    onTimerStateChange({
      mixId,
      state: 'paused',
      startTime: startTimeRef.current ?? Date.now(),
      duration: durationRef.current,
      remainingWhenPaused: remaining,
    })
  }

  const handleResume = () => {
    durationRef.current = timeLeft
    const startTime = Date.now()
    startTimeRef.current = startTime
    setPaused(false)
    setIsRunning(true)
    onTimerStateChange({ mixId, state: 'running', startTime, duration: timeLeft })
  }

  const handleReset = () => {
    clearTimer()
    setIsRunning(false)
    setPaused(false)
    setTimerDone(false)
    setTimeLeft(instruction.warmup_seconds)
    durationRef.current = instruction.warmup_seconds
    onTimerStateChange(null)
  }

  return (
    <ScreenLayout onBack={timerStarted ? undefined : onBack} hideBackButton totalSteps={0} fullBleed>
      <div className={styles.wrap}>
        <header className={welcomeStyles.topBar}>
          <div className={welcomeStyles.headerRow}>
            <img src={ICON_LOGO} alt="Iprit" className={welcomeStyles.logo} onError={(e) => { e.currentTarget.style.display = 'none' }} />
            <div className={styles.tag} aria-hidden>
              <span className={styles.tagText}>Просто и быстро</span>
              <img src={ICON_SHARE_CIRCLE} alt="" className={styles.tagIconSvg} aria-hidden />
            </div>
          </div>
        </header>

        <div className={styles.mainContent}>
          <div className={styles.headerBlock}>
            <h2 className={styles.title}>{mixTitle}</h2>
            <p className={styles.flavor}>{mixFlavor}</p>
          </div>

          <div className={styles.cardsList}>
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Табаки</h3>
                <div className={styles.navBtn} aria-hidden>
                  <InstructionCard1Icon size={16} />
                </div>
              </div>
              {instruction.tobaccos.map((t) => (
                <div key={t.name} className={styles.taskItem}>
                  <span className={styles.taskItemLabel}>{t.percent}%</span>
                  <span className={styles.taskItemName}>{t.name}</span>
                </div>
              ))}
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Забивка</h3>
                <div className={styles.navBtn} aria-hidden>
                  <InstructionCard2Icon size={16} />
                </div>
              </div>
              <ul className={styles.sectionList}>
                {instruction.packing.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Прогрев</h3>
                <div className={styles.navBtn} aria-hidden>
                  <InstructionCard3Icon size={16} />
                </div>
              </div>
              <ul className={styles.sectionList}>
                {instruction.warmup.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Курение</h3>
                <div className={styles.navBtn} aria-hidden>
                  <InstructionCard4Icon size={16} />
                </div>
              </div>
              <ul className={styles.sectionList}>
                {instruction.smoking.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>

            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>Если не раскрылся</h3>
                <div className={styles.navBtn} aria-hidden>
                  <InstructionCard5Icon size={16} />
                </div>
              </div>
              <ul className={styles.sectionList}>
                {instruction.if_not_opened.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className={`${welcomeStyles.bottom} ${styles.bottomInstruction}`}>
          <div className={styles.bottomBlock}>
            <button type="button" className={styles.finishBtn} onClick={onNext}>
              <EndIcon size={24} />
              Закончить
            </button>
            {timerDismissed ? (
              <button
                type="button"
                className={styles.problemsBtn}
                onClick={() => setShowSheet(true)}
                aria-label="Проблемы"
              >
                <DangerIcon size={24} />
                <span>Проблемы</span>
              </button>
            ) : paused ? (
              <div className={styles.timerPausedGroup}>
                <button type="button" className={styles.timerResumeBtn} onClick={handleResume}>
                  <PlayIcon size={24} />
                  <span>{formatTime(timeLeft)}</span>
                </button>
                <button type="button" className={styles.timerResetBtn} onClick={handleReset} aria-label="Сбросить">
                  <RestartIcon size={24} />
                </button>
              </div>
            ) : timerDone ? (
              <button
                type="button"
                className={`${styles.timerBtn} ${styles.timerDone}`}
                onClick={() => {
                  setTimerDismissed(true)
                  onTimerStateChange({
                    mixId,
                    state: 'dismissed',
                    startTime: startTimeRef.current ?? Date.now(),
                    duration: durationRef.current,
                  })
                }}
              >
                <TickCircleIcon size={24} />
                <span>Готово</span>
              </button>
            ) : isRunning ? (
              <button type="button" className={`${styles.timerBtn} ${styles.timerRunning}`} onClick={handlePause}>
                <PauseIcon size={18} />
                <span>{formatTime(timeLeft)}</span>
              </button>
            ) : (
              <button type="button" className={styles.timerBtn} onClick={handleStart}>
                <TimerIcon size={24} />
                <span>Прогрев</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {showSheet && (
        <div className={styles.overlay} onClick={() => setShowSheet(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h3 className={styles.sheetTitle}>Как спасти кальян</h3>
              <button
                type="button"
                className={styles.sheetCloseBtn}
                onClick={() => setShowSheet(false)}
                aria-label="Закрыть"
              >
                <CloseIcon size={24} />
              </button>
            </div>
            <ul className={styles.sheetList}>
              {RESCUE_TIPS.map((tip, i) => {
                const [rawTitle, ...rest] = tip.split('—')
                const title = rawTitle?.trim() ?? tip
                const description = rest.join('—').trim()
                return (
                  <li key={i}>
                    <div className={styles.sheetTipTitle}>{title}</div>
                    {description && <div className={styles.sheetTipText}>{description}</div>}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </ScreenLayout>
  )
}
