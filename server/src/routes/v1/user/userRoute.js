import express from "express";
import { protect, authorize } from "#middlewares/authMiddleware.js";
import { validate } from "#middlewares/validateMiddleware.js";
import { getMe, getUsers, updateMe } from "#controllers/user/userController.js";
import { updateMeSchema } from "#validations/user/userValidation.js";

export const userRouter = express.Router();

userRouter.get("/users/me", protect, getMe);
userRouter.patch("/users/me", protect, validate(updateMeSchema), updateMe);
userRouter.get("/users", protect, authorize("platform.user:read"), getUsers);
