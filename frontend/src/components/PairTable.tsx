import type { PairDTO } from '../types/api'

type PairTableProps = {
    pairs: PairDTO[]
}

export function PairTable({ pairs }: PairTableProps) {
    if (!pairs.length) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                Пары не найдены.
            </div>
        )
    }

    return (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                <div>User A</div>
                <div>User B</div>
                <div>Score</div>
            </div>

            <div className="divide-y divide-slate-100">
                {pairs.map((pair, index) => (
                    <div
                        key={`${pair.user_a_id}-${pair.user_b_id}-${index}`}
                        className="grid grid-cols-3 gap-4 px-4 py-3 text-sm text-slate-700"
                    >
                        <div>{pair.user_a_id}</div>
                        <div>{pair.user_b_id}</div>
                        <div>{pair.score.toFixed(4)}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}