import { Link } from "react-router-dom";
import type { Match } from "../../types/user";

type Props = {
    match: Match;
};

export function MatchCard({ match }: Props) {
    return (
        <Link
            to={`/chat/${match.user.id}`}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-pink-300"
        >
            <img
                src={match.user.avatar}
                alt={match.user.name}
                className="h-14 w-14 rounded-full object-cover"
            />
            <div className="min-w-0">
                <h3 className="font-semibold text-slate-900">{match.user.name}</h3>
                <p className="truncate text-sm text-slate-500">
                    {match.lastMessage || "Начните общение"}
                </p>
            </div>
        </Link>
    );
}