import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ApiClient } from './api/client'
import { ErrorAlert } from './components/ErrorAlert'
import type {
  Algorithm,
  AnalyticsMetric,
  AnalyticsRunDTO,
  RunMatchResponse,
  SearchFilters,
} from './types/api'

const algorithms: Array<{ value: Algorithm; label: string }> = [
  { value: 'collaborative_filtering', label: 'Collaborative Filtering' },
  { value: 'gale_shapley', label: 'Gale-Shapley' },
  { value: 'ant_colony', label: 'Ant Colony' },
]

const genderOptions = [
  { value: 'female', label: 'Женщина' },
  { value: 'male', label: 'Мужчина' },
]

const cityOptions = [
  { value: 'Chisinau', label: 'Chisinau' },
  { value: 'Balti', label: 'Balti' },
  { value: 'Cahul', label: 'Cahul' },
  { value: 'Orhei', label: 'Orhei' },
  { value: 'Ungheni', label: 'Ungheni' },
  { value: 'Tiraspol', label: 'Tiraspol' },
]

const relationshipGoals = [
  { value: 'serious', label: 'Серьезные' },
  { value: 'friendship', label: 'Дружба' },
  { value: 'communication', label: 'Общение' },
]

const lifestyleOptions = [
  { value: 'active', label: 'Активный' },
  { value: 'family', label: 'Семейный' },
  { value: 'passive', label: 'Пассивный' },
]

const badHabitsOptions = [
  { value: 'alcohol', label: 'Алкоголь' },
  { value: 'smoking', label: 'Курение' },
  { value: 'drugs', label: 'Наркотики' },
  { value: 'gambling', label: 'Игромания' },
  { value: 'overeating', label: 'Переедание' },
]

const interestOptions = [
  'music',
  'travel',
  'sport',
  'movies',
  'books',
  'games',
  'cooking',
  'art',
  'technology',
  'nature',
  'fitness',
  'photography',
  'dancing',
  'animals',
  'hiking',
]

function metricLabel(metric: AnalyticsMetric): string {
  switch (metric) {
    case 'execution_time_ms':
      return 'Время, ms'
    case 'matching_time_ms':
      return 'Матчинг, ms'
    case 'scoring_time_ms':
      return 'Скоринг, ms'
    case 'pairs_found':
      return 'Пары'
    case 'avg_score':
      return 'Avg score'
    case 'best_score':
      return 'Best score'
    case 'sum_score':
      return 'Sum score'
    case 'coverage_ratio':
      return 'Coverage'
    case 'eligible_edges':
      return 'Edges'
    case 'score_calls':
      return 'Score calls'
    default:
      return metric
  }
}

type View = 'match' | 'analytics' | 'settings'

function App() {
  const [view, setView] = useState<View>('match')
  const [apiBase, setApiBase] = useState('http://localhost:8080')
  const [algorithm, setAlgorithm] = useState<Algorithm>('gale_shapley')
  const [limit, setLimit] = useState(100)

  const [filters, setFilters] = useState<SearchFilters>({
    gender: 'female',
    age_from: 20,
    age_to: 40,
    city: 'Chisinau',
    relationship_goal: 'serious',
    lifestyle: 'active',
    has_bad_habits: false,
    bad_habits: [],
    interests: ['music', 'travel'],
  })

  const [matchResult, setMatchResult] = useState<RunMatchResponse | null>(null)
  const [analyticsRuns, setAnalyticsRuns] = useState<AnalyticsRunDTO[]>([])
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [analyticsMetric, setAnalyticsMetric] = useState<AnalyticsMetric>('execution_time_ms')
  const [error, setError] = useState('')
  const [loadingMatch, setLoadingMatch] = useState(false)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  const client = useMemo(() => new ApiClient(apiBase), [apiBase])

  async function loadAnalytics(alg?: string) {
    setLoadingAnalytics(true)
    setError('')
    try {
      const data = await client.getAnalytics(alg || undefined)
      setAnalyticsRuns(data.runs)
      setSelectedIds((prev) => prev.filter((id) => data.runs.some((r) => r.id === id)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику')
    } finally {
      setLoadingAnalytics(false)
    }
  }

  useEffect(() => {
    if (view === 'analytics') {
      void loadAnalytics()
    }
  }, [view])

  async function handleRunMatch() {
    setLoadingMatch(true)
    setError('')
    try {
      const payload: SearchFilters = {
        ...filters,
        bad_habits: filters.has_bad_habits ? filters.bad_habits : [],
      }
      const data = await client.runMatch({
        algorithm,
        limit,
        filters: payload,
        personal: true,
      })
      setMatchResult(data)
      await loadAnalytics()
      setView('analytics')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить подбор пар')
    } finally {
      setLoadingMatch(false)
    }
  }

  const selectedRuns = useMemo(() => {
    return analyticsRuns.filter((r) => selectedIds.includes(r.id))
  }, [analyticsRuns, selectedIds])

  const chartData = useMemo(() => {
    const source = selectedRuns.length ? selectedRuns : analyticsRuns.slice(0, 10)
    return source
      .slice()
      .reverse()
      .map((item, index) => ({
        index: index + 1,
        label: `${item.algorithm_name} #${item.id}`,
        algorithm_name: item.algorithm_name,
        created_at: new Date(item.created_at).toLocaleString('ru-RU'),
        execution_time_ms: item.execution_time_ms,
        matching_time_ms: item.matching_time_ms,
        scoring_time_ms: item.scoring_time_ms,
        pairs_found: item.pairs_found,
        avg_score: Number(item.avg_score.toFixed(4)),
        best_score: Number(item.best_score.toFixed(4)),
        sum_score: Number(item.sum_score.toFixed(4)),
        coverage_ratio: Number(item.coverage_ratio.toFixed(4)),
        eligible_edges: item.eligible_edges,
        score_calls: item.score_calls,
      }))
  }, [analyticsRuns, selectedRuns])

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Couple Finder</h1>
              <p className="mt-2 text-sm text-slate-600">
                Подбор пар по алгоритмам и аналитика последних запусков.
              </p>
            </div>

            <nav className="flex flex-wrap gap-3">
              <button
                  onClick={() => setView('match')}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      view === 'match'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Подбор
              </button>
              <button
                  onClick={() => setView('analytics')}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      view === 'analytics'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Аналитика
              </button>
              <button
                  onClick={() => setView('settings')}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      view === 'settings'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Настройки
              </button>
            </nav>
          </header>

          {error ? (
              <div className="mb-6">
                <ErrorAlert message={error} />
              </div>
          ) : null}

          {view === 'settings' ? (
              <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h2 className="text-xl font-semibold">Настройки</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Base URL</label>
                    <input
                        value={apiBase}
                        onChange={(e) => setApiBase(e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                    />
                  </div>
                </div>
              </section>
          ) : view === 'analytics' ? (
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-semibold">Последние запуски</h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Выбери до двух запусков для сравнения.
                        </p>
                      </div>
                      <button
                          onClick={() => loadAnalytics()}
                          disabled={loadingAnalytics}
                          className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                      >
                        {loadingAnalytics ? 'Обновление...' : 'Обновить'}
                      </button>
                    </div>

                    <div className="mt-4 space-y-3">
                      {analyticsRuns.map((item) => {
                        const selected = selectedIds.includes(item.id)
                        return (
                            <label
                                key={item.id}
                                className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 transition ${
                                    selected
                                        ? 'border-slate-900 bg-slate-900 text-white'
                                        : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                                }`}
                            >
                              <div>
                                <p className="text-sm font-semibold">
                                  {item.algorithm_name} • #{item.id}
                                </p>
                                <p className={`text-xs ${selected ? 'text-slate-200' : 'text-slate-500'}`}>
                                  {new Date(item.created_at).toLocaleString('ru-RU')}
                                </p>
                              </div>
                              <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                      setSelectedIds((prev) =>
                                          selected ? prev.filter((id) => id !== item.id) : [...prev, item.id].slice(-2)
                                      )
                                  }
                                  className="h-4 w-4"
                              />
                            </label>
                        )
                      })}
                    </div>
                  </div>
                </aside>

                <section className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">График сравнения</h2>
                        <p className="mt-1 text-sm text-slate-500">Выбранная метрика: {metricLabel(analyticsMetric)}</p>
                      </div>
                      <select
                          value={analyticsMetric}
                          onChange={(e) => setAnalyticsMetric(e.target.value as AnalyticsMetric)}
                          className="rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {[
                          'execution_time_ms',
                          'matching_time_ms',
                          'scoring_time_ms',
                          'pairs_found',
                          'avg_score',
                          'best_score',
                          'sum_score',
                          'coverage_ratio',
                          'eligible_edges',
                          'score_calls',
                        ].map((m) => (
                            <option key={m} value={m}>
                              {metricLabel(m as AnalyticsMetric)}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-4 h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey={analyticsMetric} stroke="#0f172a" strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Таблица запусков</h3>
                    <div className="mt-4 overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="px-4 py-3">Дата</th>
                          <th className="px-4 py-3">Алгоритм</th>
                          <th className="px-4 py-3">Пары</th>
                          <th className="px-4 py-3">Время</th>
                          <th className="px-4 py-3">Avg</th>
                          <th className="px-4 py-3">Best</th>
                          <th className="px-4 py-3">Sum</th>
                          <th className="px-4 py-3">Coverage</th>
                          <th className="px-4 py-3">Score calls</th>
                        </tr>
                        </thead>
                        <tbody>
                        {chartData.map((item) => (
                            <tr key={`${item.label}-${item.created_at}`} className="border-b border-slate-100">
                              <td className="px-4 py-3">{item.created_at}</td>
                              <td className="px-4 py-3">{item.algorithm_name}</td>
                              <td className="px-4 py-3">{item.pairs_found}</td>
                              <td className="px-4 py-3">{item.execution_time_ms} ms</td>
                              <td className="px-4 py-3">{item.avg_score}</td>
                              <td className="px-4 py-3">{item.best_score}</td>
                              <td className="px-4 py-3">{item.sum_score}</td>
                              <td className="px-4 py-3">{item.coverage_ratio}</td>
                              <td className="px-4 py-3">{item.score_calls}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
          ) : (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-xl font-semibold">Подбор пар</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Выбери алгоритм и фильтры. Результат сохранится в аналитике.
                  </p>

                  <div className="mt-6 rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                      <div className="max-w-md">
                        <h3 className="text-lg font-semibold text-slate-900">Алгоритм и лимит</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Алгоритм используется и для подбора, и для сравнения.
                        </p>
                      </div>
                      <div className="w-full md:max-w-sm space-y-3">
                        <select
                            value={algorithm}
                            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3"
                        >
                          {algorithms.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                          ))}
                        </select>
                        <input
                            type="number"
                            min={1}
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                            placeholder="Лимит результатов"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Пол</label>
                      <select
                          value={filters.gender}
                          onChange={(e) => setFilters((p) => ({ ...p, gender: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {genderOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Город</label>
                      <select
                          value={filters.city}
                          onChange={(e) => setFilters((p) => ({ ...p, city: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {cityOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Возраст от</label>
                      <input
                          type="number"
                          value={filters.age_from}
                          onChange={(e) => setFilters((p) => ({ ...p, age_from: Number(e.target.value) }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Возраст до</label>
                      <input
                          type="number"
                          value={filters.age_to}
                          onChange={(e) => setFilters((p) => ({ ...p, age_to: Number(e.target.value) }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Цель отношений</label>
                      <select
                          value={filters.relationship_goal}
                          onChange={(e) => setFilters((p) => ({ ...p, relationship_goal: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {relationshipGoals.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Образ жизни</label>
                      <select
                          value={filters.lifestyle}
                          onChange={(e) => setFilters((p) => ({ ...p, lifestyle: e.target.value }))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {lifestyleOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Вредные привычки</label>
                      <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => setFilters((p) => ({ ...p, has_bad_habits: false, bad_habits: [] }))}
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                !filters.has_bad_habits ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Не учитывать
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilters((p) => ({ ...p, has_bad_habits: true }))}
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                filters.has_bad_habits ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Учитывать
                        </button>
                      </div>
                    </div>
                    {filters.has_bad_habits ? (
                        <div className="flex flex-wrap gap-2">
                          {badHabitsOptions.map((option) => {
                            const active = filters.bad_habits.includes(option.value)
                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() =>
                                        setFilters((p) => ({
                                          ...p,
                                          bad_habits: active
                                              ? p.bad_habits.filter((v) => v !== option.value)
                                              : [...p.bad_habits, option.value],
                                        }))
                                    }
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                        active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }`}
                                >
                                  {option.label}
                                </button>
                            )
                          })}
                        </div>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium">Интересы</label>
                    <div className="flex flex-wrap gap-2">
                      {interestOptions.map((interest) => {
                        const active = filters.interests.includes(interest)
                        return (
                            <button
                                key={interest}
                                type="button"
                                onClick={() =>
                                    setFilters((p) => ({
                                      ...p,
                                      interests: active ? p.interests.filter((i) => i !== interest) : [...p.interests, interest],
                                    }))
                                }
                                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                                    active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              {interest}
                            </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                        onClick={handleRunMatch}
                        disabled={loadingMatch}
                        className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {loadingMatch ? 'Запуск...' : 'Найти пары'}
                    </button>
                  </div>

                  {matchResult ? (
                      <div className="mt-8 space-y-4">
                        <div className="grid gap-3 sm:grid-cols-4">
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Алгоритм</p>
                            <p className="text-lg font-semibold">{matchResult.algorithm_name}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Пары</p>
                            <p className="text-lg font-semibold">{matchResult.pairs_found}</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Время</p>
                            <p className="text-lg font-semibold">{matchResult.execution_time_ms} ms</p>
                          </div>
                          <div className="rounded-2xl bg-slate-50 px-4 py-3">
                            <p className="text-xs uppercase tracking-wide text-slate-500">Avg score</p>
                            <p className="text-lg font-semibold">{matchResult.avg_score.toFixed(4)}</p>
                          </div>
                        </div>

                          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                          <h3 className="text-lg font-semibold">Найденные пары</h3>
                          {matchResult.pairs.length === 0 ? (
                              <p className="mt-4 text-sm text-slate-500">Пары не найдены.</p>
                          ) : (
                              <div className="mt-4 grid gap-3">
                                {matchResult.pairs.map((p, idx) => (
                                    <div key={`${p.user_a_id}-${p.user_b_id}`} className="rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="text-sm text-slate-700">
                                          <span className="font-semibold">#{idx + 1}</span>{' '}
                                          A:{p.user_a_id === matchResult.seeker_id ? 'Вы' : p.user_a_id}{' '}
                                          • B:{p.user_b_id === matchResult.seeker_id ? 'Вы' : p.user_b_id}
                                        </div>
                                        <div className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                                          Score: {p.score.toFixed(4)}
                                        </div>
                                      </div>
                                    </div>
                                ))}
                              </div>
                          )}
                        </div>
                      </div>
                  ) : null}
                </section>
              </div>
          )}
        </div>
      </div>
  )
}

export default App
