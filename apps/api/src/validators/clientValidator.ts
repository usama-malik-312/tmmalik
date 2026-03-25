import { z } from "zod";

export const clientSchema = z.object({
  name: z.string().min(2),
  cnic: z.string().min(8),
  phone: z.string().min(7),
  address: z.string().min(5),
  notes: z.string().optional(),
});
