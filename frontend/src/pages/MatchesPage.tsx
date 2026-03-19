import { mockMatches } from "../data/mockUsers";
import { MatchCard } from "../components/dating/MatchCard";

export function MatchesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Мэтчи</h1>
                <p className="text-slate-500">Пользователи с взаимной симпатией</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {mockMatches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                ))}
            </div>
        </div>
    );
}