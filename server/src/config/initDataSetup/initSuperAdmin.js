import { PlatformUser } from "#models/userModel.js";
import { PlatformRole } from "#models/roleModel.js";
import { hashPassword } from "#utils/bcryptUtil.js";

export const initSuperAdmin = async () => {
  try {
    console.log("Initializing Super Admin...");
    const superAdminEmail =
      process.env.SUPER_ADMIN_EMAIL || "admin@sharebit.com";
    const superAdminPassword =
      process.env.SUPER_ADMIN_PASSWORD || "Admin@12345";

    console.log(`Super Admin Email: ${superAdminEmail}`);

    const existing = await PlatformUser.findOne({ email: superAdminEmail });
    if (existing) {
      console.log("SuperAdmin already exists.");
      return;
    }

    const superAdminRole = await PlatformRole.findOne({ name: "SuperAdmin" });
    if (!superAdminRole) {
      console.error("SuperAdmin role not found. Please initialize roles first.");
      return;
    }

    const hashedPassword = await hashPassword(superAdminPassword);
    const newSuperAdmin = await PlatformUser.create({
      email: superAdminEmail,
      password: hashedPassword,
      roleId: superAdminRole._id,
      isVerified: true,
    });

    console.log("SuperAdmin created successfully:", newSuperAdmin);
  } catch (error) {
    console.error("Error initializing Super Admin:", error);
  }
};
