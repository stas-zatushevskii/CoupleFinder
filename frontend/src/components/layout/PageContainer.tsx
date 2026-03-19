import type { PropsWithChildren } from "react";

export function PageContainer({ children }: PropsWithChildren) {
    return <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>;
}