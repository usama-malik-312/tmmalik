import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { calculateFees } from "../utils/feeCalculator.js";

const feeSchema = z.object({
  amount: z.coerce.number().positive(),
  type: z.string().min(1).default("general"),
});

const whatsappSchema = z.object({
  phone: z.string().min(5),
  message: z.string().min(1),
});

export async function calculateFeesEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = feeSchema.parse(req.body);
    const breakdown = calculateFees(payload.amount, payload.type);
    res.json({ success: true, data: { amount: payload.amount, type: payload.type, ...breakdown } });
  } catch (error) {
    next(error);
  }
}

export async function sendWhatsappMock(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = whatsappSchema.parse(req.body);
    res.json({
      success: true,
      data: {
        status: "mock_sent",
        phone: payload.phone,
        message: payload.message,
      },
    });
  } catch (error) {
    next(error);
  }
}
