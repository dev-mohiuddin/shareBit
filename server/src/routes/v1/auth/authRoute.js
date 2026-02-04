import express from "express";
import {
  signIn,
  signUp,
  verifyOtp,
  resendOtp,
  refreshToken,
} from "#controllers/auth/authController.js";
import { validate } from "#middlewares/validateMiddleware.js";
import {
  signInSchema,
  signUpSchema,
  verifyOtpSchema,
  resendOtpSchema,
  refreshTokenSchema,
} from "#validations/auth/authValidation.js";

export const authRouter = express.Router();

authRouter.post("/auth/login", validate(signInSchema), signIn);
authRouter.post("/auth/register", validate(signUpSchema), signUp);
authRouter.post("/auth/verify-otp", validate(verifyOtpSchema), verifyOtp);
authRouter.post("/auth/resend-otp", validate(resendOtpSchema), resendOtp);
authRouter.post("/auth/refresh-token", validate(refreshTokenSchema), refreshToken);
