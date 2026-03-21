import type { Mix, InstructionResponse } from './api'
import type { FormState } from './types'
import type { Direction } from './components/DirectionScreen'

const DRAFT_KEY = 'hma_draft'

export type DraftStep = 'direction' | 'setup' | 'mixes' | 'instruction' | 'feedback' | 'shopping-list'

export type TimerStateStatus = 'idle' | 'running' | 'paused' | 'done' | 'dismissed'

export interface TimerState {
  mixId: string
  state: TimerStateStatus
  startTime: number
  duration: number
  remainingWhenPaused?: number
}

export type MixesFromStep = 'direction' | 'setup'

export interface AppDraft {
  step: DraftStep
  direction: Direction | null
  formState: FormState | null
  mixes: Mix[]
  selectedMix: Mix | null
  instruction: InstructionResponse | null
  timerState: TimerState | null
  mixesFromStep?: MixesFromStep
}

export function saveDraft(draft: AppDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    /* ignore */
  }
}

export function loadDraft(): AppDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AppDraft
  } catch {
    return null
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* ignore */
  }
}
