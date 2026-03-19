import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar.tsx";
import { PageContainer } from "./PageContainer";

export function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />
            <PageContainer>
                <Outlet />
            </PageContainer>
        </div>
    );
}