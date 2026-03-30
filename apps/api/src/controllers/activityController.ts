import { NextFunction, Request, Response } from "express";
import * as activityService from "../services/activityService.js";

export async function getRecentActivities(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.query.limit;
    const n = typeof raw === "string" ? Number(raw) : NaN;
    const limit = Number.isFinite(n) && n > 0 ? n : 50;
    const items = await activityService.getRecentActivities(limit);
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
}
