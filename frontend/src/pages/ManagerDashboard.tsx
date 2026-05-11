import React from "react";
import { apiFetch } from "../lib/api";

type PendingRequest = {
  id: string;
  quantity: number;
  reason: string;
  requestedAt: string;
  item: { id: string; name: string; availableStock: number };
  employee: { id: string; name: string; email: string };
};

export function ManagerDashboard() {
  const [items, setItems] = React.useState<PendingRequest[]>([]);
  const [note, setNote] = React.useState<Record<string, string>>({});
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setErr(null);
    apiFetch<PendingRequest[]>("/api/requests/pending")
      .then(setItems)
      .catch((e: any) => setErr(e?.message ?? "Failed to load pending requests"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function decide(id: string, decision: "APPROVE" | "REJECT") {
    setBusy(id);
    setErr(null);
    try {
      await apiFetch(`/api/requests/${id}/decide`, {
        method: "POST",
        body: JSON.stringify({ decision, managerNote: note[id] || undefined }),
      });
      load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update request");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row">
          <h2>Manager</h2>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>

        <p className="muted">
          Approve/reject employee requests. If stock is available, the system auto-allocates on approval.
        </p>

        {err ? <div className="alert alert-error">{err}</div> : null}

        <div className="table">
          <div className="tr head">
            <div>Employee</div>
            <div>Asset</div>
            <div>Qty</div>
            <div>Reason</div>
            <div>Note</div>
            <div>Action</div>
          </div>
          {items.map((r) => (
            <div key={r.id} className="tr">
              <div>
                <div>{r.employee.name}</div>
                <div className="muted">{r.employee.email}</div>
              </div>
              <div>
                <div>{r.item.name}</div>
                <div className="muted">Available: {r.item.availableStock}</div>
              </div>
              <div>{r.quantity}</div>
              <div className="muted">{r.reason}</div>
              <div>
                <input
                  value={note[r.id] || ""}
                  onChange={(e) => setNote((s) => ({ ...s, [r.id]: e.target.value }))}
                  placeholder="Optional note"
                />
              </div>
              <div className="row">
                <button className="btn btn-primary" disabled={busy === r.id} onClick={() => decide(r.id, "APPROVE")}>
                  {busy === r.id ? "..." : "Approve"}
                </button>
                <button className="btn btn-danger" disabled={busy === r.id} onClick={() => decide(r.id, "REJECT")}>
                  {busy === r.id ? "..." : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 ? <div className="muted">No pending requests.</div> : null}
      </div>
    </div>
  );
}

