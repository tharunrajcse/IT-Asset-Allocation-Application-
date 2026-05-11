import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getAuthUser, requireAuth, requireRole } from "../lib/auth";
import { Role } from "@prisma/client";

export const returnsRouter = Router();

returnsRouter.get("/assigned", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const allocations = await prisma.allocation.findMany({
    where: { userId: u.id, returnedAt: null },
    include: { item: true },
    orderBy: { allocatedAt: "desc" },
  });
  res.json(allocations);
});

const ReturnSchema = z.object({
  allocationId: z.string().min(1),
  note: z.string().optional(),
});

returnsRouter.post("/", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const parsed = ReturnSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const allocation = await prisma.allocation.findUnique({ where: { id: parsed.data.allocationId } });
  if (!allocation) return res.status(404).json({ error: "Allocation not found" });
  if (allocation.userId !== u.id) return res.status(403).json({ error: "Forbidden" });
  if (allocation.returnedAt) return res.status(409).json({ error: "Already returned" });

  const result = await prisma.$transaction(async (tx) => {
    const updatedAlloc = await tx.allocation.update({
      where: { id: allocation.id },
      data: { returnedAt: new Date() },
    });

    await tx.inventoryItem.update({
      where: { id: allocation.itemId },
      data: { availableStock: { increment: allocation.quantity } },
    });

    const ret = await tx.assetReturn.create({
      data: {
        userId: u.id,
        itemId: allocation.itemId,
        quantity: allocation.quantity,
        note: parsed.data.note ?? null,
      },
    });

    return { allocation: updatedAlloc, return: ret };
  });

  res.json(result);
});

