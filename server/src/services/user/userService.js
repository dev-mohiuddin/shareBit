import {
  getAllUsers,
  updateUser as updateUserRepo,
  findUserById,
} from "#repositories/userRepository.js";
import { throwError } from "#utils/throwErrorUtil.js";

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
