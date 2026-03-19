import { useMemo, useState, type ReactNode } from 'react'
import { ApiClient } from './api/client'
import { ErrorAlert } from './components/ErrorAlert'
import type {
  Algorithm,
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

type View = 'home' | 'settings'

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

  const client = useMemo(() => new ApiClient(apiBase), [apiBase])

  const currentCandidate = searchResult?.candidates[cursor] ?? null
  const remaining = Math.max((searchResult?.candidates.length ?? 0) - cursor, 0)

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось выполнить поиск')
    } finally {
      setSearchLoading(false)
    }
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
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <header className="mb-8 flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Couple Finder</h1>
              <p className="mt-2 text-sm text-slate-600">
                Поиск кандидатов по параметрам и просмотр результатов через like / dislike.
              </p>
            </div>

            <nav className="flex gap-3">
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
                      <label className="mb-2 block text-sm font-medium">Сколько пользователей загрузить</label>
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
          ) : (
              <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <h2 className="text-xl font-semibold">Параметры поиска</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Заполни параметры, по которым backend будет искать подходящих кандидатов в базе пользователей.
                  </p>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <FieldHint
                        label="Пол кандидата"
                        description="Выбери, кого нужно искать."
                    >
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

                    <FieldHint
                        label="Город"
                        description="Город, в котором нужно искать кандидатов."
                    >
                      <input
                          value={filters.city}
                          onChange={(e) =>
                              setFilters((prev) => ({ ...prev, city: e.target.value }))
                          }
                          placeholder="Chisinau"
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3"
                      />
                    </FieldHint>

                    <FieldHint
                        label="Возраст от"
                        description="Минимальный возраст кандидата."
                    >
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

                    <FieldHint
                        label="Возраст до"
                        description="Максимальный возраст кандидата."
                    >
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
                            <p className="text-xs uppercase tracking-wide text-slate-400">
                              Candidate
                            </p>
                            <p className="mt-3 text-3xl font-semibold">{currentCandidate.name}</p>
                            <p className="mt-2 text-slate-600">
                              #{currentCandidate.user_id}, {currentCandidate.age} лет,{' '}
                              {currentCandidate.city}
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
                        Кандидаты закончились.
                      </div>
                  ) : null}
                </section>

                <aside className="space-y-6">
                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Результат поиска</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Алгоритм:{' '}
                        <span className="font-medium">
                      {searchResult?.algorithm_name ?? algorithm}
                    </span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Найдено кандидатов:{' '}
                        <span className="font-medium">{searchResult?.total_found ?? 0}</span>
                      </div>
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Время:{' '}
                        <span className="font-medium">
                      {searchResult?.execution_time_ms ?? 0} ms
                    </span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Реакции</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">
                          Liked
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-emerald-700">
                          {liked.length}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-rose-50 px-4 py-4">
                        <p className="text-xs uppercase tracking-wide text-rose-700">
                          Disliked
                        </p>
                        <p className="mt-2 text-2xl font-semibold text-rose-700">
                          {disliked.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                    <h3 className="text-lg font-semibold">Текущие фильтры</h3>
                    <div className="mt-4 space-y-3 text-sm text-slate-600">
                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Пол: <span className="font-medium">{filters.gender}</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Возраст: <span className="font-medium">{filters.age_from} - {filters.age_to}</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Город: <span className="font-medium">{filters.city}</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Цель: <span className="font-medium">{filters.relationship_goal}</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Образ жизни: <span className="font-medium">{filters.lifestyle}</span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Вредные привычки:{' '}
                        <span className="font-medium">
        {filters.has_bad_habits
            ? filters.bad_habits.length > 0
                ? filters.bad_habits.join(', ')
                : 'допустимы'
            : 'не допускаются'}
      </span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 px-4 py-3">
                        Интересы:{' '}
                        <span className="font-medium">
        {filters.interests.length > 0 ? filters.interests.join(', ') : 'не выбраны'}
      </span>
                      </div>
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