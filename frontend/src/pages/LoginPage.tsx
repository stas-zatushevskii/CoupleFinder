import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

export function LoginPage() {
    return (
        <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Вход</h1>
                <p className="text-sm text-slate-500">Войдите в свой аккаунт</p>
            </div>

            <form className="space-y-4">
                <Input label="Email" type="email" placeholder="you@example.com" />
                <Input label="Пароль" type="password" placeholder="********" />
                <Button fullWidth type="submit">
                    Войти
                </Button>
            </form>
        </div>
    );
}