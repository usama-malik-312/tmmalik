import { z } from "zod";

export const userSchema = z.object({
  fname: z.string().min(2),
  lname: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  address: z.string().min(3),
  userType: z.union([z.literal(-1), z.literal(1), z.literal(2)]),
});

