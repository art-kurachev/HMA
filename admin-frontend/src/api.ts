const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/v1`
  : '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('admin_token')
}

function parseErrorDetail(err: { detail?: unknown }): string {
  const d = err?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d.length > 0) {
    const first = d[0]
    return typeof first === 'object' && first != null && 'msg' in first
      ? String((first as { msg: unknown }).msg)
      : JSON.stringify(d)
  }
  return ''
}

export async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(err) || 'Login failed')
  }
  const data = await res.json()
  return data.token
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('admin_token')
      window.dispatchEvent(new CustomEvent('admin:unauthorized'))
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(parseErrorDetail(err) || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface Stats {
  users_count: number
  total_requests: number
  total_attempts: number
  feedback_count: number
  feedback_positive: number
  feedback_negative: number
}

export function getStats(): Promise<Stats> {
  return request<Stats>('/admin/stats')
}

export interface FeedbackItem {
  id: number
  mix_id: number
  telegram_id: number
  rating: boolean
  reason: string | null
  provider: string
  llm_model: string
  created_at: string | null
}

export function getFeedback(limit?: number, offset?: number): Promise<FeedbackItem[]> {
  const params = new URLSearchParams()
  if (limit != null) params.set('limit', String(limit))
  if (offset != null) params.set('offset', String(offset))
  return request<FeedbackItem[]>(`/admin/feedback?${params}`)
}

export interface StarsPackage {
  generations: number
  stars: number
}

export interface Settings {
  daily_request_limit: number
  disable_daily_limit: boolean
  llm_provider: string
  llm_model: string
  stars_packages: StarsPackage[]
}

export function getSettings(): Promise<Settings> {
  return request<Settings>('/admin/settings')
}

export function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  return request<Settings>('/admin/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export interface UserItem {
  id: number
  telegram_id: number
  provider_group: string | null
  created_at: string | null
  attempts: number
  sessions_count: number
  feedback_count: number
  last_activity: string | null
  paid_generations: number
  friday_bonus: number
  welcome_requests_used: number
  purchases_count: number
  total_stars: number
}

export function getUsers(limit?: number, offset?: number): Promise<UserItem[]> {
  const params = new URLSearchParams()
  if (limit != null) params.set('limit', String(limit))
  if (offset != null) params.set('offset', String(offset))
  return request<UserItem[]>(`/admin/users?${params}`)
}

export interface MixDetail {
  id: number
  mix_json: { title?: string; tobaccos?: Array<{ name: string; percent?: number }>; flavor?: string }
  provider: string
  created_at: string | null
}

export function getMix(mixId: number): Promise<MixDetail> {
  return request<MixDetail>(`/admin/mixes/${mixId}`)
}

export interface ActivityPoint {
  date: string
  requests: number
}

export function getActivity(days?: number): Promise<ActivityPoint[]> {
  const params = new URLSearchParams()
  if (days != null) params.set('days', String(days))
  return request<ActivityPoint[]>(`/admin/activity?${params}`)
}

export interface ProviderStat {
  provider: string
  count: number
}

export function getProvidersStats(): Promise<ProviderStat[]> {
  return request<ProviderStat[]>('/admin/providers')
}

export interface MixListItem {
  id: number
  telegram_id: number
  title: string
  flavor: string
  provider: string
  created_at: string | null
}

export function getMixes(limit?: number, offset?: number): Promise<MixListItem[]> {
  const params = new URLSearchParams()
  if (limit != null) params.set('limit', String(limit))
  if (offset != null) params.set('offset', String(offset))
  return request<MixListItem[]>(`/admin/mixes?${params}`)
}

export interface PurchaseItem {
  id: number
  telegram_id: number
  generations: number
  stars_paid: number
  telegram_charge_id: string | null
  created_at: string | null
}

export function getPurchases(limit?: number, offset?: number, telegramId?: number): Promise<PurchaseItem[]> {
  const params = new URLSearchParams()
  if (limit != null) params.set('limit', String(limit))
  if (offset != null) params.set('offset', String(offset))
  if (telegramId != null) params.set('telegram_id', String(telegramId))
  return request<PurchaseItem[]>(`/admin/purchases?${params}`)
}

export interface BroadcastResult {
  sent: number
  failed: number
  total: number
  idempotency_key: string
}

export function sendBroadcast(payload: {
  text: string
  parse_mode?: string | null
  idempotency_key?: string | null
  force?: boolean
}): Promise<BroadcastResult> {
  return request<BroadcastResult>('/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: payload.text,
      parse_mode: payload.parse_mode ?? null,
      idempotency_key: payload.idempotency_key ?? null,
      force: payload.force ?? false,
    }),
  })
}
