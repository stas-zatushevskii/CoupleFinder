import { UserCard } from "../components/dating/UserCard";
import { useDiscoverQueue } from "../hooks/useDiscoverQueue";

export function DiscoverPage() {
    const { currentUser, like, skip, loading, isEmpty, unseenCount, hasMore } =
        useDiscoverQueue();

    if (loading && !currentUser) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <p className="text-lg text-slate-500">Загрузка анкет...</p>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
                <h1 className="text-2xl font-bold text-slate-900">Анкеты закончились</h1>
                <p className="mt-2 text-slate-500">
                    Новых рекомендаций пока нет.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Лента анкет</h1>
                    <p className="text-slate-500">
                        Одна карточка на экране, остальные хранятся в локальном буфере
                    </p>
                </div>

                <div className="flex gap-3">
                    <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                        В буфере: {unseenCount}
                    </div>
                    <div className="rounded-full bg-white px-4 py-2 text-sm text-slate-600 ring-1 ring-slate-200">
                        {hasMore ? "Есть ещё анкеты" : "Это последняя пачка"}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-md">
                {currentUser && (
                    <UserCard
                        user={currentUser}
                        onLike={() => void like()}
                        onSkip={() => void skip()}
                    />
                )}
            </div>
        </div>
    );
}