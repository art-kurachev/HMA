import { useState, useEffect } from 'react'
import { getTelegramId, initTelegram } from './telegram'
import { suggestMixes, getInstruction, submitFeedback } from './api'
import type { Mix, InstructionResponse } from './api'
import type { FormState } from './types'
import type { Direction } from './components/DirectionScreen'
import { WelcomeScreen, incrementUsageCount } from './components/WelcomeScreen'
import { DirectionScreen } from './components/DirectionScreen'
import { SetupScreen } from './components/SetupScreen'
import { MixesStep } from './components/MixesStep'
import { InstructionStep } from './components/InstructionStep'
import { FeedbackStep } from './components/FeedbackStep'
import styles from './App.module.css'

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

  const [, setDirection] = useState<Direction>(null)
  const [mixes, setMixes] = useState<Mix[]>([])
  const [selectedMix, setSelectedMix] = useState<Mix | null>(null)
  const [instruction, setInstruction] = useState<InstructionResponse | null>(null)

  useEffect(() => {
    initTelegram()
    const id = getTelegramId()
    setTelegramId(id ?? 123456789)
  }, [])

  const uid = telegramId ?? 123456789

  const goToWelcome = () => {
    setStep('welcome')
    setDirection(null)
    setMixes([])
    setSelectedMix(null)
    setInstruction(null)
  }

  const handleFormSubmit = async (params: FormState) => {
    setError(null)
    setLoading(true)
    try {
      const apiParams = params.profiles.includes('any')
        ? { ...params, profiles: [] }
        : params
      const res = await suggestMixes(uid, apiParams)
      setMixes(res.mixes)
      setStep('mixes')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
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
      incrementUsageCount()
      goToWelcome()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.app}>
      {error && (
        <div className={styles.error}>
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {step === 'welcome' && (
        <WelcomeScreen onStart={() => setStep('direction')} />
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
          onNext={() => setStep('feedback')}
          onBack={() => setStep('mixes')}
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
