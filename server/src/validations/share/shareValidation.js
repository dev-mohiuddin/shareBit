import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/);

export const listShareAccountsSchema = z.object({
  params: z.object({
    assetId: objectId,
  }),
});

export const assignShareSchema = z.object({
  params: z.object({
    shareAccountId: objectId,
  }),
  body: z.object({
    userId: objectId,
    assignedAt: z.string().datetime().optional(),
  }),
});

export const recordSharePaymentSchema = z.object({
  params: z.object({
    shareAccountId: objectId,
  }),
  body: z.object({
    amount: z.number().min(0.01),
    paidAt: z.string().datetime().optional(),
    userId: objectId.optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const listSharePaymentsSchema = z.object({
  params: z.object({
    shareAccountId: objectId,
  }),
});
