import { catchAsync } from "#utils/catchAsync.js";
import {
  listUsers,
  getUserById,
  updateUser,
  createInvestorByAdmin as createInvestorByAdminService,
} from "#services/user/userService.js";

export const getMe = catchAsync(async (req, res) => {
  const user = await getUserById(req.user.id || req.user._id);
  res.success({ data: user, message: "User profile" });
});

export const getUsers = catchAsync(async (req, res) => {
  const users = await listUsers();
  res.success({ data: users, message: "Users retrieved" });
});

export const updateMe = catchAsync(async (req, res) => {
  const userId = req.user.id || req.user._id;
  const updated = await updateUser(userId, req.body);
  res.success({ data: updated, message: "Profile updated" });
});

export const createInvestorByAdmin = catchAsync(async (req, res) => {
  const user = await createInvestorByAdminService(req.body, req.user);
  res.success({
    data: user,
    message: "Investor account created successfully",
    statusCode: 201,
  });
});
