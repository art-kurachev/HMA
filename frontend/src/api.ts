const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

export interface MixParams {
  bowl: 'turka' | 'phunnel' | 'killer'
  heat_control: 'kaloud' | 'foil'
  has_cap: boolean
  coal_size: 25 | 26
  coal_count_start: 2 | 3 | 4
  strength: 'low' | 'medium' | 'high'
  profiles: string[]
  available_tobaccos_text: string
}

export interface MixCompositionItem {
  name: string
  percent: number
}

export interface Mix {
  id: string
  title: string
  composition: MixCompositionItem[]
  why: string[]
  mix_db_id?: number
}

export interface SuggestResponse {
  mixes: Mix[]
  clarify: string[]
}

export interface InstructionResponse {
  headline: string
  bowl: string[]
  heat: string[]
  if_not_opened: string[]
  smoke: string[]
  tuning: string[]
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    if (!res.ok) {
      throw new Error(text || res.statusText || 'Ошибка сервера')
    }
    throw new Error('Сервер вернул неверный ответ')
  }
  if (!res.ok) {
    const err = data && typeof data === 'object' && 'detail' in data
      ? (data as { detail: unknown }).detail
      : text || res.statusText
    throw new Error(typeof err === 'string' ? err : JSON.stringify(err))
  }
  return (data ?? {}) as T
}

export async function suggestMixes(telegramId: number, params: MixParams): Promise<SuggestResponse> {
  return request<SuggestResponse>('/v1/mixes/suggest', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId, params }),
  })
}

export async function getInstruction(telegramId: number, mixId: string): Promise<InstructionResponse> {
  return request<InstructionResponse>(`/v1/mixes/${mixId}/instruction`, {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId }),
  })
}

export async function submitFeedback(
  telegramId: number,
  mixDbId: number,
  rating: boolean,
  reason: string
): Promise<void> {
  await request('/v1/feedback', {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: telegramId,
      mix_db_id: mixDbId,
      rating,
      reason,
    }),
  })
}
