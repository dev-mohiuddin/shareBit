import {
  getAllUsers,
  createUser,
  findUserByEmail,
  updateUser as updateUserRepo,
  findUserById,
} from "#repositories/userRepository.js";
import { findDefaultRole, findRoleByName } from "#repositories/roleRepository.js";
import { createWallet } from "#repositories/walletRepository.js";
import { logAudit } from "#utils/auditLogger.js";
import { throwError } from "#utils/throwErrorUtil.js";

const buildUserResponse = (user) => ({
  _id: user._id,
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
  email: user.email,
  phone: user.phone || "",
  country: user.country || "",
  role: user.roleId?._id || user.roleId,
  roleName: user.roleId?.name,
  permissions: user.roleId?.permissions || [],
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const resolveInvestorRole = async () => {
  return (
    (await findRoleByName("Investor")) ||
    (await findDefaultRole()) ||
    (await findRoleByName("User"))
  );
};

export const listUsers = async () => {
  return getAllUsers();
};

export const getUserById = async (id) => {
  const user = await findUserById(id, { populateRole: true });
  if (!user) throwError("User not found", 404);
  return user;
};

export const updateUser = async (id, data) => {
  const user = await updateUserRepo(id, data);
  if (!user) throwError("User not found", 404);
  return user;
};

export const createInvestorByAdmin = async (data, actor) => {
  const email = data.email.trim().toLowerCase();
  const existingUser = await findUserByEmail(email);
  if (existingUser) throwError("Email already exists", 409);

  const role = await resolveInvestorRole();
  if (!role) throwError("Investor role not found", 500);

  const created = await createUser({
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    email,
    password: data.password,
    phone: data.phone?.trim() || undefined,
    country: data.country?.trim() || undefined,
    roleId: role._id,
    isVerified: true,
    isActive: true,
    otpCode: null,
    otpExpiry: null,
    otpStatus: "verified",
  });

  await createWallet({ userId: created._id, balance: 0, currency: "USD" });

  const user = await findUserById(created._id, { populateRole: true });
  if (!user) throwError("Failed to load created user", 500);

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: "user.create",
    entity: "PlatformUser",
    entityId: user._id,
    after: user.toObject(),
    metadata: { source: "admin.investor.create" },
  });

  return buildUserResponse(user);
};
