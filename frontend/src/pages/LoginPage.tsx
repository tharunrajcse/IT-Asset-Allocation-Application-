import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = React.useState("employee1@acme.com");
  const [password, setPassword] = React.useState("Password@123");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="container">
      <div className="card">
        <h2>Login</h2>
        <p className="muted">Use the seeded users from the README, or your own registration.</p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            try {
              await login(email, password);
              nav("/");
            } catch (e: any) {
              setError(e?.message ?? "Login failed");
            } finally {
              setBusy(false);
            }
          }}
          className="form"
        >
          <label>
            <div className="label">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label>
            <div className="label">Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="footerline">
          No account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

