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

export interface Mix {
  id: string
  title: string
  tobaccos: string[]
  flavor: string
  mix_db_id?: number
}

export interface SuggestResponse {
  mixes: Mix[]
  clarify: string[]
}

export interface TobaccoItem {
  name: string
  percent: number
}

export interface InstructionResponse {
  tobaccos: TobaccoItem[]
  packing: string[]
  warmup: string[]
  warmup_seconds: number
  smoking: string[]
  if_not_opened: string[]
}

async function request<T>(path: string, options: RequestInit & { timeout?: number } = {}): Promise<T> {
  const { timeout: timeoutMs, ...fetchOptions } = options
  const controller = timeoutMs != null ? new AbortController() : undefined
  const id =
    controller &&
    window.setTimeout(() => controller.abort(), timeoutMs)

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    signal: controller?.signal,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })
  if (id != null) window.clearTimeout(id)
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

export interface QuotaResponse {
  remaining: number  // -1 = unlimited
  is_creator: boolean
}

export async function getQuota(telegramId: number): Promise<QuotaResponse> {
  return request<QuotaResponse>(`/v1/mixes/quota?telegram_id=${telegramId}`)
}

export async function suggestMixes(telegramId: number, params: MixParams): Promise<SuggestResponse> {
  return request<SuggestResponse>('/v1/mixes/suggest', {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId, params }),
    timeout: 90000,
  })
}

export type QuickSuggestDirection = 'movie' | 'relax' | 'surprise'

export async function quickSuggestMixes(
  telegramId: number,
  direction: QuickSuggestDirection,
  noTobacco = true
): Promise<SuggestResponse> {
  return request<SuggestResponse>('/v1/mixes/quick-suggest', {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: telegramId,
      direction,
      no_tobacco: noTobacco,
    }),
    timeout: 45000,
  })
}

export async function getInstruction(telegramId: number, mixId: string): Promise<InstructionResponse> {
  return request<InstructionResponse>(`/v1/mixes/${mixId}/instruction`, {
    method: 'POST',
    body: JSON.stringify({ telegram_id: telegramId }),
  })
}

export async function scheduleWarmupNotify(
  telegramId: number,
  warmupSeconds: number
): Promise<void> {
  await request('/v1/notify/warmup', {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: telegramId,
      warmup_seconds: warmupSeconds,
    }),
  })
}

export async function submitFeedback(
  telegramId: number,
  mixDbId: number,
  rating: boolean,
  reason: string
): Promise<void> {
  await request('/v1/feedback/', {
    method: 'POST',
    body: JSON.stringify({
      telegram_id: telegramId,
      mix_db_id: mixDbId,
      rating,
      reason,
    }),
  })
}
