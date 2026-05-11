import type { Request } from "express";

export function param(req: Request, name: string): string {
  const raw = (req.params as any)?.[name] as string | string[] | undefined;
  if (!raw) return "";
  return Array.isArray(raw) ? raw[0] : raw;
}

