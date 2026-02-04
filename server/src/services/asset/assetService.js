import {
  createAsset as createAssetRepo,
  getAssets,
  getAssetById,
  updateAssetById,
  deleteAssetById,
} from "#repositories/assetRepository.js";
import { throwError } from "#utils/throwErrorUtil.js";
import { logAudit } from "#utils/auditLogger.js";
import { createShareAccountsForAsset } from "#services/share/shareService.js";

export const createAsset = async (data, actor) => {
  const totalSharePrice = data.totalSharePrice ?? data.totalShares * data.sharePrice;
  const availableShares = data.availableShares ?? data.totalShares;

  const asset = await createAssetRepo({
    ...data,
    totalSharePrice,
    availableShares,
    createdBy: data.createdBy || actor.id || actor._id,
  });

  await createShareAccountsForAsset(asset, actor);

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: "asset.create",
    entity: "Asset",
    entityId: asset._id,
    after: asset.toObject(),
  });

  return asset;
};

export const listAssets = async () => {
  return getAssets();
};

export const getAsset = async (id) => {
  const asset = await getAssetById(id);
  if (!asset) throwError("Asset not found", 404);
  return asset;
};

export const updateAsset = async (id, data, actor) => {
  const before = await getAssetById(id);
  if (!before) throwError("Asset not found", 404);

  const updated = await updateAssetById(id, data);

  if (
    data.sharePrice !== undefined ||
    data.totalSharePrice !== undefined ||
    data.totalShares !== undefined
  ) {
    await logAudit({
      actorId: actor.id || actor._id,
      actorRole: actor.roleName,
      action: "asset.price.update",
      entity: "Asset",
      entityId: updated._id,
      before: {
        sharePrice: before.sharePrice,
        totalSharePrice: before.totalSharePrice,
        totalShares: before.totalShares,
      },
      after: {
        sharePrice: updated.sharePrice,
        totalSharePrice: updated.totalSharePrice,
        totalShares: updated.totalShares,
      },
    });
  }

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: "asset.update",
    entity: "Asset",
    entityId: updated._id,
    before: before.toObject(),
    after: updated.toObject(),
  });

  return updated;
};

export const deleteAsset = async (id, actor) => {
  const before = await getAssetById(id);
  if (!before) throwError("Asset not found", 404);

  await deleteAssetById(id);

  await logAudit({
    actorId: actor.id || actor._id,
    actorRole: actor.roleName,
    action: "asset.delete",
    entity: "Asset",
    entityId: before._id,
    before: before.toObject(),
  });
};
