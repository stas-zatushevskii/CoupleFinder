import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
    label: string;
};

export function Input({ label, className = "", ...props }: Props) {
    return (
        <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">{label}</span>
            <input
                className={`rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-pink-400 ${className}`}
                {...props}
            />
        </label>
    );
}