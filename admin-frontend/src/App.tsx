import { useState, useEffect, useCallback } from 'react'
import * as api from './api'
import styles from './App.module.css'

type Page = 'login' | 'dashboard' | 'settings' | 'feedback' | 'users' | 'mixes' | 'activity'

export default function App() {
  const [page, setPage] = useState<Page>('login')
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('admin_token'))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token)
    } else {
      localStorage.removeItem('admin_token')
    }
  }, [token])

  const handleLogout = useCallback(() => {
    setToken(null)
    setPage('login')
  }, [])

  if (!token) {
    return (
      <LoginPage
        onLogin={(t) => {
          setToken(t)
          setPage('dashboard')
          setError(null)
        }}
        error={error}
        setError={setError}
      />
    )
  }

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <h1>HMA Admin</h1>
        <nav className={styles.nav}>
          <button
            className={page === 'dashboard' ? styles.navActive : ''}
            onClick={() => setPage('dashboard')}
          >
            Статистика
          </button>
          <button
            className={page === 'users' ? styles.navActive : ''}
            onClick={() => setPage('users')}
          >
            Пользователи
          </button>
          <button
            className={page === 'feedback' ? styles.navActive : ''}
            onClick={() => setPage('feedback')}
          >
            Feedback
          </button>
          <button
            className={page === 'mixes' ? styles.navActive : ''}
            onClick={() => setPage('mixes')}
          >
            Миксы
          </button>
          <button
            className={page === 'activity' ? styles.navActive : ''}
            onClick={() => setPage('activity')}
          >
            Активность
          </button>
          <button
            className={page === 'settings' ? styles.navActive : ''}
            onClick={() => setPage('settings')}
          >
            Настройки
          </button>
        </nav>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          Выход
        </button>
      </header>
      <main className={styles.main}>
        {page === 'dashboard' && <DashboardPage />}
        {page === 'settings' && <SettingsPage />}
        {page === 'feedback' && <FeedbackPage />}
        {page === 'users' && <UsersPage />}
        {page === 'mixes' && <MixesPage />}
        {page === 'activity' && <ActivityPage />}
      </main>
    </div>
  )
}

function LoginPage({
  onLogin,
  error,
  setError,
}: {
  onLogin: (token: string) => void
  error: string | null
  setError: (s: string | null) => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const token = await api.login(username, password)
      onLogin(token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.loginWrap}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2>Вход в админку</h2>
        {error && <div className={styles.error}>{error}</div>}
        <label>
          Логин
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label>
          Пароль
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>
    </div>
  )
}

function DashboardPage() {
  const [stats, setStats] = useState<api.Stats | null>(null)
  const [providers, setProviders] = useState<api.ProviderStat[]>([])
  const [activity, setActivity] = useState<api.ActivityPoint[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
    api.getProvidersStats().then(setProviders).catch(() => {})
    api.getActivity(14).then(setActivity).catch(() => {})
  }, [])

  if (err) return <div className={styles.error}>{err}</div>
  if (!stats) return <div className={styles.loading}>Загрузка...</div>

  const maxActivity = Math.max(1, ...activity.map((a) => a.requests))

  return (
    <div className={styles.dashboard}>
      <h2>Статистика</h2>
      <div className={styles.cards}>
        <div className={styles.card}>
          <span className={styles.cardValue}>{stats.users_count}</span>
          <span className={styles.cardLabel}>Пользователей</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{stats.total_requests}</span>
          <span className={styles.cardLabel}>Запросов (сессий)</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{stats.total_attempts}</span>
          <span className={styles.cardLabel}>Попыток (по лимиту)</span>
        </div>
        <div className={styles.card}>
          <span className={styles.cardValue}>{stats.feedback_count}</span>
          <span className={styles.cardLabel}>Feedback</span>
        </div>
      </div>
      {providers.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>Провайдеры</h3>
          <div className={styles.providersList}>
            {providers.map((p) => (
              <span key={p.provider} className={styles.providerBadge}>
                {p.provider}: {p.count}
              </span>
            ))}
          </div>
        </>
      )}
      {activity.length > 0 && (
        <>
          <h3 className={styles.sectionTitle}>Запросы за 14 дней</h3>
          <div className={styles.chart}>
            {activity.map((a) => (
              <div key={a.date} className={styles.chartBarWrap}>
                <div
                  className={styles.chartBar}
                  style={{ height: `${(a.requests / maxActivity) * 100}%` }}
                />
                <span className={styles.chartLabel}>{a.date.slice(5)}</span>
                <span className={styles.chartValue}>{a.requests}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function SettingsPage() {
  const [settings, setSettings] = useState<api.Settings | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [limit, setLimit] = useState(5)
  const [disableLimit, setDisableLimit] = useState(true)
  const [provider, setProvider] = useState('mock')

  const load = useCallback(() => {
    api
      .getSettings()
      .then((s) => {
        setSettings(s)
        setLimit(s.daily_request_limit)
        setDisableLimit(s.disable_daily_limit)
        setProvider(s.llm_provider)
      })
      .catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setErr(null)
    setSaving(true)
    try {
      await api.updateSettings({
        daily_request_limit: limit,
        disable_daily_limit: disableLimit,
        llm_provider: provider,
      })
      load()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (err && !settings) return <div className={styles.error}>{err}</div>
  if (!settings) return <div className={styles.loading}>Загрузка...</div>

  return (
    <div className={styles.settings}>
      <h2>Настройки</h2>
      <div className={styles.form}>
        <label>
          <input
            type="checkbox"
            checked={disableLimit}
            onChange={(e) => setDisableLimit(e.target.checked)}
          />{' '}
          Выключить дневной лимит
        </label>
        <label>
          Дневной лимит запросов (1–100)
          <input
            type="number"
            min={1}
            max={100}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            disabled={disableLimit}
          />
        </label>
        <label>
          LLM провайдер
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="mock">mock</option>
            <option value="gigachat">gigachat</option>
            <option value="yandexgpt">yandexgpt</option>
            <option value="ab">ab (A/B тест)</option>
          </select>
        </label>
        {err && <div className={styles.error}>{err}</div>}
        <button onClick={handleSave} disabled={saving}>
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>
    </div>
  )
}

function UsersPage() {
  const [items, setItems] = useState<api.UserItem[]>([])
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.getUsers(200, 0).then(setItems).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [])

  const exportCsv = () => {
    const headers = ['id', 'telegram_id', 'provider_group', 'attempts', 'sessions_count', 'feedback_count', 'created_at', 'last_activity']
    const rows = items.map((r) =>
      [r.id, r.telegram_id, r.provider_group || '', r.attempts, r.sessions_count, r.feedback_count, r.created_at || '', r.last_activity || ''].join(';')
    )
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'users.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (err) return <div className={styles.error}>{err}</div>

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>Пользователи</h2>
        <button className={styles.exportBtn} onClick={exportCsv}>
          Экспорт CSV
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Telegram ID</th>
              <th>Провайдер</th>
              <th>Попыток</th>
              <th>Сессий</th>
              <th>Feedback</th>
              <th>Регистрация</th>
              <th>Последняя активность</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.telegram_id}</td>
                <td>{row.provider_group || '—'}</td>
                <td>{row.attempts}</td>
                <td>{row.sessions_count}</td>
                <td>{row.feedback_count}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString('ru') : '—'}</td>
                <td>{row.last_activity ? new Date(row.last_activity).toLocaleString('ru') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p>Нет пользователей</p>}
    </div>
  )
}

function MixModal({ mixId, onClose }: { mixId: number; onClose: () => void }) {
  const [mix, setMix] = useState<api.MixDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    api.getMix(mixId).then(setMix).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [mixId])

  const m = mix?.mix_json
  const tobaccos = (m?.tobaccos as Array<{ name: string; percent?: number }>) || []

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Микс #{mixId}</h3>
          <button className={styles.modalClose} onClick={onClose}>
            ×
          </button>
        </div>
        {err && <div className={styles.error}>{err}</div>}
        {mix && (
          <div className={styles.modalBody}>
            <p>
              <strong>Название:</strong> {m?.title || '—'}
            </p>
            <p>
              <strong>Букет:</strong> {m?.flavor || '—'}
            </p>
            <p>
              <strong>Провайдер:</strong> {mix.provider}
            </p>
            <p>
              <strong>Табаки:</strong>
            </p>
            <ul>
              {tobaccos.map((t, i) => (
                <li key={i}>
                  {t.name}
                  {t.percent != null ? ` — ${t.percent}%` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedbackPage() {
  const [items, setItems] = useState<api.FeedbackItem[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [mixModalId, setMixModalId] = useState<number | null>(null)

  useEffect(() => {
    api.getFeedback(100, 0).then(setItems).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [])

  const exportCsv = () => {
    const headers = ['id', 'mix_id', 'telegram_id', 'rating', 'reason', 'created_at']
    const rows = items.map((r) =>
      [r.id, r.mix_id, r.telegram_id, r.rating ? 'зашло' : 'не зашло', (r.reason || '').replace(/;/g, ','), r.created_at || ''].join(';')
    )
    const csv = [headers.join(';'), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'feedback.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  if (err) return <div className={styles.error}>{err}</div>

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>Feedback</h2>
        <button className={styles.exportBtn} onClick={exportCsv}>
          Экспорт CSV
        </button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Mix</th>
              <th>Telegram</th>
              <th>Оценка</th>
              <th>Причина</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.mix_id}</td>
                <td>{row.telegram_id}</td>
                <td>
                  <span className={row.rating ? styles.tagGood : styles.tagBad}>
                    {row.rating ? 'Зашло' : 'Не зашло'}
                  </span>
                </td>
                <td>{row.reason || '—'}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString('ru') : '—'}</td>
                <td>
                  <button className={styles.mixBtn} onClick={() => setMixModalId(row.mix_id)}>
                    Микс
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p>Нет feedback</p>}
      {mixModalId != null && <MixModal mixId={mixModalId} onClose={() => setMixModalId(null)} />}
    </div>
  )
}

function MixesPage() {
  const [items, setItems] = useState<api.MixListItem[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [mixModalId, setMixModalId] = useState<number | null>(null)

  useEffect(() => {
    api.getMixes(100, 0).then(setItems).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [])

  if (err) return <div className={styles.error}>{err}</div>

  return (
    <div className={styles.page}>
      <h2>Миксы</h2>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Telegram</th>
              <th>Название</th>
              <th>Букет</th>
              <th>Провайдер</th>
              <th>Дата</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id}>
                <td>{row.id}</td>
                <td>{row.telegram_id}</td>
                <td>{row.title || '—'}</td>
                <td>{row.flavor || '—'}</td>
                <td>{row.provider}</td>
                <td>{row.created_at ? new Date(row.created_at).toLocaleString('ru') : '—'}</td>
                <td>
                  <button className={styles.mixBtn} onClick={() => setMixModalId(row.id)}>
                    Подробнее
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p>Нет миксов</p>}
      {mixModalId != null && <MixModal mixId={mixModalId} onClose={() => setMixModalId(null)} />}
    </div>
  )
}

function ActivityPage() {
  const [activity, setActivity] = useState<api.ActivityPoint[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [days, setDays] = useState(14)

  useEffect(() => {
    api.getActivity(days).then(setActivity).catch((e) => setErr(e instanceof Error ? e.message : 'Ошибка'))
  }, [days])

  if (err) return <div className={styles.error}>{err}</div>

  const maxActivity = Math.max(1, ...activity.map((a) => a.requests))

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h2>Активность</h2>
        <select
          className={styles.daysSelect}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
        >
          <option value={7}>7 дней</option>
          <option value={14}>14 дней</option>
          <option value={30}>30 дней</option>
        </select>
      </div>
      {activity.length === 0 && <p>Нет данных</p>}
      {activity.length > 0 && (
        <div className={styles.chart}>
          {activity.map((a) => (
            <div key={a.date} className={styles.chartBarWrap}>
              <div
                className={styles.chartBar}
                style={{ height: `${(a.requests / maxActivity) * 100}%` }}
              />
              <span className={styles.chartLabel}>{a.date}</span>
              <span className={styles.chartValue}>{a.requests}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
