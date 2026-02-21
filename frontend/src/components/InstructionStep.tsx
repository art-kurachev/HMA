import { useState, useEffect, useRef, useCallback } from 'react'
import type { InstructionResponse } from '../api'
import { ScreenLayout } from './ScreenLayout'
import { CheckIcon, CloseIcon, WrenchIcon, PlayIcon, PauseIcon, RestartIcon } from './Icons'
import styles from './InstructionStep.module.css'

interface InstructionStepProps {
  instruction: InstructionResponse
  mixTitle: string
  mixFlavor: string
  onNext: () => void
  onBack: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

const RESCUE_TIPS = [
  'Горчит — сними калауд, продуй чашу, убери 1 уголь. Подожди 30 сек.',
  'Мало дыма — добавь уголь или сдвинь угли к центру.',
  'Привкус угля — прогрей ещё 2 минуты перед курением.',
  'Слишком крепко — делай короткие затяжки с паузами 30–40 сек.',
  'Вкус пропал — переверни угли свежей стороной, подожди минуту.',
  'Течёт сироп — забивка слишком мокрая. Промокни табак салфеткой в следующий раз.',
]

export function InstructionStep({ instruction, mixTitle, mixFlavor, onNext, onBack }: InstructionStepProps) {
  const [showSheet, setShowSheet] = useState(false)
  const [timeLeft, setTimeLeft] = useState(instruction.warmup_seconds)
  const [isRunning, setIsRunning] = useState(false)
  const [timerDone, setTimerDone] = useState(false)
  const [timerStarted, setTimerStarted] = useState(false)
  const [timerDismissed, setTimerDismissed] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer()
            setIsRunning(false)
            setTimerDone(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return clearTimer
  }, [isRunning, timeLeft, clearTimer])

  const [paused, setPaused] = useState(false)

  const handleStart = () => {
    setPaused(false)
    setTimerDone(false)
    setTimerStarted(true)
    setIsRunning(true)
  }

  const handlePause = () => {
    clearTimer()
    setIsRunning(false)
    setPaused(true)
  }

  const handleResume = () => {
    setPaused(false)
    setIsRunning(true)
  }

  const handleReset = () => {
    clearTimer()
    setIsRunning(false)
    setPaused(false)
    setTimerDone(false)
    setTimeLeft(instruction.warmup_seconds)
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
        <h3>Если не раскрылся</h3>
        <ul>
          {instruction.if_not_opened.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      </section>

      {instruction.tip && (
        <section className={styles.tipSection}>
          <h3>Совет</h3>
          <p>{instruction.tip}</p>
        </section>
      )}

      <section className={styles.section}>
        <h3>Курение</h3>
        <ul>
          {instruction.smoking.map((s, i) => (
            <li key={i}>{s}</li>
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
            onClick={() => setTimerDismissed(true)}
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
