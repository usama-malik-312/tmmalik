import { z } from "zod";

export const templateFieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  section: z.enum(["client", "transaction", "general"]).optional(),
  input: z.enum(["text", "textarea", "date"]).optional(),
});

export const templateSchema = z.object({
  name: z.string().min(2),
  content: z.string().min(10),
  fields: z.array(templateFieldSchema).min(1),
});
