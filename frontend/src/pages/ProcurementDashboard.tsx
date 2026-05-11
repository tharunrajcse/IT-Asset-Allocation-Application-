import React from "react";
import { apiFetch, downloadFile, API_BASE } from "../lib/api";

type InventoryItem = {
  id: string;
  name: string;
  sku: string;
  totalStock: number;
  availableStock: number;
  reorderLevel: number;
};

type Vendor = { id: string; name: string; email: string | null; phone: string | null };

type PurchaseOrder = {
  id: string;
  status: "ORDERED" | "SHIPPED" | "DELIVERED";
  deliveryDate: string | null;
  vendor: Vendor;
  items: Array<{
    id: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    item: InventoryItem;
  }>;
  invoice: { id: string; paymentStatus: "PENDING" | "PAID" } | null;
};

export function ProcurementDashboard() {
  const [tab, setTab] = React.useState<"inventory" | "vendors" | "po" | "allocate" | "exports">("inventory");

  return (
    <div className="container">
      <div className="card">
        <h2>Procurement / Admin</h2>
        <div className="tabs">
          <button className={tab === "inventory" ? "tab active" : "tab"} onClick={() => setTab("inventory")}>
            Inventory
          </button>
          <button className={tab === "vendors" ? "tab active" : "tab"} onClick={() => setTab("vendors")}>
            Vendors
          </button>
          <button className={tab === "po" ? "tab active" : "tab"} onClick={() => setTab("po")}>
            Purchase orders
          </button>
          <button className={tab === "allocate" ? "tab active" : "tab"} onClick={() => setTab("allocate")}>
            Allocate assets
          </button>
          <button className={tab === "exports" ? "tab active" : "tab"} onClick={() => setTab("exports")}>
            PDF / Excel
          </button>
        </div>

        {tab === "inventory" ? <Inventory /> : null}
        {tab === "vendors" ? <Vendors /> : null}
        {tab === "po" ? <PurchaseOrders /> : null}
        {tab === "allocate" ? <Allocate /> : null}
        {tab === "exports" ? <Exports /> : null}
      </div>
    </div>
  );
}

function Inventory() {
  const [items, setItems] = React.useState<InventoryItem[]>([]);
  const [low, setLow] = React.useState<InventoryItem[]>([]);
  const [err, setErr] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const [a, b] = await Promise.all([
        apiFetch<InventoryItem[]>("/api/inventory"),
        apiFetch<InventoryItem[]>("/api/inventory/low-stock"),
      ]);
      setItems(a);
      setLow(b);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load inventory");
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid">
      <div className="subcard">
        <div className="row">
          <h3>All inventory</h3>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        {err ? <div className="alert alert-error">{err}</div> : null}
        <div className="table">
          <div className="tr head">
            <div>Asset</div>
            <div>SKU</div>
            <div>Total</div>
            <div>Available</div>
            <div>Reorder</div>
          </div>
          {items.map((i) => (
            <div key={i.id} className="tr">
              <div>{i.name}</div>
              <div className="muted">{i.sku}</div>
              <div>{i.totalStock}</div>
              <div>{i.availableStock}</div>
              <div className="muted">{i.reorderLevel}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="subcard">
        <h3>Low stock alerts</h3>
        {low.length === 0 ? <div className="muted">No low stock items.</div> : null}
        <div className="table">
          <div className="tr head">
            <div>Asset</div>
            <div>Available</div>
            <div>Reorder</div>
          </div>
          {low.map((i) => (
            <div key={i.id} className="tr">
              <div>{i.name}</div>
              <div>{i.availableStock}</div>
              <div className="muted">{i.reorderLevel}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Vendors() {
  const [items, setItems] = React.useState<Vendor[]>([]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(() => {
    setErr(null);
    apiFetch<Vendor[]>("/api/vendors")
      .then(setItems)
      .catch((e: any) => setErr(e?.message ?? "Failed to load vendors"));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="grid">
      <div className="subcard">
        <h3>Add vendor</h3>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr(null);
            try {
              await apiFetch("/api/vendors", { method: "POST", body: JSON.stringify({ name, email, phone }) });
              setName("");
              setEmail("");
              setPhone("");
              load();
            } catch (e: any) {
              setErr(e?.message ?? "Failed to add vendor");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <div className="label">Vendor name</div>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            <div className="label">Email</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <div className="label">Phone</div>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          {err ? <div className="alert alert-error">{err}</div> : null}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? "Saving..." : "Add vendor"}
          </button>
        </form>
      </div>
      <div className="subcard">
        <div className="row">
          <h3>Vendors</h3>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        <div className="table">
          <div className="tr head">
            <div>Name</div>
            <div>Email</div>
            <div>Phone</div>
          </div>
          {items.map((v) => (
            <div key={v.id} className="tr">
              <div>{v.name}</div>
              <div className="muted">{v.email ?? "-"}</div>
              <div className="muted">{v.phone ?? "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PurchaseOrders() {
  const [items, setItems] = React.useState<PurchaseOrder[]>([]);
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [vendorId, setVendorId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [unitCost, setUnitCost] = React.useState(1000);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setErr(null);
    try {
      const [pos, inv, ven] = await Promise.all([
        apiFetch<PurchaseOrder[]>("/api/purchase-orders"),
        apiFetch<InventoryItem[]>("/api/inventory"),
        apiFetch<Vendor[]>("/api/vendors"),
      ]);
      setItems(pos);
      setInventory(inv);
      setVendors(ven);
      if (!vendorId && ven[0]) setVendorId(ven[0].id);
      if (!itemId && inv[0]) setItemId(inv[0].id);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load purchase orders");
    }
  }, [vendorId, itemId]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: PurchaseOrder["status"]) {
    setBusy(true);
    setErr(null);
    try {
      await apiFetch(`/api/purchase-orders/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
      load();
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid">
      <div className="subcard">
        <h3>Create purchase order</h3>
        <form
          className="form"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setErr(null);
            try {
              await apiFetch("/api/purchase-orders", {
                method: "POST",
                body: JSON.stringify({ vendorId, itemId, quantity, unitCost }),
              });
              load();
            } catch (e: any) {
              setErr(e?.message ?? "Failed to create PO");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            <div className="label">Vendor</div>
            <select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
              <option value="" disabled>
                Select vendor
              </option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="label">Asset</div>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="" disabled>
                Select asset
              </option>
              {inventory.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div className="label">Quantity</div>
            <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </label>
          <label>
            <div className="label">Unit cost</div>
            <input type="number" min={1} value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
          </label>
          {err ? <div className="alert alert-error">{err}</div> : null}
          <button className="btn btn-primary" disabled={busy || !vendorId || !itemId}>
            {busy ? "Creating..." : "Create PO"}
          </button>
        </form>
      </div>

      <div className="subcard">
        <div className="row">
          <h3>Purchase orders</h3>
          <div className="spacer" />
          <button className="btn btn-ghost" onClick={load}>
            Refresh
          </button>
        </div>
        <div className="table table-wide">
          <div className="tr head">
            <div>Order</div>
            <div>Vendor</div>
            <div>Items</div>
            <div>Delivery</div>
            <div>Actions</div>
          </div>
          {items.map((po) => (
            <div key={po.id} className="tr">
              <div className="muted">{po.id.slice(0, 10)}…</div>
              <div>{po.vendor.name}</div>
              <div className="muted">
                {po.items.map((it) => `${it.item.name} × ${it.quantity}`).join(", ")}
              </div>
              <div>
                <span className="badge">{po.status}</span>
                <div className="muted">{po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : "-"}</div>
              </div>
              <div className="actions row">
                <button className="btn btn-ghost" disabled={busy} onClick={() => updateStatus(po.id, "ORDERED")}>
                  Ordered
                </button>
                <button className="btn btn-ghost" disabled={busy} onClick={() => updateStatus(po.id, "SHIPPED")}>
                  Shipped
                </button>
                <button className="btn btn-primary" disabled={busy} onClick={() => updateStatus(po.id, "DELIVERED")}>
                  Delivered
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => downloadFile(`/api/exports/purchase-orders/${po.id}/receipt.pdf`, `purchase-receipt-${po.id}.pdf`)}
                >
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Allocate() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [userId, setUserId] = React.useState("");
  const [itemId, setItemId] = React.useState("");
  const [quantity, setQuantity] = React.useState(1);
  const [err, setErr] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    apiFetch<InventoryItem[]>("/api/inventory").then((r) => {
      setInventory(r);
      if (r[0]) setItemId(r[0].id);
    });
  }, []);

  return (
    <div className="subcard">
      <h3>Manual allocation</h3>
      <p className="muted">
        For simplicity in this MVP, enter the employee’s userId. (In production you’d search/select employees.)
      </p>
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setMsg(null);
          setBusy(true);
          try {
            await apiFetch("/api/inventory/allocate", {
              method: "POST",
              body: JSON.stringify({ userId, itemId, quantity }),
            });
            setMsg("Allocated successfully.");
          } catch (e: any) {
            setErr(e?.message ?? "Allocation failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          <div className="label">Employee userId</div>
          <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="cuid..." />
        </label>
        <label>
          <div className="label">Asset</div>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {inventory.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} (Available: {i.availableStock})
              </option>
            ))}
          </select>
        </label>
        <label>
          <div className="label">Quantity</div>
          <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
        </label>
        {msg ? <div className="alert alert-ok">{msg}</div> : null}
        {err ? <div className="alert alert-error">{err}</div> : null}
        <button className="btn btn-primary" disabled={busy || !userId}>
          {busy ? "Allocating..." : "Allocate"}
        </button>
      </form>
    </div>
  );
}

function Exports() {
  return (
    <div className="subcard">
      <h3>Exports</h3>
      <div className="row">
        <button
          className="btn btn-primary"
          onClick={() => downloadFile("/api/exports/purchase-history.xlsx", "purchase-history.xlsx")}
        >
          Export purchase history (Excel)
        </button>
      </div>
      <p className="muted">PDF receipts are available per PO in the purchase orders tab.</p>
    </div>
  );
}

