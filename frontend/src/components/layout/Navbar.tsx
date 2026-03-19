import { Link, NavLink } from "react-router-dom";

const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
        isActive
            ? "bg-pink-500 text-white"
            : "text-slate-700 hover:bg-pink-100 hover:text-pink-600"
    }`;

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                <Link to="/" className="text-xl font-bold text-pink-600">
                    LoveLink
                </Link>

                <nav className="flex flex-wrap gap-2">
                    <NavLink to="/discover" className={navItemClass}>
                        Discover
                    </NavLink>
                    <NavLink to="/matches" className={navItemClass}>
                        Matches
                    </NavLink>
                    <NavLink to="/profile" className={navItemClass}>
                        Profile
                    </NavLink>
                    <NavLink to="/settings" className={navItemClass}>
                        Settings
                    </NavLink>
                    <NavLink to="/login" className={navItemClass}>
                        Login
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}