import { z } from "zod";

export const caseSchema = z.object({
  clientId: z.coerce.number().int().positive(),
  caseType: z.string().min(2),
  status: z.enum(["draft", "in_progress", "completed"]).optional(),
  propertyDetails: z.string().min(3),
  notes: z.string().min(1),
});
