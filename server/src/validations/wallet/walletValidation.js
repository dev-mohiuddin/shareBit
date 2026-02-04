import { z } from "zod";

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z.number().min(1),
    method: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  }),
});
