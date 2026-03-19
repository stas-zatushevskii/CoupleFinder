import type { RunMatchResponse } from '../types/api'
import { MetricCard } from './MetricCard'
import { PairTable } from './PairTable'

type ResultCardProps = {
    result: RunMatchResponse
}

export function ResultCard({ result }: ResultCardProps) {
    return (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-slate-900">{result.algorithm_name}</h3>
                    <p className="mt-1 text-sm text-slate-500">Результат запуска алгоритма</p>
                </div>

                <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          {result.pairs_found} pairs
        </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
                <MetricCard title="Время" value={`${result.execution_time_ms} ms`} />
                <MetricCard title="Найдено пар" value={String(result.pairs_found)} />
                <MetricCard title="Средний score" value={result.avg_score.toFixed(4)} />
            </div>

            <div className="mt-6">
                <PairTable pairs={result.pairs} />
            </div>
        </div>
    )
}