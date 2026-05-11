import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { getAuthUser, requireAuth, requireRole } from "../lib/auth";
import { Role } from "@prisma/client";
import { param } from "../lib/params";

export const ticketsRouter = Router();

const CreateSchema = z.object({
  assetName: z.string().min(2),
  issueDescription: z.string().min(5),
});

ticketsRouter.post("/", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const ticket = await prisma.maintenanceTicket.create({
    data: { userId: u.id, assetName: parsed.data.assetName, issueDescription: parsed.data.issueDescription },
  });
  res.json(ticket);
});

ticketsRouter.get("/mine", requireAuth, requireRole([Role.EMPLOYEE]), async (req, res) => {
  const u = getAuthUser(req)!;
  const tickets = await prisma.maintenanceTicket.findMany({
    where: { userId: u.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
});

ticketsRouter.get("/", requireAuth, requireRole([Role.PROCUREMENT, Role.MANAGER]), async (_req, res) => {
  const tickets = await prisma.maintenanceTicket.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(tickets);
});

const UpdateStatusSchema = z.object({ status: z.string().min(2) });

ticketsRouter.post("/:id/status", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = UpdateStatusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const id = param(req, "id");
  const ticket = await prisma.maintenanceTicket.update({
    where: { id },
    data: { status: parsed.data.status },
  });
  res.json(ticket);
});

