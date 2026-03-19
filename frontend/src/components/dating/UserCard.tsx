import type { User } from "../../types/user";
import { InterestBadge } from "./InterestBadge";
import { Button } from "../ui/Button";

type Props = {
    user: User;
    onLike?: (user: User) => void;
    onSkip?: (user: User) => void;
};

export function UserCard({ user, onLike, onSkip }: Props) {
    return (
        <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200">
            <img
                src={user.avatar}
                alt={user.name}
                className="h-80 w-full object-cover"
            />

            <div className="space-y-4 p-5">
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                        {user.name}, {user.age}
                    </h3>
                    <p className="text-sm text-slate-500">{user.city}</p>
                </div>

                <p className="text-sm leading-6 text-slate-700">{user.bio}</p>

                <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest) => (
                        <InterestBadge key={interest} value={interest} />
                    ))}
                </div>

                <div className="flex gap-3">
                    <Button variant="secondary" fullWidth onClick={() => onSkip?.(user)}>
                        Пропустить
                    </Button>
                    <Button fullWidth onClick={() => onLike?.(user)}>
                        Лайк
                    </Button>
                </div>
            </div>
        </div>
    );
}