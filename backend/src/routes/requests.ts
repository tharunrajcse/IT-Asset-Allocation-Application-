import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getAuthUser, requireAuth, requireRole } from "../lib/auth";
import { RequestStatus, Role } from "@prisma/client";
import { param } from "../lib/params";

export const requestsRouter = Router();

const CreateRequestSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
  reason: z.string().min(3),
});

requestsRouter.post("/", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const parsed = CreateRequestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await prisma.inventoryItem.findUnique({ where: { id: parsed.data.itemId } });
  if (!item) return res.status(404).json({ error: "Inventory item not found" });

  const ar = await prisma.assetRequest.create({
    data: {
      employeeId: u.id,
      itemId: item.id,
      quantity: parsed.data.quantity,
      reason: parsed.data.reason,
    },
    include: { item: true },
  });
  res.json(ar);
});

requestsRouter.get("/mine", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const items = await prisma.assetRequest.findMany({
    where: { employeeId: u.id },
    include: { item: true, allocation: true, purchaseOrderItem: { include: { purchaseOrder: true } } },
    orderBy: { requestedAt: "desc" },
  });
  res.json(items);
});

requestsRouter.get("/pending", requireAuth, requireRole([Role.MANAGER]), async (_req, res) => {
  const items = await prisma.assetRequest.findMany({
    where: { status: RequestStatus.PENDING },
    include: { item: true, employee: true },
    orderBy: { requestedAt: "asc" },
  });
  res.json(items);
});

const DecideSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  managerNote: z.string().optional(),
});

requestsRouter.post("/:id/decide", requireAuth, requireRole([Role.MANAGER]), async (req, res) => {
  const u = getAuthUser(req)!;
  const parsed = DecideSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = param(req, "id");
  const request = await prisma.assetRequest.findUnique({
    where: { id },
    include: { item: true },
  });
  if (!request) return res.status(404).json({ error: "Request not found" });
  if (request.status !== RequestStatus.PENDING) return res.status(409).json({ error: "Request already decided" });

  if (parsed.data.decision === "REJECT") {
    const updated = await prisma.assetRequest.update({
      where: { id: request.id },
      data: {
        status: RequestStatus.REJECTED,
        managerId: u.id,
        managerNote: parsed.data.managerNote ?? null,
        decidedAt: new Date(),
      },
      include: { item: true, employee: true },
    });
    return res.json(updated);
  }

  const result = await prisma.$transaction(async (tx) => {
    const freshItem = await tx.inventoryItem.findUnique({ where: { id: request.itemId } });
    if (!freshItem) throw new Error("Item missing");

    // Mark approved first.
    const approved = await tx.assetRequest.update({
      where: { id: request.id },
      data: {
        status: RequestStatus.APPROVED,
        managerId: u.id,
        managerNote: parsed.data.managerNote ?? null,
        decidedAt: new Date(),
      },
    });

    // Auto-allocate if inventory available.
    if (freshItem.availableStock >= request.quantity) {
      await tx.inventoryItem.update({
        where: { id: freshItem.id },
        data: { availableStock: { decrement: request.quantity } },
      });

      const allocation = await tx.allocation.create({
        data: {
          userId: request.employeeId,
          itemId: request.itemId,
          quantity: request.quantity,
          requestId: request.id,
        },
      });

      const fulfilled = await tx.assetRequest.update({
        where: { id: request.id },
        data: { status: RequestStatus.FULFILLED, fulfilledAt: new Date() },
      });

      return { approved: fulfilled, allocation };
    }

    return { approved, allocation: null };
  });

  const hydrated = await prisma.assetRequest.findUnique({
    where: { id },
    include: { item: true, employee: true, allocation: true },
  });

  return res.json({ ...result, request: hydrated });
});

