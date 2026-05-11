import React from "react";
import { apiFetch } from "../lib/api";

type Invoice = {
  id: string;
  paymentStatus: "PENDING" | "PAID";
  purchaseOrder: {
    id: string;
    status: string;
    vendor: { name: string };
    items: Array<{ quantity: number; totalCost: number; item: { name: string } }>;
  };
};

export function FinanceDashboard() {
  const [items, setItems] = React.useState<Invoice[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setErr(null);
    apiFetch<Invoice[]>("/api/finance/invoices")
      .then(setItems)
      .catch((e: any) => setErr(e?.message ?? "Failed to load invoices"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, paymentStatus: "PENDING" | "PAID") {
    setBusy(id);
    setErr(null);
    try {
      await apiFetch(`/api/finance/invoices/${id}/payment`, { method: "POST", body: JSON.stringify({ paymentStatus }) });
      load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update payment");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container">
      <div className="card">
        <div className="row">
          <h2>Finance</h2>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        <p className="muted">Track invoices and update payment status.</p>
        {err ? <div className="alert alert-error">{err}</div> : null}

        <div className="table">
          <div className="tr head">
            <div>Invoice</div>
            <div>Vendor</div>
            <div>Items</div>
            <div>Total</div>
            <div>Status</div>
            <div>Action</div>
          </div>
          {items.map((inv) => {
            const total = inv.purchaseOrder.items.reduce((s, it) => s + it.totalCost, 0);
            return (
              <div key={inv.id} className="tr">
                <div className="muted">{inv.id.slice(0, 10)}…</div>
                <div>{inv.purchaseOrder.vendor.name}</div>
                <div className="muted">
                  {inv.purchaseOrder.items.map((it) => `${it.item.name} × ${it.quantity}`).join(", ")}
                </div>
                <div>{total}</div>
                <div>
                  <span className={`badge b-${inv.paymentStatus.toLowerCase()}`}>{inv.paymentStatus}</span>
                </div>
                <div className="row">
                  <button className="btn btn-ghost" disabled={busy === inv.id} onClick={() => setStatus(inv.id, "PENDING")}>
                    Pending
                  </button>
                  <button className="btn btn-primary" disabled={busy === inv.id} onClick={() => setStatus(inv.id, "PAID")}>
                    Paid
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

