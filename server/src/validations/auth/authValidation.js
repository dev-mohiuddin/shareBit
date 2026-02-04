import { z } from "zod";

export const signInSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const signUpSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().min(6).optional().or(z.literal("")),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().min(10).optional(),
    })
    .optional()
    .default({}),
});
