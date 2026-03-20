import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
  CandidateDTO,
  HealthResponse,
  RunSearchResponse,
  SearchFilters,
} from './types/api'

const algorithms: Array<{ value: Algorithm; label: string }> = [
  { value: 'collaborative_filtering', label: 'Collaborative Filtering' },
  { value: 'gale_shapley', label: 'Gale-Shapley' },
  { value: 'ant_colony', label: 'Ant Colony' },
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

const genderOptions = [
  { value: 'female', label: 'Женщина' },
  { value: 'male', label: 'Мужчина' },
]

const badHabitsOptions = [
  { value: 'alcohol', label: 'Алкоголь' },
  { value: 'smoking', label: 'Курение' },
  { value: 'drugs', label: 'Наркотики' },
  { value: 'gambling', label: 'Игромания' },
  { value: 'overeating', label: 'Переедание' },
]

const interestOptions = [
  { value: 'music', label: 'Музыка' },
  { value: 'travel', label: 'Путешествия' },
  { value: 'sport', label: 'Спорт' },
  { value: 'movies', label: 'Фильмы' },
  { value: 'books', label: 'Книги' },
  { value: 'games', label: 'Игры' },
  { value: 'cooking', label: 'Кулинария' },
  { value: 'art', label: 'Искусство' },
  { value: 'technology', label: 'Технологии' },
  { value: 'nature', label: 'Природа' },
  { value: 'fitness', label: 'Фитнес' },
  { value: 'photography', label: 'Фотография' },
  { value: 'dancing', label: 'Танцы' },
  { value: 'animals', label: 'Животные' },
  { value: 'hiking', label: 'Походы' },
]

function toggleValue(list: string[], value: string): string[] {
  if (list.includes(value)) {
    return list.filter((item) => item !== value)
  }
  return [...list, value]
}

type View = 'home' | 'settings' | 'pairs' | 'analytics'

type FieldHintProps = {
  label: string
  description: string
  children: ReactNode
}

type OptionChipGroupProps = {
  options: Array<{ value: string; label: string }>
  values: string[]
  onToggle: (value: string) => void
}

type SearchMetaCardProps = {
  algorithmName?: string
  totalFound?: number
  executionTimeMs?: number
  limit?: number
  bestScore?: number
}

function OptionChipGroup({ options, values, onToggle }: OptionChipGroupProps) {
  return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = values.includes(option.value)

          return (
              <button
                  key={option.value}
                  type="button"
                  onClick={() => onToggle(option.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                {option.label}
              </button>
          )
        })}
      </div>
  )
}

function FieldHint({ label, description, children }: FieldHintProps) {
  return (
      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
        {children}
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
      </div>
  )
}

function SearchMetaCard({
                          algorithmName,
                          totalFound,
                          executionTimeMs,
                          limit,
                          bestScore,
                        }: SearchMetaCardProps) {
  return (
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Результат поиска</h3>
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Алгоритм: <span className="font-medium">{algorithmName ?? '—'}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Найдено кандидатов: <span className="font-medium">{totalFound ?? 0}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Время: <span className="font-medium">{executionTimeMs ?? 0} ms</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Лимит: <span className="font-medium">{limit ?? 0}</span>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            Лучший score: <span className="font-medium">{(bestScore ?? 0).toFixed(4)}</span>
          </div>
        </div>
      </div>
  )
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(date)
}

function getBestScore(result: RunSearchResponse | null): number {
  if (!result || !result.candidates || result.candidates.length === 0) {
    return 0
  }

  return result.candidates.reduce((max, candidate) => {
    return candidate.score > max ? candidate.score : max
  }, result.candidates[0]?.score ?? 0)
}

function metricLabel(metric: AnalyticsMetric): string {
  switch (metric) {
    case 'execution_time_ms':
      return 'Время поиска, ms'
    case 'best_score':
      return 'Лучший score'
    case 'avg_score':
      return 'Средний score'
    case 'sum_score':
      return 'Суммарный score'
    case 'coverage_ratio':
      return 'Покрытие'
    case 'pairs_found':
      return 'Число пар'
    case 'eligible_edges':
      return 'Допустимые рёбра'
    case 'score_calls':
      return 'Вызовы scorer'
    default:
      return metric
  }
}

function App() {
  const [view, setView] = useState<View>('home')
  const [apiBase, setApiBase] = useState('http://localhost:8080')
  const [algorithm, setAlgorithm] = useState<Algorithm>('gale_shapley')
  const [limit, setLimit] = useState(100)

  const [filters, setFilters] = useState<SearchFilters>({
    gender: 'female',
    age_from: 20,
    age_to: 30,
    city: 'Chisinau',
    relationship_goal: 'serious',
    lifestyle: 'active',
    has_bad_habits: false,
    bad_habits: [],
    interests: ['music', 'travel'],
  })

  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [searchResult, setSearchResult] = useState<RunSearchResponse | null>(null)
  const [cursor, setCursor] = useState(0)
  const [liked, setLiked] = useState<CandidateDTO[]>([])
  const [disliked, setDisliked] = useState<CandidateDTO[]>([])
  const [error, setError] = useState('')
  const [healthLoading, setHealthLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)

  const [analyticsRuns, setAnalyticsRuns] = useState<AnalyticsRunDTO[]>([])
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [selectedAnalyticsIds, setSelectedAnalyticsIds] = useState<number[]>([])
  const [analyticsMetric, setAnalyticsMetric] =
      useState<AnalyticsMetric>('execution_time_ms')
  const [analyticsAlgorithmFilter, setAnalyticsAlgorithmFilter] = useState<string>('')

  const client = useMemo(() => new ApiClient(apiBase), [apiBase])

  const currentCandidate = searchResult?.candidates[cursor] ?? null
  const remaining = Math.max((searchResult?.candidates.length ?? 0) - cursor, 0)
  const currentBestScore = getBestScore(searchResult)

  async function loadAnalytics(selectedAlgorithm?: string) {
    setAnalyticsLoading(true)
    setError('')

    try {
      const data = await client.getAnalytics(selectedAlgorithm || undefined)
      setAnalyticsRuns(data.runs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить аналитику')
    } finally {
      setAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    if (view === 'analytics') {
      void loadAnalytics(analyticsAlgorithmFilter)
    }
  }, [view])

  const selectedAnalyticsRuns = useMemo(() => {
    return analyticsRuns.filter((item) => selectedAnalyticsIds.includes(item.id))
  }, [analyticsRuns, selectedAnalyticsIds])

  const chartData = useMemo(() => {
    const source =
        selectedAnalyticsRuns.length > 0 ? selectedAnalyticsRuns : analyticsRuns.slice(0, 10)

    return source.slice().reverse().map((item, index) => ({
      index: index + 1,
      label: `${item.algorithm_name} #${item.id}`,
      algorithm_name: item.algorithm_name,
      created_at: formatDateTime(item.created_at),

      execution_time_ms: item.execution_time_ms,
      best_score: Number(item.best_score.toFixed(4)),
      avg_score: Number(item.avg_score.toFixed(4)),
      sum_score: Number(item.sum_score.toFixed(4)),
      coverage_ratio: Number(item.coverage_ratio.toFixed(4)),
      pairs_found: item.pairs_found,
      eligible_edges: item.eligible_edges,
      score_calls: item.score_calls,
    }))
  }, [selectedAnalyticsRuns, analyticsRuns])

  function toggleAnalyticsSelection(id: number) {
    setSelectedAnalyticsIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      }
      return [...prev, id]
    })
  }

  async function handleHealthCheck() {
    setError('')
    setHealthLoading(true)

    try {
      const data = await client.healthCheck()
      setHealth(data)
    } catch (e) {
      setHealth(null)
      setError(e instanceof Error ? e.message : 'Не удалось проверить backend')
    } finally {
      setHealthLoading(false)
    }
  }

  async function handleSearch() {
    setError('')
    setSearchLoading(true)

    try {
      const payload: SearchFilters = {
        ...filters,
        bad_habits: filters.has_bad_habits ? filters.bad_habits : [],
      }

      const data = await client.runSearch({
        algorithm,
        limit,
        filters: payload,
      })

      setSearchResult(data)
      setCursor(0)
      setLiked([])
      setDisliked([])
      setView('pairs')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить поиск')
    } finally {
      setSearchLoading(false)
    }
  }

  async function handleRefreshAnalytics() {
    await loadAnalytics(analyticsAlgorithmFilter)
  }

  function handleLike() {
    if (!currentCandidate) return
    setLiked((prev) => [...prev, currentCandidate])
    setCursor((prev) => prev + 1)
  }

  function handleDislike() {
    if (!currentCandidate) return
    setDisliked((prev) => [...prev, currentCandidate])
    setCursor((prev) => prev + 1)
  }

  return (
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Couple Finder</h1>
              <p className="mt-2 text-sm text-slate-600">
                Поиск кандидатов, просмотр результатов и аналитика по прогонам алгоритмов.
              </p>
            </div>

            <nav className="flex flex-wrap gap-3">
              <button
                  onClick={() => setView('home')}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      view === 'home'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Главная
              </button>
              <button
                  onClick={() => setView('pairs')}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                      view === 'pairs'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
              >
                Пары
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
              <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-xl font-semibold">Настройки</h2>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Base URL</label>
                      <input
                          value={apiBase}
                          onChange={(e) => setApiBase(e.target.value)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Алгоритм</label>
                      <select
                          value={algorithm}
                          onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {algorithms.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Лимит результатов по умолчанию
                      </label>
                      <input
                          type="number"
                          min={1}
                          value={limit}
                          onChange={(e) => setLimit(Number(e.target.value))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </div>

                    <button
                        onClick={handleHealthCheck}
                        disabled={healthLoading}
                        className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      {healthLoading ? 'Проверка...' : 'Проверить backend'}
                    </button>

                    {health ? (
                        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          Статус сервера: <span className="font-semibold">{health.status}</span>
                        </div>
                    ) : null}
                  </div>
                </section>
              </div>
          ) : view === 'analytics' ? (
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-semibold">История прогонов</h2>
                        </div>

                        <button
                            onClick={handleRefreshAnalytics}
                            disabled={analyticsLoading}
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {analyticsLoading ? 'Обновление...' : 'Обновить'}
                        </button>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">
                          Фильтр по алгоритму
                        </label>
                        <select
                            value={analyticsAlgorithmFilter}
                            onChange={(e) => setAnalyticsAlgorithmFilter(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                        >
                          <option value="">Все алгоритмы</option>
                          {algorithms.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                          ))}
                        </select>
                        <button
                            onClick={handleRefreshAnalytics}
                            disabled={analyticsLoading}
                            className="mt-3 w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
                        >
                          Применить фильтр
                        </button>
                      </div>
                    </div>

                    {!analyticsRuns.length && !analyticsLoading ? (
                        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                          Аналитика пока пустая.
                        </div>
                    ) : (
                        <div className="mt-6 space-y-3">
                          {analyticsRuns.map((item) => {
                            const selected = selectedAnalyticsIds.includes(item.id)

                            return (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => toggleAnalyticsSelection(item.id)}
                                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                                        selected
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'
                                    }`}
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold">{item.algorithm_name}</p>
                                      <p
                                          className={`mt-1 text-xs ${
                                              selected ? 'text-slate-200' : 'text-slate-500'
                                          }`}
                                      >
                                        {formatDateTime(item.created_at)}
                                      </p>
                                    </div>

                                    <span
                                        className={`rounded-full px-3 py-1 text-xs ${
                                            selected
                                                ? 'bg-white text-slate-900'
                                                : 'bg-white text-slate-700 ring-1 ring-slate-200'
                                        }`}
                                    >
                              {selected ? 'Выбрано' : 'Нажми для выбора'}
                            </span>
                                  </div>

                                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                    <div
                                        className={`rounded-xl px-3 py-2 text-sm ${
                                            selected ? 'bg-slate-800' : 'bg-white'
                                        }`}
                                    >
                                      Пар: <span className="font-medium">{item.pairs_found}</span>
                                    </div>
                                    <div
                                        className={`rounded-xl px-3 py-2 text-sm ${
                                            selected ? 'bg-slate-800' : 'bg-white'
                                        }`}
                                    >
                                      Время: <span className="font-medium">{item.execution_time_ms} ms</span>
                                    </div>
                                    <div
                                        className={`rounded-xl px-3 py-2 text-sm ${
                                            selected ? 'bg-slate-800' : 'bg-white'
                                        }`}
                                    >
                                      Best: <span className="font-medium">{item.best_score.toFixed(4)}</span>
                                    </div>
                                    <div
                                        className={`rounded-xl px-3 py-2 text-sm ${
                                            selected ? 'bg-slate-800' : 'bg-white'
                                        }`}
                                    >
                                      Avg: <span className="font-medium">{item.avg_score.toFixed(4)}</span>
                                    </div>
                                  </div>
                                </button>
                            )
                          })}
                        </div>
                    )}
                  </div>
                </aside>

                <section className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold">График сравнения</h2>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {(
                            [
                              'execution_time_ms',
                              'best_score',
                              'avg_score',
                              'sum_score',
                              'coverage_ratio',
                              'pairs_found',
                              'eligible_edges',
                              'score_calls',
                            ] as AnalyticsMetric[]
                        ).map((metric) => (
                            <button
                                key={metric}
                                type="button"
                                onClick={() => setAnalyticsMetric(metric)}
                                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                                    analyticsMetric === metric
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                              {metricLabel(metric)}
                            </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 h-[360px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis />
                          <Tooltip />
                          <Line
                              type="monotone"
                              dataKey={analyticsMetric}
                              stroke="#0f172a"
                              strokeWidth={3}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Сводная таблица</h3>

                    {!chartData.length ? (
                        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                          Недостаточно данных для аналитики.
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="px-4 py-3">Дата</th>
                              <th className="px-4 py-3">Алгоритм</th>
                              <th className="px-4 py-3">Пар</th>
                              <th className="px-4 py-3">Время</th>
                              <th className="px-4 py-3">Best</th>
                              <th className="px-4 py-3">Avg</th>
                              <th className="px-4 py-3">Sum</th>
                              <th className="px-4 py-3">Coverage</th>
                              <th className="px-4 py-3">Edges</th>
                              <th className="px-4 py-3">Score calls</th>
                            </tr>
                            </thead>
                            <tbody>
                            {chartData.map((item) => (
                                <tr
                                    key={`${item.label}-${item.created_at}`}
                                    className="border-b border-slate-100"
                                >
                                  <td className="px-4 py-3">{item.created_at}</td>
                                  <td className="px-4 py-3">{item.algorithm_name}</td>
                                  <td className="px-4 py-3">{item.pairs_found}</td>
                                  <td className="px-4 py-3">{item.execution_time_ms} ms</td>
                                  <td className="px-4 py-3">{item.best_score}</td>
                                  <td className="px-4 py-3">{item.avg_score}</td>
                                  <td className="px-4 py-3">{item.sum_score}</td>
                                  <td className="px-4 py-3">{item.coverage_ratio}</td>
                                  <td className="px-4 py-3">{item.eligible_edges}</td>
                                  <td className="px-4 py-3">{item.score_calls}</td>
                                </tr>
                            ))}
                            </tbody>
                          </table>
                        </div>
                    )}
                  </div>
                </section>
              </div>
          ) : view === 'pairs' ? (
              <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <aside className="space-y-6">
                  <SearchMetaCard
                      algorithmName={searchResult?.algorithm_name ?? algorithm}
                      totalFound={searchResult?.total_found ?? 0}
                      executionTimeMs={searchResult?.execution_time_ms ?? 0}
                      limit={limit}
                      bestScore={currentBestScore}
                  />

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Реакции</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Liked</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">{liked.length}</p>
                      </div>
                      <div className="rounded-2xl bg-rose-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-rose-700">Disliked</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-700">{disliked.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Аналитика</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Прогонов в БД: <span className="font-medium">{analyticsRuns.length}</span>
                      </div>
                      <button
                          onClick={async () => {
                            await loadAnalytics('')
                            setView('analytics')
                          }}
                          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
                      >
                        Открыть аналитику
                      </button>
                    </div>
                  </div>
                </aside>

                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Найденные пары</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Здесь отображаются найденные результаты поиска с их score.
                      </p>
                    </div>

                    <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                      Всего:{' '}
                      <span className="font-semibold">{searchResult?.candidates.length ?? 0}</span>
                    </div>
                  </div>

                  {!searchResult ? (
                      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                        Сначала выполни поиск на главной странице.
                      </div>
                  ) : searchResult.candidates.length === 0 ? (
                      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
                        Пары не найдены.
                      </div>
                  ) : (
                      <div className="mt-6 grid gap-4">
                        {searchResult.candidates.map((candidate, index) => {
                          const isLiked = liked.some((item) => item.user_id === candidate.user_id)
                          const isDisliked = disliked.some((item) => item.user_id === candidate.user_id)

                          return (
                              <div
                                  key={candidate.user_id}
                                  className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                                #{index + 1}
                              </span>
                                      <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                                ID: {candidate.user_id}
                              </span>
                                      <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                                {candidate.age} лет
                              </span>
                                      <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                                {candidate.city}
                              </span>
                                    </div>

                                    <h3 className="mt-4 text-2xl font-semibold">{candidate.name}</h3>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                      {candidate.interests.map((interest) => (
                                          <span
                                              key={interest}
                                              className="rounded-full bg-white px-3 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                                          >
                                  {interest}
                                </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid min-w-[220px] gap-3">
                                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                                      <p className="text-xs uppercase tracking-wide text-slate-400">Score</p>
                                      <p className="mt-2 text-lg font-semibold">
                                        {candidate.score.toFixed(4)}
                                      </p>
                                    </div>

                                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                                      <p className="text-xs uppercase tracking-wide text-slate-400">
                                        Алгоритм
                                      </p>
                                      <p className="mt-2 text-sm font-medium">
                                        {searchResult.algorithm_name}
                                      </p>
                                    </div>

                                    <div className="rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                                      <p className="text-xs uppercase tracking-wide text-slate-400">
                                        Время поиска
                                      </p>
                                      <p className="mt-2 text-sm font-medium">
                                        {searchResult.execution_time_ms} ms
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-5 flex flex-wrap gap-3">
                                  <button
                                      onClick={() => {
                                        setLiked((prev) =>
                                            prev.some((item) => item.user_id === candidate.user_id)
                                                ? prev
                                                : [...prev, candidate]
                                        )
                                        setDisliked((prev) =>
                                            prev.filter((item) => item.user_id !== candidate.user_id)
                                        )
                                      }}
                                      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                          isLiked
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                  >
                                    {isLiked ? 'Liked' : 'Like'}
                                  </button>

                                  <button
                                      onClick={() => {
                                        setDisliked((prev) =>
                                            prev.some((item) => item.user_id === candidate.user_id)
                                                ? prev
                                                : [...prev, candidate]
                                        )
                                        setLiked((prev) =>
                                            prev.filter((item) => item.user_id !== candidate.user_id)
                                        )
                                      }}
                                      className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                          isDisliked
                                              ? 'bg-rose-600 text-white'
                                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      }`}
                                  >
                                    {isDisliked ? 'Disliked' : 'Dislike'}
                                  </button>
                                </div>
                              </div>
                          )
                        })}
                      </div>
                  )}
                </section>
              </div>
          ) : (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-xl font-semibold">Параметры поиска</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Заполни параметры, по которым backend будет искать подходящих кандидатов в базе пользователей.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <FieldHint label="Пол кандидата" description="Выбери, кого нужно искать.">
                      <select
                          value={filters.gender}
                          onChange={(e) =>
                              setFilters((prev) => ({ ...prev, gender: e.target.value }))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {genderOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </FieldHint>

                    <FieldHint label="Город" description="Город, в котором нужно искать кандидатов.">
                      <input
                          value={filters.city}
                          onChange={(e) =>
                              setFilters((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="Chisinau"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </FieldHint>

                    <FieldHint label="Возраст от" description="Минимальный возраст кандидата.">
                      <input
                          type="number"
                          value={filters.age_from}
                          onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                age_from: Number(e.target.value),
                              }))
                          }
                          placeholder="20"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </FieldHint>

                    <FieldHint label="Возраст до" description="Максимальный возраст кандидата.">
                      <input
                          type="number"
                          value={filters.age_to}
                          onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                age_to: Number(e.target.value),
                              }))
                          }
                          placeholder="30"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </FieldHint>

                    <FieldHint
                        label="Цель отношений"
                        description="Выбери, какого формата отношения интересуют."
                    >
                      <select
                          value={filters.relationship_goal}
                          onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                relationship_goal: e.target.value,
                              }))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {relationshipGoals.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </FieldHint>

                    <FieldHint
                        label="Образ жизни"
                        description="Выбери желаемый образ жизни кандидата."
                    >
                      <select
                          value={filters.lifestyle}
                          onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                lifestyle: e.target.value,
                              }))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      >
                        {lifestyleOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                        ))}
                      </select>
                    </FieldHint>

                    <FieldHint
                        label="Лимит результатов"
                        description="Сколько пар/кандидатов backend должен вернуть за один поиск."
                    >
                      <input
                          type="number"
                          min={1}
                          value={limit}
                          onChange={(e) => setLimit(Number(e.target.value))}
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </FieldHint>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Есть ли допустимые вредные привычки
                      </label>
                      <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  has_bad_habits: false,
                                  bad_habits: [],
                                }))
                            }
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                !filters.has_bad_habits
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Нет
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setFilters((prev) => ({
                                  ...prev,
                                  has_bad_habits: true,
                                }))
                            }
                            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                                filters.has_bad_habits
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                          Да
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Если допустимы вредные привычки, выбери конкретные варианты ниже.
                      </p>
                    </div>

                    {filters.has_bad_habits ? (
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Список вредных привычек
                          </label>
                          <OptionChipGroup
                              options={badHabitsOptions}
                              values={filters.bad_habits}
                              onToggle={(value) =>
                                  setFilters((prev) => ({
                                    ...prev,
                                    bad_habits: toggleValue(prev.bad_habits, value),
                                  }))
                              }
                          />
                          <p className="mt-2 text-xs text-slate-500">
                            Можно выбрать несколько вариантов.
                          </p>
                        </div>
                    ) : null}
                  </div>

                  <div className="mt-6">
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Интересы
                    </label>
                    <OptionChipGroup
                        options={interestOptions}
                        values={filters.interests}
                        onToggle={(value) =>
                            setFilters((prev) => ({
                              ...prev,
                              interests: toggleValue(prev.interests, value),
                            }))
                        }
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Выбери интересы, которые важны при подборе кандидата. Можно отметить несколько.
                    </p>
                  </div>

                  <button
                      onClick={handleSearch}
                      disabled={searchLoading}
                      className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-60"
                  >
                    {searchLoading ? 'Поиск...' : 'Найти кандидатов'}
                  </button>

                  {currentCandidate ? (
                      <div className="mt-8 space-y-6">
                        <div className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
                          <div className="flex items-center justify-between gap-4">
                      <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                        Осталось карточек: {remaining}
                      </span>
                            <span className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-slate-200">
                        Score: {currentCandidate.score.toFixed(4)}
                      </span>
                          </div>

                          <div className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Candidate</p>
                            <p className="mt-3 text-3xl font-semibold">{currentCandidate.name}</p>
                            <p className="mt-2 text-slate-600">
                              #{currentCandidate.user_id}, {currentCandidate.age} лет, {currentCandidate.city}
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                              {currentCandidate.interests.map((interest) => (
                                  <span
                                      key={interest}
                                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                                  >
                            {interest}
                          </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <button
                              onClick={handleDislike}
                              className="rounded-2xl bg-rose-600 px-4 py-4 text-white transition hover:bg-rose-500"
                          >
                            Dislike
                          </button>
                          <button
                              onClick={handleLike}
                              className="rounded-2xl bg-emerald-600 px-4 py-4 text-white transition hover:bg-emerald-500"
                          >
                            Like
                          </button>
                        </div>
                      </div>
                  ) : searchResult ? (
                      <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-10 text-center">
                        Кандидаты закончились. Полный список смотри на странице “Пары”.
                      </div>
                  ) : null}
                </section>

                <aside className="space-y-6">
                  <SearchMetaCard
                      algorithmName={searchResult?.algorithm_name ?? algorithm}
                      totalFound={searchResult?.total_found ?? 0}
                      executionTimeMs={searchResult?.execution_time_ms ?? 0}
                      limit={limit}
                      bestScore={currentBestScore}
                  />

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Реакции</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Liked</p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">{liked.length}</p>
                      </div>
                      <div className="rounded-2xl bg-rose-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-rose-700">Disliked</p>
                        <p className="mt-2 text-2xl font-semibold text-rose-700">{disliked.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Аналитика</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Прогонов в текущей выборке:{' '}
                        <span className="font-medium">{analyticsRuns.length}</span>
                      </div>
                      <button
                          onClick={async () => {
                            await loadAnalytics('')
                            setView('analytics')
                          }}
                          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
                      >
                        Открыть аналитику
                      </button>
                    </div>
                  </div>
                </aside>
              </div>
          )}
        </div>
      </div>
  )
}

export default App