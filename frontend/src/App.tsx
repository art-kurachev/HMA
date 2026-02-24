import { useState, useEffect, useCallback } from 'react'
import { getTelegramId, initTelegram } from './telegram'
import { suggestMixes, getInstruction, submitFeedback } from './api'
import type { Mix, InstructionResponse } from './api'
import type { FormState } from './types'
import type { Direction } from './components/DirectionScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { saveDraft, loadDraft, clearDraft } from './draftStorage'
import { DirectionScreen } from './components/DirectionScreen'
import { SetupScreen } from './components/SetupScreen'
import { MixesStep } from './components/MixesStep'
import { InstructionStep } from './components/InstructionStep'
import { FeedbackStep } from './components/FeedbackStep'
import { Loader } from './components/Loader'
import styles from './App.module.css'

const LOADING_MESSAGES: Record<Step, string> = {
  welcome: 'Загрузка...',
  direction: 'Загрузка...',
  setup: 'Подбираем миксы...',
  mixes: 'Генерирую инструкцию...',
  instruction: 'Загрузка...',
  feedback: 'Отправляю...',
  done: 'Загрузка...',
}

type Step =
  | 'welcome'
  | 'direction'
  | 'setup'
  | 'mixes'
  | 'instruction'
  | 'feedback'
  | 'done'

export default function App() {
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('welcome')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [direction, setDirection] = useState<Direction>(null)
  const [formState, setFormState] = useState<FormState | null>(null)
  const [mixes, setMixes] = useState<Mix[]>([])
  const [selectedMix, setSelectedMix] = useState<Mix | null>(null)
  const [instruction, setInstruction] = useState<InstructionResponse | null>(null)
  const [timerState, setTimerState] = useState<import('./draftStorage').TimerState | null>(null)

  useEffect(() => {
    initTelegram()
    const id = getTelegramId()
    setTelegramId(id ?? 123456789)
  }, [])

  useEffect(() => {
    const draft = loadDraft()
    if (!draft) return
    setStep(draft.step)
    setDirection(draft.direction)
    setFormState(draft.formState)
    setMixes(draft.mixes ?? [])
    setSelectedMix(draft.selectedMix)
    setInstruction(draft.instruction)
    setTimerState(draft.timerState ?? null)
  }, [])

  const uid = telegramId ?? 123456789

  const goToWelcome = useCallback(() => {
    setStep('welcome')
    setDirection(null)
    setFormState(null)
    setMixes([])
    setSelectedMix(null)
    setInstruction(null)
    setTimerState(null)
    clearDraft()
  }, [])

  useEffect(() => {
    if (step === 'welcome') return
    saveDraft({
      step: step as import('./draftStorage').DraftStep,
      direction,
      formState,
      mixes,
      selectedMix,
      instruction,
      timerState: step === 'instruction' ? timerState : null,
    })
  }, [step, direction, formState, mixes, selectedMix, instruction, timerState])

  const handleFormSubmit = async (params: FormState) => {
    setError(null)
    setLoading(true)
    setFormState(params)
    try {
      const apiParams = params.profiles.includes('any')
        ? { ...params, profiles: [] }
        : params
      const res = await suggestMixes(uid, apiParams)
      setMixes(res.mixes)
      setStep('mixes')
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Ошибка'
      setError(msg === 'quota_exceeded' ? 'Лимит запросов исчерпан. Следующий — через неделю.' : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleMixSelect = async (mix: Mix) => {
    setSelectedMix(mix)
    setError(null)
    setLoading(true)
    try {
      const inst = await getInstruction(uid, mix.id)
      setInstruction(inst)
      setStep('instruction')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackSubmit = async (rating: boolean, reason: string) => {
    if (!selectedMix?.mix_db_id) return
    setError(null)
    setLoading(true)
    try {
      await submitFeedback(uid, selectedMix.mix_db_id, rating, reason)
      goToWelcome()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.app}>
      {loading && (
        <Loader message={LOADING_MESSAGES[step]} />
      )}
      {error && (
        <div className={styles.error}>
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {step === 'welcome' && (
        <WelcomeScreen
          telegramId={uid}
          onStart={() => setStep('direction')}
          onSetup={() => setStep('setup')}
          onOpenShelf={() => {
            // TODO: открыть sheet с полкой табаков (дизайн придёт позже)
          }}
        />
      )}
      {step === 'direction' && (
        <DirectionScreen
          onBack={() => setStep('welcome')}
          onNext={(d) => {
            setDirection(d)
            setStep('setup')
          }}
        />
      )}
      {step === 'setup' && (
        <SetupScreen
          onBack={() => setStep('direction')}
          onSubmit={handleFormSubmit}
          loading={loading}
          initialFormState={formState}
        />
      )}
      {step === 'mixes' && (
        <MixesStep
          mixes={mixes}
          onSelect={handleMixSelect}
          onBack={() => setStep('setup')}
        />
      )}
      {step === 'instruction' && instruction && selectedMix && (
        <InstructionStep
          instruction={instruction}
          mixTitle={selectedMix.title}
          mixFlavor={selectedMix.flavor}
          mixId={selectedMix.id}
          telegramId={uid}
          initialTimerState={timerState}
          onTimerStateChange={setTimerState}
          onNext={() => {
            setTimerState(null)
            setStep('feedback')
          }}
          onBack={() => {
            setTimerState(null)
            setStep('mixes')
          }}
        />
      )}
      {step === 'feedback' && (
        <FeedbackStep
          onSubmit={handleFeedbackSubmit}
          onBack={() => setStep('instruction')}
          loading={loading}
        />
      )}
    </div>
  )
}
