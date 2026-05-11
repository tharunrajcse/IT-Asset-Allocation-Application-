import React from "react";
import { apiFetch } from "../lib/api";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  totalStock: number;
  availableStock: number;
  reorderLevel: number;
};

type AssetRequest = {
  id: string;
  quantity: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED";
  managerNote: string | null;
  requestedAt: string;
  item: InventoryItem;
};

type Allocation = {
  id: string;
  quantity: number;
  allocatedAt: string;
  returnedAt: string | null;
  item: InventoryItem;
};

type Ticket = {
  id: string;
  assetName: string;
  issueDescription: string;
  status: string;
  createdAt: string;
};

export function EmployeeDashboard() {
  const [tab, setTab] = React.useState<"request" | "status" | "assets" | "tickets">("request");

  return (
    <div className="container">
      <div className="card">
        <h2>Employee</h2>
        <div className="tabs">
          <button className={tab === "request" ? "tab active" : "tab"} onClick={() => setTab("request")}>
            Request asset
          </button>
          <button className={tab === "status" ? "tab active" : "tab"} onClick={() => setTab("status")}>
            Request status
          </button>
          <button className={tab === "assets" ? "tab active" : "tab"} onClick={() => setTab("assets")}>
            Assigned assets / Return
          </button>
          <button className={tab === "tickets" ? "tab active" : "tab"} onClick={() => setTab("tickets")}>
            Maintenance tickets
          </button>
        </div>

        {tab === "request" ? <RequestAsset /> : null}
        {tab === "status" ? <RequestStatus /> : null}
        {tab === "assets" ? <AssignedAssets /> : null}
        {tab === "tickets" ? <Tickets /> : null}
      </div>
    </div>
  );
}

function RequestAsset() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [itemId, setItemId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState(1);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory").then(setInventory).catch(() => setErr("Failed to load inventory"));
  }, []);

  return (
    <div className="grid">
      <div className="subcard">
        <h3>New request</h3>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setErr(null);
            setMsg(null);
            setBusy(true);
            try {
              await apiFetch("/api/requests", {
                method: "POST",
                body: JSON.stringify({ itemId, quantity, reason }),
              });
              setMsg("Request submitted. Waiting for manager approval.");
              setReason("");
              setQuantity(1);
            } catch (e: any) {
              setErr(e?.message ?? "Failed to submit request");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <div className="label">Asset</div>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="" disabled>
                Select asset
              </option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Available: {i.availableStock})
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="label">Quantity</div>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <label>
            <div className="label">Reason</div>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Business reason..." />
          </label>
          {msg ? <div className="alert alert-ok">{msg}</div> : null}
          {err ? <div className="alert alert-error">{err}</div> : null}
          <button className="btn btn-primary" disabled={busy || !itemId}>
            {busy ? "Submitting..." : "Submit request"}
          </button>
        </form>
      </div>
      <div className="subcard">
        <h3>How it works</h3>
        <div className="muted">
          Manager approves/rejects. If stock is available, the system auto-allocates. If stock is unavailable, procurement
          creates a purchase order and allocation happens after delivery.
        </div>
      </div>
    </div>
  );
}

function RequestStatus() {
  const [items, setItems] = React.useState<AssetRequest[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setErr(null);
    apiFetch<AssetRequest[]>("/api/requests/mine")
      .then(setItems)
      .catch((e: any) => setErr(e?.message ?? "Failed to load requests"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="subcard">
      <div className="row">
        <h3>Your requests</h3>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>
      {err ? <div className="alert alert-error">{err}</div> : null}
      <div className="table">
        <div className="tr head">
          <div>Asset</div>
          <div>Qty</div>
          <div>Status</div>
          <div>Manager note</div>
          <div>Requested</div>
        </div>
        {items.map((r) => (
          <div key={r.id} className="tr">
            <div>{r.item.name}</div>
            <div>{r.quantity}</div>
            <div>
              <span className={`badge b-${r.status.toLowerCase()}`}>{r.status}</span>
            </div>
            <div className="muted">{r.managerNote ?? "-"}</div>
            <div className="muted">{new Date(r.requestedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignedAssets() {
  const [items, setItems] = React.useState<Allocation[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setErr(null);
    apiFetch<Allocation[]>("/api/returns/assigned")
      .then(setItems)
      .catch((e: any) => setErr(e?.message ?? "Failed to load allocations"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="subcard">
      <div className="row">
        <h3>Assigned assets</h3>
        <div className="spacer" />
        <button className="btn btn-ghost" onClick={load}>
          Refresh
        </button>
      </div>
      {err ? <div className="alert alert-error">{err}</div> : null}
      {items.length === 0 ? <div className="muted">No assigned assets.</div> : null}
      <div className="table">
        <div className="tr head">
          <div>Asset</div>
          <div>Qty</div>
          <div>Allocated</div>
          <div>Action</div>
        </div>
        {items.map((a) => (
          <div key={a.id} className="tr">
            <div>{a.item.name}</div>
            <div>{a.quantity}</div>
            <div className="muted">{new Date(a.allocatedAt).toLocaleString()}</div>
            <div>
              <button
                className="btn btn-danger"
                disabled={busy === a.id}
                onClick={async () => {
                  setBusy(a.id);
                  setErr(null);
                  try {
                    await apiFetch("/api/returns", { method: "POST", body: JSON.stringify({ allocationId: a.id }) });
                    load();
                  } catch (e: any) {
                    setErr(e?.message ?? "Failed to return");
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === a.id ? "Returning..." : "Return"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tickets() {
  const [items, setItems] = React.useState<Ticket[]>([]);
  const [assetName, setAssetName] = React.useState("");
  const [issueDescription, setIssueDescription] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    apiFetch<Ticket[]>("/api/tickets/mine").then(setItems).catch(() => setErr("Failed to load tickets"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid">
      <div className="subcard">
        <h3>Raise ticket</h3>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr(null);
            try {
              await apiFetch("/api/tickets", { method: "POST", body: JSON.stringify({ assetName, issueDescription }) });
              setAssetName("");
              setIssueDescription("");
              load();
            } catch (e: any) {
              setErr(e?.message ?? "Failed to raise ticket");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <div className="label">Asset name</div>
            <input value={assetName} onChange={(e) => setAssetName(e.target.value)} placeholder="Laptop" />
          </label>
          <label>
            <div className="label">Issue description</div>
            <textarea
              value={issueDescription}
              onChange={(e) => setIssueDescription(e.target.value)}
              placeholder="Describe the issue..."
            />
          </label>
          {err ? <div className="alert alert-error">{err}</div> : null}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Submitting..." : "Submit ticket"}
          </button>
        </form>
      </div>
      <div className="subcard">
        <div className="row">
          <h3>Your tickets</h3>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        <div className="table">
          <div className="tr head">
            <div>Asset</div>
            <div>Status</div>
            <div>Created</div>
          </div>
          {items.map((t) => (
            <div key={t.id} className="tr">
              <div>
                <div>{t.assetName}</div>
                <div className="muted">{t.issueDescription}</div>
              </div>
              <div>
                <span className="badge">{t.status}</span>
              </div>
              <div className="muted">{new Date(t.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

