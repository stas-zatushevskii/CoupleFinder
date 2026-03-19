import { Button } from "../components/ui/Button";

export function SettingsPage() {
    return (
        <div className="max-w-2xl rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h1 className="mb-6 text-2xl font-bold text-slate-900">Настройки</h1>

            <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Приватность</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Управление видимостью профиля и сообщениями
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Уведомления</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Настройка оповещений о лайках и новых сообщениях
                    </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                    <h2 className="font-semibold text-slate-900">Аккаунт</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Смена пароля и удаление аккаунта
                    </p>
                </div>

                <Button variant="danger">Удалить аккаунт</Button>
            </div>
        </div>
    );
}