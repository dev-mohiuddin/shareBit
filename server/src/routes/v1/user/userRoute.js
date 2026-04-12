import express from "express";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validate } from "#middlewares/validateMiddleware.js";
import {
  createInvestorByAdmin,
  getMe,
  getUsers,
  updateMe,
} from "#controllers/user/userController.js";
import {
  createInvestorByAdminSchema,
  updateMeSchema,
} from "#validations/user/userValidation.js";

export const userRouter = express.Router();

userRouter.get("/users/me", protect, getMe);
userRouter.patch("/users/me", protect, validate(updateMeSchema), updateMe);
userRouter.post(
  "/users/investors",
  protect,
  authorize("platform.user:create"),
  validate(createInvestorByAdminSchema),
  createInvestorByAdmin
);
userRouter.get("/users", protect, authorize("platform.user:read"), getUsers);
