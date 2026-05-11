import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, type User } from "../lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<User["role"]>("EMPLOYEE");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  return (
    <div className="container">
      <div className="card">
        <h2>Register</h2>
        <p className="muted">This is a demo app: you can register any of the 4 roles.</p>

        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setError(null);
            setBusy(true);
            try {
              await register({ name, email, password, role });
              nav("/");
            } catch (e: any) {
              setError(e?.message ?? "Registration failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <div className="label">Name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </label>
          <label>
            <div className="label">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          </label>
          <label>
            <div className="label">Password</div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </label>
          <label>
            <div className="label">Role</div>
            <select value={role} onChange={(e) => setRole(e.target.value as User["role"])}>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="PROCUREMENT">Procurement/Admin</option>
              <option value="FINANCE">Finance</option>
            </select>
          </label>

          {error ? <div className="alert alert-error">{error}</div> : null}

          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Creating account..." : "Register"}
          </button>
        </form>

        <div className="footerline">
          Already registered? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

