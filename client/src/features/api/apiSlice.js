import { useCallback, useEffect, useMemo, useState } from "react";
import {
  login,
  refreshToken,
  register,
  resendOtp,
  resetAuthOperation,
  selectAuthOperation,
  verifyOtp,
} from "@/redux/auth/authSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  createAsset,
  getAssets,
  resetAssetMutation,
  selectAssetMutationState,
  selectAssetsQueryState,
} from "@/redux/slices/assetSlice";
import { getAuditLogs, selectAuditLogsQueryState } from "@/redux/slices/auditSlice";
import {
  buildInvestorQueryKey,
  createInvestorByAdmin,
  getInvestorDetails,
  getInvestorDocuments,
  getUsers,
  resetInvestorMutation,
  reviewInvestorApprovalByAdmin,
  selectInvestorDetailsQueryState,
  selectInvestorDocumentsQueryState,
  selectInvestorMutationState,
  selectUsersQueryState,
  updateInvestorByAdmin,
  updateInvestorStatusByAdmin,
  uploadInvestorDocumentByAdmin,
} from "@/redux/slices/investorSlice";
import {
  buildAssetExpensesKey,
  buildAssetMonthPnlKey,
  buildAssetProfitEntriesKey,
  buildProfitSummaryKey,
  createAssetExpense,
  createAssetExpenseCorrection,
  createAssetProfit,
  createAssetProfitAdjustment,
  createProfitLedgerAdjustment,
  getAssetExpenses,
  getAssetMonthPnl,
  getAssetProfitEntries,
  getProfitSummary,
  resetProfitMutation,
  selectAssetExpensesQueryState,
  selectAssetMonthPnlQueryState,
  selectAssetProfitEntriesQueryState,
  selectProfitMutationState,
  selectProfitSummaryQueryState,
} from "@/redux/slices/profitSlice";
import {
  assignShare,
  buildShareAccountsByAssetKey,
  buildSharePaymentsKey,
  getMyShareAccounts,
  getShareAccountsByAsset,
  getSharePayments,
  recordSharePayment,
  resetShareMutation,
  selectMyShareAccountsQueryState,
  selectShareAccountsByAssetQueryState,
  selectShareMutationState,
  selectSharePaymentsQueryState,
} from "@/redux/slices/shareSlice";
import {
  buildMyTransactionsQueryKey,
  getMe,
  getMyDocuments,
  getMyInvestorDashboardSnapshot,
  getMyTransactions,
  resetUserMutation,
  selectMeQueryState,
  selectMyDocumentsQueryState,
  selectMyInvestorDashboardSnapshotQueryState,
  selectMyTransactionsQueryState,
  selectUserMutationState,
  submitMyProfileForApproval,
  updateMe,
  uploadMyDocument,
} from "@/redux/slices/userSlice";
import {
  cancelMyWithdrawal,
  getAllDeposits,
  getAllWithdrawals,
  getDeposits,
  getWallet,
  getWithdrawals,
  requestDeposit,
  requestWithdrawal,
  resetWalletMutation,
  selectAllDepositsQueryState,
  selectAllWithdrawalsQueryState,
  selectDepositsQueryState,
  selectWalletMutationState,
  selectWalletQueryState,
  selectWithdrawalsQueryState,
  updateDepositStatus,
  updateWithdrawalStatus,
} from "@/redux/slices/walletSlice";
import { REQUEST_STATUS } from "@/redux/utils/requestState";

const EMPTY_OPTIONS = {};

const resolveNoArgOptions = (argOrOptions, maybeOptions) => {
  if (maybeOptions) {
    return maybeOptions;
  }

  if (
    argOrOptions &&
    typeof argOrOptions === "object" &&
    (Object.prototype.hasOwnProperty.call(argOrOptions, "skip") ||
      Object.prototype.hasOwnProperty.call(argOrOptions, "refetchOnMountOrArgChange"))
  ) {
    return argOrOptions;
  }

  return EMPTY_OPTIONS;
};

const toQueryResult = (requestState, refetch) => {
  const status = requestState?.status || REQUEST_STATUS.IDLE;
  const hasData = typeof requestState?.data !== "undefined";

  return {
    data: requestState?.data,
    error: requestState?.error || null,
    status,
    isLoading: status === REQUEST_STATUS.LOADING && !hasData,
    isFetching: status === REQUEST_STATUS.LOADING,
    isSuccess: status === REQUEST_STATUS.SUCCEEDED,
    isError: status === REQUEST_STATUS.FAILED,
    refetch,
  };
};

const toMutationResult = (requestState, reset) => {
  const status = requestState?.status || REQUEST_STATUS.IDLE;

  return {
    data: requestState?.data,
    error: requestState?.error || null,
    status,
    isLoading: status === REQUEST_STATUS.LOADING,
    isSuccess: status === REQUEST_STATUS.SUCCEEDED,
    isError: status === REQUEST_STATUS.FAILED,
    reset,
  };
};

const useThunkQuery = ({ arg, options = EMPTY_OPTIONS, thunk, selectRequestState, buildKey }) => {
  const dispatch = useAppDispatch();
  const skip = Boolean(options?.skip);
  const key = useMemo(() => buildKey(arg), [arg, buildKey]);
  const requestState = useAppSelector((state) => selectRequestState(state, key));

  const refetch = useCallback(() => dispatch(thunk(arg)), [dispatch, thunk, arg]);

  useEffect(() => {
    if (skip) return;
    if (requestState?.status === REQUEST_STATUS.IDLE) {
      dispatch(thunk(arg));
    }
  }, [dispatch, thunk, arg, key, skip, requestState?.status]);

  return useMemo(() => toQueryResult(requestState, refetch), [requestState, refetch]);
};

const useThunkMutation = ({ thunk, selectRequestState, resetAction, resetKey }) => {
  const dispatch = useAppDispatch();
  const requestState = useAppSelector(selectRequestState);

  const trigger = useCallback((payload) => dispatch(thunk(payload)), [dispatch, thunk]);

  const reset = useCallback(() => {
    if (resetAction && resetKey) {
      dispatch(resetAction(resetKey));
    }
  }, [dispatch, resetAction, resetKey]);

  return [trigger, toMutationResult(requestState, reset)];
};

const useThunkLazyQuery = ({ thunk, selectRequestState, buildKey }) => {
  const dispatch = useAppDispatch();
  const [lastArg, setLastArg] = useState(undefined);
  const key = useMemo(() => buildKey(lastArg), [buildKey, lastArg]);
  const requestState = useAppSelector((state) => selectRequestState(state, key));

  const trigger = useCallback(
    (nextArg) => {
      setLastArg(nextArg);
      return dispatch(thunk(nextArg));
    },
    [dispatch, thunk]
  );

  const refetch = useCallback(() => dispatch(thunk(lastArg)), [dispatch, thunk, lastArg]);

  return [
    trigger,
    {
      ...toQueryResult(requestState, refetch),
      isUninitialized: typeof lastArg === "undefined",
      originalArgs: lastArg,
    },
  ];
};

export const useLoginMutation = () =>
  useThunkMutation({
    thunk: login,
    selectRequestState: (state) => selectAuthOperation(state, "login"),
    resetAction: resetAuthOperation,
    resetKey: "login",
  });

export const useRegisterMutation = () =>
  useThunkMutation({
    thunk: register,
    selectRequestState: (state) => selectAuthOperation(state, "register"),
    resetAction: resetAuthOperation,
    resetKey: "register",
  });

export const useVerifyOtpMutation = () =>
  useThunkMutation({
    thunk: verifyOtp,
    selectRequestState: (state) => selectAuthOperation(state, "verifyOtp"),
    resetAction: resetAuthOperation,
    resetKey: "verifyOtp",
  });

export const useResendOtpMutation = () =>
  useThunkMutation({
    thunk: resendOtp,
    selectRequestState: (state) => selectAuthOperation(state, "resendOtp"),
    resetAction: resetAuthOperation,
    resetKey: "resendOtp",
  });

export const useRefreshTokenMutation = () =>
  useThunkMutation({
    thunk: refreshToken,
    selectRequestState: (state) => selectAuthOperation(state, "refreshToken"),
    resetAction: resetAuthOperation,
    resetKey: "refreshToken",
  });

export const useGetMeQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getMe,
    selectRequestState: (state) => selectMeQueryState(state),
    buildKey: () => "__me__",
  });
};

export const useUpdateMeMutation = () =>
  useThunkMutation({
    thunk: updateMe,
    selectRequestState: (state) => selectUserMutationState(state, "updateMe"),
    resetAction: resetUserMutation,
    resetKey: "updateMe",
  });

export const useGetMyInvestorDashboardSnapshotQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getMyInvestorDashboardSnapshot,
    selectRequestState: (state) => selectMyInvestorDashboardSnapshotQueryState(state),
    buildKey: () => "__dashboard_snapshot__",
  });
};

export const useGetMyTransactionsQuery = (params = {}, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: params,
    options,
    thunk: getMyTransactions,
    selectRequestState: (state, key) => selectMyTransactionsQueryState(state, key),
    buildKey: buildMyTransactionsQueryKey,
  });

export const useGetUsersQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getUsers,
    selectRequestState: (state) => selectUsersQueryState(state),
    buildKey: () => "__users__",
  });
};

export const useCreateInvestorByAdminMutation = () =>
  useThunkMutation({
    thunk: createInvestorByAdmin,
    selectRequestState: (state) => selectInvestorMutationState(state, "createInvestorByAdmin"),
    resetAction: resetInvestorMutation,
    resetKey: "createInvestorByAdmin",
  });

export const useGetInvestorDetailsQuery = (investorId, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: investorId,
    options,
    thunk: getInvestorDetails,
    selectRequestState: (state, key) => selectInvestorDetailsQueryState(state, key),
    buildKey: buildInvestorQueryKey,
  });

export const useUpdateInvestorByAdminMutation = () =>
  useThunkMutation({
    thunk: updateInvestorByAdmin,
    selectRequestState: (state) => selectInvestorMutationState(state, "updateInvestorByAdmin"),
    resetAction: resetInvestorMutation,
    resetKey: "updateInvestorByAdmin",
  });

export const useUpdateInvestorStatusByAdminMutation = () =>
  useThunkMutation({
    thunk: updateInvestorStatusByAdmin,
    selectRequestState: (state) => selectInvestorMutationState(state, "updateInvestorStatusByAdmin"),
    resetAction: resetInvestorMutation,
    resetKey: "updateInvestorStatusByAdmin",
  });

export const useReviewInvestorApprovalByAdminMutation = () =>
  useThunkMutation({
    thunk: reviewInvestorApprovalByAdmin,
    selectRequestState: (state) => selectInvestorMutationState(state, "reviewInvestorApprovalByAdmin"),
    resetAction: resetInvestorMutation,
    resetKey: "reviewInvestorApprovalByAdmin",
  });

export const useGetInvestorDocumentsQuery = (investorId, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: investorId,
    options,
    thunk: getInvestorDocuments,
    selectRequestState: (state, key) => selectInvestorDocumentsQueryState(state, key),
    buildKey: buildInvestorQueryKey,
  });

export const useUploadInvestorDocumentByAdminMutation = () =>
  useThunkMutation({
    thunk: uploadInvestorDocumentByAdmin,
    selectRequestState: (state) =>
      selectInvestorMutationState(state, "uploadInvestorDocumentByAdmin"),
    resetAction: resetInvestorMutation,
    resetKey: "uploadInvestorDocumentByAdmin",
  });

export const useSubmitMyProfileForApprovalMutation = () =>
  useThunkMutation({
    thunk: submitMyProfileForApproval,
    selectRequestState: (state) =>
      selectUserMutationState(state, "submitMyProfileForApproval"),
    resetAction: resetUserMutation,
    resetKey: "submitMyProfileForApproval",
  });

export const useGetMyDocumentsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getMyDocuments,
    selectRequestState: (state) => selectMyDocumentsQueryState(state),
    buildKey: () => "__my_documents__",
  });
};

export const useUploadMyDocumentMutation = () =>
  useThunkMutation({
    thunk: uploadMyDocument,
    selectRequestState: (state) => selectUserMutationState(state, "uploadMyDocument"),
    resetAction: resetUserMutation,
    resetKey: "uploadMyDocument",
  });

export const useGetAssetsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getAssets,
    selectRequestState: (state) => selectAssetsQueryState(state),
    buildKey: () => "__assets__",
  });
};

export const useCreateAssetMutation = () =>
  useThunkMutation({
    thunk: createAsset,
    selectRequestState: (state) => selectAssetMutationState(state, "createAsset"),
    resetAction: resetAssetMutation,
    resetKey: "createAsset",
  });

export const useGetShareAccountsByAssetQuery = (assetId, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: assetId,
    options,
    thunk: getShareAccountsByAsset,
    selectRequestState: (state, key) => selectShareAccountsByAssetQueryState(state, key),
    buildKey: buildShareAccountsByAssetKey,
  });

export const useAssignShareMutation = () =>
  useThunkMutation({
    thunk: assignShare,
    selectRequestState: (state) => selectShareMutationState(state, "assignShare"),
    resetAction: resetShareMutation,
    resetKey: "assignShare",
  });

export const useRecordSharePaymentMutation = () =>
  useThunkMutation({
    thunk: recordSharePayment,
    selectRequestState: (state) => selectShareMutationState(state, "recordSharePayment"),
    resetAction: resetShareMutation,
    resetKey: "recordSharePayment",
  });

export const useGetSharePaymentsQuery = (shareAccountId, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: shareAccountId,
    options,
    thunk: getSharePayments,
    selectRequestState: (state, key) => selectSharePaymentsQueryState(state, key),
    buildKey: buildSharePaymentsKey,
  });

export const useLazyGetSharePaymentsQuery = () =>
  useThunkLazyQuery({
    thunk: getSharePayments,
    selectRequestState: (state, key) => selectSharePaymentsQueryState(state, key),
    buildKey: buildSharePaymentsKey,
  });

export const useGetMyShareAccountsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getMyShareAccounts,
    selectRequestState: (state) => selectMyShareAccountsQueryState(state),
    buildKey: () => "__my_share_accounts__",
  });
};

export const useGetAuditLogsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getAuditLogs,
    selectRequestState: (state) => selectAuditLogsQueryState(state),
    buildKey: () => "__audit_logs__",
  });
};

export const useGetProfitSummaryQuery = (params, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: params,
    options,
    thunk: getProfitSummary,
    selectRequestState: (state, key) => selectProfitSummaryQueryState(state, key),
    buildKey: buildProfitSummaryKey,
  });

export const useCreateAssetProfitMutation = () =>
  useThunkMutation({
    thunk: createAssetProfit,
    selectRequestState: (state) => selectProfitMutationState(state, "createAssetProfit"),
    resetAction: resetProfitMutation,
    resetKey: "createAssetProfit",
  });

export const useCreateAssetProfitAdjustmentMutation = () =>
  useThunkMutation({
    thunk: createAssetProfitAdjustment,
    selectRequestState: (state) =>
      selectProfitMutationState(state, "createAssetProfitAdjustment"),
    resetAction: resetProfitMutation,
    resetKey: "createAssetProfitAdjustment",
  });

export const useGetAssetProfitEntriesQuery = (params, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: params,
    options,
    thunk: getAssetProfitEntries,
    selectRequestState: (state, key) => selectAssetProfitEntriesQueryState(state, key),
    buildKey: buildAssetProfitEntriesKey,
  });

export const useGetAssetMonthPnlQuery = (params, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: params,
    options,
    thunk: getAssetMonthPnl,
    selectRequestState: (state, key) => selectAssetMonthPnlQueryState(state, key),
    buildKey: buildAssetMonthPnlKey,
  });

export const useGetAssetExpensesQuery = (params, options = EMPTY_OPTIONS) =>
  useThunkQuery({
    arg: params,
    options,
    thunk: getAssetExpenses,
    selectRequestState: (state, key) => selectAssetExpensesQueryState(state, key),
    buildKey: buildAssetExpensesKey,
  });

export const useCreateAssetExpenseMutation = () =>
  useThunkMutation({
    thunk: createAssetExpense,
    selectRequestState: (state) => selectProfitMutationState(state, "createAssetExpense"),
    resetAction: resetProfitMutation,
    resetKey: "createAssetExpense",
  });

export const useCreateAssetExpenseCorrectionMutation = () =>
  useThunkMutation({
    thunk: createAssetExpenseCorrection,
    selectRequestState: (state) =>
      selectProfitMutationState(state, "createAssetExpenseCorrection"),
    resetAction: resetProfitMutation,
    resetKey: "createAssetExpenseCorrection",
  });

export const useCreateProfitLedgerAdjustmentMutation = () =>
  useThunkMutation({
    thunk: createProfitLedgerAdjustment,
    selectRequestState: (state) =>
      selectProfitMutationState(state, "createProfitLedgerAdjustment"),
    resetAction: resetProfitMutation,
    resetKey: "createProfitLedgerAdjustment",
  });

export const useGetWalletQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getWallet,
    selectRequestState: (state) => selectWalletQueryState(state),
    buildKey: () => "__wallet__",
  });
};

export const useGetWithdrawalsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getWithdrawals,
    selectRequestState: (state) => selectWithdrawalsQueryState(state),
    buildKey: () => "__withdrawals__",
  });
};

export const useGetAllWithdrawalsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getAllWithdrawals,
    selectRequestState: (state) => selectAllWithdrawalsQueryState(state),
    buildKey: () => "__all_withdrawals__",
  });
};

export const useGetDepositsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getDeposits,
    selectRequestState: (state) => selectDepositsQueryState(state),
    buildKey: () => "__deposits__",
  });
};

export const useGetAllDepositsQuery = (argOrOptions, maybeOptions) => {
  const options = resolveNoArgOptions(argOrOptions, maybeOptions);
  return useThunkQuery({
    arg: undefined,
    options,
    thunk: getAllDeposits,
    selectRequestState: (state) => selectAllDepositsQueryState(state),
    buildKey: () => "__all_deposits__",
  });
};

export const useRequestWithdrawalMutation = () =>
  useThunkMutation({
    thunk: requestWithdrawal,
    selectRequestState: (state) => selectWalletMutationState(state, "requestWithdrawal"),
    resetAction: resetWalletMutation,
    resetKey: "requestWithdrawal",
  });

export const useCancelMyWithdrawalMutation = () =>
  useThunkMutation({
    thunk: cancelMyWithdrawal,
    selectRequestState: (state) => selectWalletMutationState(state, "cancelMyWithdrawal"),
    resetAction: resetWalletMutation,
    resetKey: "cancelMyWithdrawal",
  });

export const useRequestDepositMutation = () =>
  useThunkMutation({
    thunk: requestDeposit,
    selectRequestState: (state) => selectWalletMutationState(state, "requestDeposit"),
    resetAction: resetWalletMutation,
    resetKey: "requestDeposit",
  });

export const useUpdateWithdrawalStatusMutation = () =>
  useThunkMutation({
    thunk: updateWithdrawalStatus,
    selectRequestState: (state) =>
      selectWalletMutationState(state, "updateWithdrawalStatus"),
    resetAction: resetWalletMutation,
    resetKey: "updateWithdrawalStatus",
  });

export const useUpdateDepositStatusMutation = () =>
  useThunkMutation({
    thunk: updateDepositStatus,
    selectRequestState: (state) =>
      selectWalletMutationState(state, "updateDepositStatus"),
    resetAction: resetWalletMutation,
    resetKey: "updateDepositStatus",
  });
