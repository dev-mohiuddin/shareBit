import { PlatformUser } from "#models/userModel.js";

export const findUserById = async (id, { populateRole = false } = {}) => {
  const query = PlatformUser.findById(id);
  if (populateRole) {
    query.populate({
      path: "roleId",
      select: "_id name permissions hierarchy",
      strictPopulate: false,
    });
  }
  return query.exec();
};

export const findUserByEmail = async (
  email,
  { populateRole = false, includeOtp = false } = {}
) => {
  const query = PlatformUser.findOne({ email });
  if (includeOtp) {
    query.select("+otpCode");
  }
  if (populateRole) {
    query.populate({
      path: "roleId",
      select: "_id name permissions hierarchy",
      strictPopulate: false,
    });
  }
  return query.exec();
};

export const getAllUsers = async () => {
  return PlatformUser.find()
    .populate({
      path: "roleId",
      select: "_id name permissions hierarchy",
      strictPopulate: false,
    })
    .exec();
};

export const createUser = async (data) => {
  return PlatformUser.create(data);
};

export const updateUser = async (id, data) => {
  return PlatformUser.findByIdAndUpdate(id, data, { new: true }).populate(
    "roleId"
  );
};

export const deleteUser = async (id) => {
  return PlatformUser.findByIdAndDelete(id);
};
