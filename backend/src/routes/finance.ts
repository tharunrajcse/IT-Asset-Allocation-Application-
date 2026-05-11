import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../lib/auth";
import { PaymentStatus, Role } from "@prisma/client";
import { param } from "../lib/params";

export const financeRouter = Router();

financeRouter.get("/invoices", requireAuth, requireRole([Role.FINANCE, Role.PROCUREMENT]), async (_req, res) => {
  const invoices = await prisma.invoice.findMany({
    include: {
      purchaseOrder: {
        include: { vendor: true, items: { include: { item: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(invoices);
});

const UpdatePaymentSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
});

financeRouter.post("/invoices/:id/payment", requireAuth, requireRole([Role.FINANCE]), async (req, res) => {
  const parsed = UpdatePaymentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = param(req, "id");
  const invoice = await prisma.invoice.update({
    where: { id },
    data: { paymentStatus: parsed.data.paymentStatus },
    include: { purchaseOrder: { include: { vendor: true, items: { include: { item: true } } } } },
  });
  res.json(invoice);
});

