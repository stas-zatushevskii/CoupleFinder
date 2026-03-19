import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function RegisterPage() {
    return (
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Регистрация</h1>
                <p className="text-sm text-slate-500">Создайте новый аккаунт</p>
            </div>

            <form className="grid gap-4 md:grid-cols-2">
                <Input label="Имя" placeholder="Анна" />
                <Input label="Город" placeholder="Chisinau" />
                <Input label="Email" type="email" placeholder="you@example.com" />
                <Input label="Дата рождения" type="date" />
                <div className="md:col-span-2">
                    <Input label="Пароль" type="password" placeholder="********" />
                </div>
                <div className="md:col-span-2">
                    <Button fullWidth type="submit">
                        Создать аккаунт
                    </Button>
                </div>
            </form>
        </div>
    );
}