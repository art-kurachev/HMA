import type { MixParams } from './api'

export type Step = 'form' | 'mixes' | 'instruction' | 'feedback'

export interface FormState extends MixParams {}

export const BOWL_OPTIONS = [
  { value: 'turka' as const, label: 'Турка' },
  { value: 'phunnel' as const, label: 'Phunnel' },
  { value: 'killer' as const, label: 'Killer' },
]

export const HEAT_OPTIONS = [
  { value: 'kaloud' as const, label: 'Kaloud' },
  { value: 'foil' as const, label: 'Фольга' },
]

export const STRENGTH_OPTIONS = [
  { value: 'low' as const, label: 'Лёгкий' },
  { value: 'medium' as const, label: 'Средний' },
  { value: 'high' as const, label: 'Крепкий' },
]

export const PROFILE_OPTIONS = [
  'tea', 'dessert', 'berry', 'fruit', 'fresh', 'sour',
]
