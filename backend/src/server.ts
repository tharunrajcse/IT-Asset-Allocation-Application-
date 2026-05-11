import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { inventoryRouter } from "./routes/inventory";
import { vendorsRouter } from "./routes/vendors";
import { requestsRouter } from "./routes/requests";
import { purchaseOrdersRouter } from "./routes/purchaseOrders";
import { financeRouter } from "./routes/finance";
import { exportsRouter } from "./routes/exports";
import { ticketsRouter } from "./routes/tickets";
import { returnsRouter } from "./routes/returns";

const app = express();

const allowedOrigins = new Set([env.FRONTEND_ORIGIN]);
const localhostRegex = /^http:\/\/localhost:\d+$/;
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || localhostRegex.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin denied: ${origin}`));
      }
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/inventory", inventoryRouter);
app.use("/api/vendors", vendorsRouter);
app.use("/api/requests", requestsRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/finance", financeRouter);
app.use("/api/exports", exportsRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/returns", returnsRouter);

app.use((err: any, _req: any, res: any, _next: any) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});

