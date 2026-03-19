import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";

export function ProfilePage() {
    return (
        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
            <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <img
                    src="https://i.pravatar.cc/300?img=15"
                    alt="My profile"
                    className="h-72 w-full rounded-2xl object-cover"
                />
                <div className="mt-4 space-y-2">
                    <h2 className="text-2xl font-bold text-slate-900">Stanislav, 24</h2>
                    <p className="text-sm text-slate-500">Chisinau</p>
                    <p className="text-sm text-slate-700">
                        Люблю технологии, музыку и интересные разговоры.
                    </p>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <h1 className="mb-6 text-2xl font-bold text-slate-900">
                    Редактирование профиля
                </h1>

                <form className="grid gap-4 md:grid-cols-2">
                    <Input label="Имя" defaultValue="Stanislav" />
                    <Input label="Город" defaultValue="Chisinau" />
                    <Input label="Возраст" type="number" defaultValue="24" />
                    <Input label="Ищу возраст" defaultValue="20-28" />
                    <div className="md:col-span-2">
                        <Textarea
                            label="О себе"
                            defaultValue="Люблю технологии, музыку и интересные разговоры."
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Input
                            label="Интересы"
                            defaultValue="music, travel, coding, cinema"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Button>Сохранить изменения</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}