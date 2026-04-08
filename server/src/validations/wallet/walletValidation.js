import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const requestWithdrawalSchema = z.object({
  body: z.object({
    amount: z.number().min(1),
    method: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateWithdrawalStatusSchema = z.object({
  params: z.object({
    withdrawalId: objectId,
  }),
  body: z.object({
    status: z.enum(["approved", "rejected", "paid"]),
    reason: z.string().trim().optional(),
  }),
});
