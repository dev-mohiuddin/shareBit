import { z } from "zod";

export const createInvestorByAdminSchema = z.object({
  body: z.object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().min(6).optional().or(z.literal("")),
    country: z.string().min(2).optional().or(z.literal("")),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      phone: z.string().optional(),
      country: z.string().optional(),
      profilePhoto: z
        .object({
          url: z.string().optional(),
          publicId: z.string().optional(),
        })
        .optional(),
      investorProfile: z
        .object({
          kycStatus: z.enum(["pending", "verified", "rejected"]).optional(),
          accreditationStatus: z
            .enum(["none", "accredited", "non_accredited"])
            .optional(),
          riskProfile: z.enum(["low", "medium", "high"]).optional(),
          onboardingCompleted: z.boolean().optional(),
        })
        .optional(),
      identityDocuments: z
        .array(
          z.object({
            docType: z.enum(["NID", "Driving License", "Passport"]),
            docNumber: z.string().min(1),
            fileUrl: z.string().url(),
          })
        )
        .optional(),
    })
    .refine((val) => Object.keys(val).length > 0, {
      message: "At least one field must be provided",
    }),
});
