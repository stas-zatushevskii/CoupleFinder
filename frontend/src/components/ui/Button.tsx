import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
    variant?: Variant;
    fullWidth?: boolean;
};

export function Button({
                           children,
                           variant = "primary",
                           fullWidth = false,
                           className = "",
                           ...props
                       }: Props) {
    const base =
        "rounded-xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60";
    const variants: Record<Variant, string> = {
        primary: "bg-pink-500 text-white hover:bg-pink-600",
        secondary: "bg-slate-200 text-slate-800 hover:bg-slate-300",
        ghost: "bg-transparent text-slate-700 hover:bg-slate-100",
        danger: "bg-red-500 text-white hover:bg-red-600",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}