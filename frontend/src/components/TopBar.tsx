import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function TopBar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link to="/" className="brand">
          IT Asset System
        </Link>
        <div className="spacer" />
        {user ? (
          <div className="topbar-right">
            <div className="pill">
              <div className="pill-title">{user.name}</div>
              <div className="pill-sub">{user.role}</div>
            </div>
            <button
              className="btn btn-ghost"
              onClick={() => {
                logout();
                nav("/login");
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <nav className="topbar-right">
            <Link className="btn btn-ghost" to="/login">
              Login
            </Link>
            <Link className="btn btn-primary" to="/register">
              Register
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

