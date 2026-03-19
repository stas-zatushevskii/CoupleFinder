import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";

export function HomePage() {
    return (
        <section className="grid items-center gap-8 py-12 md:grid-cols-2">
            <div className="space-y-6">
        <span className="inline-block rounded-full bg-pink-100 px-4 py-2 text-sm font-medium text-pink-700">
          Современный сайт знакомств
        </span>
                <h1 className="text-5xl font-bold leading-tight text-slate-900">
                    Находи людей для общения, дружбы и отношений
                </h1>
                <p className="max-w-xl text-lg leading-8 text-slate-600">
                    LoveLink помогает знакомиться, находить взаимные симпатии и общаться
                    в удобном интерфейсе.
                </p>
                <div className="flex gap-4">
                    <Link to="/register">
                        <Button>Начать</Button>
                    </Link>
                    <Link to="/discover">
                        <Button variant="secondary">Смотреть анкеты</Button>
                    </Link>
                </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <img
                    src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop"
                    alt="Dating"
                    className="h-[420px] w-full rounded-2xl object-cover"
                />
            </div>
        </section>
    );
}