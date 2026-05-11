import { Router } from "express";
import { requireAuth, getAuthUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const meRouter = Router();

meRouter.get("/", requireAuth, async (req, res) => {
  const u = getAuthUser(req)!;
  const user = await prisma.user.findUnique({ where: { id: u.id } });
  if (!user) return res.status(404).json({ error: "Not found" });
  return res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
});

