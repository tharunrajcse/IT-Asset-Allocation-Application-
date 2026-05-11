import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../lib/auth";
import { Role } from "@prisma/client";
import { param } from "../lib/params";

export const inventoryRouter = Router();

inventoryRouter.get("/", requireAuth, async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  res.json(items);
});

inventoryRouter.get("/low-stock", requireAuth, requireRole([Role.PROCUREMENT]), async (_req, res) => {
  const items = await prisma.inventoryItem.findMany({ orderBy: { availableStock: "asc" } });
  res.json(items.filter((i) => i.availableStock <= i.reorderLevel));
});

const UpsertSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  totalStock: z.number().int().nonnegative().optional(),
  availableStock: z.number().int().nonnegative().optional(),
  reorderLevel: z.number().int().positive().optional(),
});

inventoryRouter.post("/", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = UpsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const item = await prisma.inventoryItem.create({ data: parsed.data });
  res.json(item);
});

inventoryRouter.put("/:id", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = UpsertSchema.partial({ sku: true }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = param(req, "id");
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: parsed.data,
  });
  res.json(item);
});

inventoryRouter.delete("/:id", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const id = param(req, "id");
  await prisma.inventoryItem.delete({ where: { id } });
  res.json({ ok: true });
});

const AllocateSchema = z.object({
  userId: z.string().min(1),
  itemId: z.string().min(1),
  quantity: z.number().int().positive(),
});

inventoryRouter.post("/allocate", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = AllocateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { userId, itemId, quantity } = parsed.data;
  const result = await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUnique({ where: { id: itemId } });
    if (!item) return { error: "Item not found" as const };
    if (item.availableStock < quantity) return { error: "Insufficient stock" as const };

    await tx.inventoryItem.update({ where: { id: itemId }, data: { availableStock: { decrement: quantity } } });
    const allocation = await tx.allocation.create({ data: { userId, itemId, quantity } });
    return { allocation };
  });

  if ("error" in result) return res.status(409).json({ error: result.error });
  res.json(result.allocation);
});

