import { AssetProfit } from "#models/assetProfitModel.js";
import { ProfitLedger } from "#models/profitLedgerModel.js";
import { getCompanyUser } from "#utils/companyUtil.js";

export const getProfitSummary = async ({ monthKey } = {}) => {
  const profitFilter = monthKey ? { monthKey } : {};
  const ledgerFilter = monthKey ? { ledgerDate: new RegExp(`^${monthKey}`) } : {};

  const [inputProfitAgg, distributedAgg, companyUser] = await Promise.all([
    AssetProfit.aggregate([
      { $match: profitFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    ProfitLedger.aggregate([
      { $match: ledgerFilter },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    getCompanyUser(),
  ]);

  let companyProfit = 0;
  if (companyUser) {
    const companyAgg = await ProfitLedger.aggregate([
      { $match: { ...ledgerFilter, userId: companyUser._id } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    companyProfit = companyAgg?.[0]?.total || 0;
  }

  const totalInput = inputProfitAgg?.[0]?.total || 0;
  const totalDistributed = distributedAgg?.[0]?.total || 0;

  return {
    monthKey: monthKey || null,
    totalInput,
    totalDistributed,
    companyProfit,
    userProfit: Math.max(totalDistributed - companyProfit, 0),
  };
};
