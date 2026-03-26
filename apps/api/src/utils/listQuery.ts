import type { Request } from "express";

export type ParsedListQuery = {
  page: number;
  pageSize: number;
  skip: number;
  search: string;
};

export function parseListQuery(req: Request): ParsedListQuery {
  const page = Math.max(1, Number.parseInt(String(req.query.page ?? "1"), 10) || 1);
  const rawSize = Number.parseInt(String(req.query.pageSize ?? "10"), 10) || 10;
  const pageSize = Math.min(100, Math.max(1, rawSize));
  const search = String(req.query.search ?? "").trim();
  return { page, pageSize, skip: (page - 1) * pageSize, search };
}

export function optionalQueryString(req: Request, key: string): string | undefined {
  const v = req.query[key];
  if (v === undefined || v === null) return undefined;
  const s = Array.isArray(v) ? String(v[0]) : String(v);
  const t = s.trim();
  return t.length ? t : undefined;
}
