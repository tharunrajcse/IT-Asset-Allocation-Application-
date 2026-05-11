import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getAuthUser, requireAuth, requireRole } from "../lib/auth";
import { PurchaseOrderStatus, RequestStatus, Role } from "@prisma/client";
import { param } from "../lib/params";

export const purchaseOrdersRouter = Router();

purchaseOrdersRouter.get("/", requireAuth, requireRole([Role.PROCUREMENT, Role.FINANCE]), async (_req, res) => {
  const orders = await prisma.purchaseOrder.findMany({
    include: {
      vendor: true,
      items: { include: { item: true, request: { include: { employee: true } } } },
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

const CreatePOSchema = z.object({
  vendorId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
  unitCost: z.number().int().positive(),
  requestId: z.string().optional(),
});

purchaseOrdersRouter.post("/", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = CreatePOSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { vendorId, itemId, quantity, unitCost, requestId } = parsed.data;

  if (requestId) {
    const ar = await prisma.assetRequest.findUnique({ where: { id: requestId } });
    if (!ar) return res.status(404).json({ error: "Request not found" });
    if (ar.status !== RequestStatus.APPROVED) {
      return res.status(409).json({ error: "Request must be approved before procurement" });
    }
  }

  const totalCost = quantity * unitCost;

  const po = await prisma.purchaseOrder.create({
    data: {
      vendorId,
      status: PurchaseOrderStatus.ORDERED,
      items: {
        create: [
          {
            itemId,
            quantity,
            unitCost,
            totalCost,
            requestId: requestId ?? null,
          },
        ],
      },
      invoice: { create: {} },
    },
    include: {
      vendor: true,
      items: { include: { item: true, request: true } },
      invoice: true,
    },
  });

  res.json(po);
});

const UpdateStatusSchema = z.object({
  status: z.nativeEnum(PurchaseOrderStatus),
  deliveryDate: z.string().datetime().optional(),
});

purchaseOrdersRouter.post("/:id/status", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = param(req, "id");
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!po) return res.status(404).json({ error: "PO not found" });

  const deliveryDate = parsed.data.deliveryDate ? new Date(parsed.data.deliveryDate) : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const po2 = await tx.purchaseOrder.update({
      where: { id: po.id },
      data: {
        status: parsed.data.status,
        deliveryDate: deliveryDate ?? (parsed.data.status === PurchaseOrderStatus.DELIVERED ? new Date() : undefined),
      },
      include: { items: true },
    });

    if (parsed.data.status === PurchaseOrderStatus.DELIVERED) {
      // Restock inventory for each item.
      for (const it of po2.items) {
        await tx.inventoryItem.update({
          where: { id: it.itemId },
          data: {
            totalStock: { increment: it.quantity },
            availableStock: { increment: it.quantity },
          },
        });

        // If item was created for a request, allocate now.
        if (it.requestId) {
          const ar = await tx.assetRequest.findUnique({ where: { id: it.requestId } });
          if (ar && ar.status === RequestStatus.APPROVED) {
            await tx.inventoryItem.update({
              where: { id: it.itemId },
              data: { availableStock: { decrement: ar.quantity } },
            });
            await tx.allocation.create({
              data: {
                userId: ar.employeeId,
                itemId: ar.itemId,
                quantity: ar.quantity,
                requestId: ar.id,
              },
            });
            await tx.assetRequest.update({
              where: { id: ar.id },
              data: { status: RequestStatus.FULFILLED, fulfilledAt: new Date() },
            });
          }
        }
      }
    }

    return po2;
  });

  const hydrated = await prisma.purchaseOrder.findUnique({
    where: { id: updated.id },
    include: { vendor: true, items: { include: { item: true, request: true } }, invoice: true },
  });

  res.json(hydrated);
});

