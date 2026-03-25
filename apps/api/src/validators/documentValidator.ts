import { z } from "zod";

function stringifyFormData(record: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value === undefined || value === null) {
      out[key] = "";
    } else if (typeof value === "object" && value !== null && "format" in (value as object)) {
      // dayjs or similar from JSON — treat as string if possible
      out[key] = String(value);
    } else {
      out[key] = String(value);
    }
  }
  return out;
}

export const generateDocumentSchema = z.object({
  templateId: z.coerce.number().int().positive(),
  caseId: z.coerce.number().int().positive().optional().nullable(),
  formData: z
    .record(z.string(), z.unknown())
    .optional()
    .default({})
    .transform(stringifyFormData),
});
