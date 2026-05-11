import jwt from "jsonwebtoken";
import { Role, type User } from "@prisma/client";
import { env } from "./env";
import type { Request, Response, NextFunction } from "express";
import { prisma } from "./prisma";

export type JwtUser = {
  sub: string;
  role: Role;
};

export function signToken(user: Pick<User, "id" | "role">) {
  const payload: JwtUser = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "7d" });
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Missing token" });
  const token = header.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtUser;
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) return res.status(401).json({ error: "Invalid token user" });
    (req as any).user = { id: user.id, role: user.role, email: user.email, name: user.name };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function requireRole(roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as { id: string; role: Role } | undefined;
    if (!u) return res.status(401).json({ error: "Unauthenticated" });
    if (!roles.includes(u.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function getAuthUser(req: Request) {
  return (req as any).user as { id: string; role: Role; email: string; name: string } | undefined;
}

