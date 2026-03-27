import { z } from "zod";

export const templateFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  section: z.enum(["client", "transaction", "general"]).optional(),
  input: z.enum(["text", "textarea", "date"]).optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1),
  // Urdu / RTL: allow any Unicode; length is code units (JS strings).
  content: z.string().min(1).max(500_000),
  language: z.enum(["en", "ur"]).optional().default("ur"),
  fields: z.array(templateFieldSchema).min(1),
});
