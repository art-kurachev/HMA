import { useState, useEffect } from 'react'
import { getTelegramId, initTelegram } from './telegram'
import { suggestMixes, getInstruction, submitFeedback } from './api'
import type { Mix, InstructionResponse } from './api'
import type { FormState } from './types'
import { FormStep } from './components/FormStep'
import { MixesStep } from './components/MixesStep'
import { InstructionStep } from './components/InstructionStep'
import { FeedbackStep } from './components/FeedbackStep'
import styles from './App.module.css'

type Step = 'form' | 'mixes' | 'instruction' | 'feedback' | 'done'

export default function App() {
  const [telegramId, setTelegramId] = useState<number | null>(null)
  const [step, setStep] = useState<Step>('form')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [mixes, setMixes] = useState<Mix[]>([])
  const [selectedMix, setSelectedMix] = useState<Mix | null>(null)
  const [instruction, setInstruction] = useState<InstructionResponse | null>(null)

  useEffect(() => {
    initTelegram()
    const id = getTelegramId()
    setTelegramId(id)
    if (!id) {
      setTelegramId(123456789)
    }
  }, [])

  const uid = telegramId ?? 123456789

  const handleFormSubmit = async (params: FormState) => {
    setError(null)
    setLoading(true)
    try {
      const res = await suggestMixes(uid, params)
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
      setStep('done')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'done') {
    return (
      <div className={styles.done}>
        <h2>Спасибо за фидбек! 🙏</h2>
        <p>Приятного кальяна</p>
      </div>
    )
  }

  return (
    <div className={styles.app}>
      {error && (
        <div className={styles.error}>
          {error}
          <button type="button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {step === 'form' && (
        <FormStep onSubmit={handleFormSubmit} loading={loading} />
      )}
      {step === 'mixes' && (
        <MixesStep mixes={mixes} onSelect={handleMixSelect} />
      )}
      {step === 'instruction' && instruction && selectedMix && (
        <InstructionStep
          instruction={instruction}
          mixTitle={selectedMix.title}
          onNext={() => setStep('feedback')}
        />
      )}
      {step === 'feedback' && (
        <FeedbackStep onSubmit={handleFeedbackSubmit} loading={loading} />
      )}
    </div>
  )
}
