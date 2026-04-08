import { PlatformRole } from "#models/roleModel.js";
import { PLATFORM_ROLES } from "#constants/roles.js";

export const initPlatformRoles = async () => {
  try {
    await Promise.all(
      PLATFORM_ROLES.map(async (roleData) => {
        const existingRole = await PlatformRole.findOne({ name: roleData.name });
        if (!existingRole) {
          await PlatformRole.create(roleData);
          console.log(`Platform Role created: ${roleData.name}`);
          return;
        }

        if (roleData.isDefault && !existingRole.isDefault) {
          existingRole.isDefault = true;
          await existingRole.save();
          console.log(`Platform Role updated as default: ${roleData.name}`);
        }
      })
    );

    console.log("Platform roles initialization check complete.");
  } catch (err) {
    console.error("Critical Error initializing platform roles:", err.message);
    process.exit(1);
  }
};
