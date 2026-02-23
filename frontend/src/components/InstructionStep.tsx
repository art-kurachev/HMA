import { useState, useEffect, useRef, useCallback } from 'react'
import type { InstructionResponse } from '../api'
import { scheduleWarmupNotify } from '../api'
import type { TimerState } from '../draftStorage'
import { ScreenLayout } from './ScreenLayout'
import { CheckIcon, CloseIcon, WrenchIcon, PlayIcon, PauseIcon, RestartIcon } from './Icons'
import styles from './InstructionStep.module.css'

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
  'Горчит — сними колпак на 20–30 сек, убери 1 уголь или сдвинь к краю. Подожди 30 сек.',
  'Мало дыма — добавь уголь или сдвинь угли к центру. Дай прогреться 1–2 мин.',
  'Привкус угля — угли не разгорелись. Прогрей их полностью перед установкой.',
  'Слишком крепко — короткие затяжки + паузы 30–40 сек. Угли к краю.',
  'Вкус пропал — переверни угли, сдвинь к центру на 1 мин.',
  'Течёт сироп — табак слишком мокрый. В следующий раз промокни салфеткой.',
  'Тяжёлая тяга — проверь забивку и чистоту шахты.',
  'Быстро перегревается — сними 1 уголь и держи угли по краю.',
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
    <ScreenLayout onBack={timerStarted ? undefined : onBack} progressStep={4} totalSteps={4}>
    <div className={styles.wrap}>
      <h2 className={styles.title}>{mixTitle}</h2>
      <p className={styles.flavor}>{mixFlavor}</p>

      <section className={styles.section}>
        <h3>Табаки</h3>
        <ul className={styles.tobaccos}>
          {instruction.tobaccos.map((t) => (
            <li key={t.name}>
              <span className={styles.tobaccoName}>{t.name}</span>
              <span className={styles.tobaccoPct}>{t.percent}%</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Забивка</h3>
        <ul>
          {instruction.packing.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Прогрев</h3>
        <ul>
          {instruction.warmup.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Курение</h3>
        <ul>
          {instruction.smoking.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h3>Если не раскрылся</h3>
        <ul>
          {instruction.if_not_opened.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.finishBtn} onClick={onNext}>
          <CheckIcon size={18} />
          Закончить
        </button>

        {timerDismissed ? (
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => setShowSheet(true)}
            aria-label="Проблемы"
          >
            <WrenchIcon size={20} />
          </button>
        ) : paused ? (
          <div className={styles.timerPausedGroup}>
            <button type="button" className={styles.timerResumeBtn} onClick={handleResume}>
              <PlayIcon size={16} />
              <span>{formatTime(timeLeft)}</span>
            </button>
            <button type="button" className={styles.timerResetBtn} onClick={handleReset} aria-label="Сбросить">
              <RestartIcon size={16} />
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
            <CloseIcon size={18} />
            <span>Готово</span>
          </button>
        ) : isRunning ? (
          <button type="button" className={`${styles.timerBtn} ${styles.timerRunning}`} onClick={handlePause}>
            <PauseIcon size={18} />
            <span>{formatTime(timeLeft)}</span>
          </button>
        ) : (
          <button type="button" className={styles.timerBtn} onClick={handleStart}>
            <PlayIcon size={18} />
            <span>{formatTime(timeLeft)}</span>
          </button>
        )}
      </div>
    </div>

    {showSheet && (
      <div className={styles.overlay} onClick={() => setShowSheet(false)}>
        <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
          <div className={styles.sheetHandle} />
          <h3 className={styles.sheetTitle}>Как спасти кальян</h3>
          <ul className={styles.sheetList}>
            {RESCUE_TIPS.map((tip, i) => (
              <li key={i}>{tip}</li>
            ))}
          </ul>
          <button type="button" className={styles.sheetClose} onClick={() => setShowSheet(false)}>
            Закрыть
          </button>
        </div>
      </div>
    )}
    </ScreenLayout>
  )
}
