import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  // Stored as: 11111-1111111-1 (digits only except for the two dashes).
  // Digits count is 13 excluding dashes.
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d$/, "CNIC must be in format 11111-1111111-1"),
  phone: z.string().min(7),
  address: z.string().min(5),
  notes: z.string().optional(),
});
