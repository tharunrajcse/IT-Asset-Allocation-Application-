import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../lib/auth";
import { Role } from "@prisma/client";
import { param } from "../lib/params";

export const vendorsRouter = Router();

vendorsRouter.get("/", requireAuth, requireRole([Role.PROCUREMENT]), async (_req, res) => {
  const vendors = await prisma.vendor.findMany({ orderBy: { name: "asc" } });
  res.json(vendors);
});

const VendorSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

vendorsRouter.post("/", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = VendorSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const vendor = await prisma.vendor.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
    },
  });
  res.json(vendor);
});

vendorsRouter.put("/:id", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const parsed = VendorSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const id = param(req, "id");
  const vendor = await prisma.vendor.update({
    where: { id },
    data: {
      ...parsed.data,
      email: parsed.data.email === "" ? null : parsed.data.email,
      phone: parsed.data.phone === "" ? null : parsed.data.phone,
      address: parsed.data.address === "" ? null : parsed.data.address,
    },
  });
  res.json(vendor);
});

vendorsRouter.delete("/:id", requireAuth, requireRole([Role.PROCUREMENT]), async (req, res) => {
  const id = param(req, "id");
  await prisma.vendor.delete({ where: { id } });
  res.json({ ok: true });
});

