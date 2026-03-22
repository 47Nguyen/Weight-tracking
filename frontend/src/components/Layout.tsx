import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Weight Tracker</div>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Profile
          </NavLink>
          <NavLink to="/analysis" className={({ isActive }) => (isActive ? "active" : undefined)}>
            Scenario analysis
          </NavLink>
        </nav>
        <div className="user-meta">
          <span className="muted">{user?.username}</span>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
