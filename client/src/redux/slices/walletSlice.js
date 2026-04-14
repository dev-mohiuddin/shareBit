import { createSlice } from "@reduxjs/toolkit";
import {
  cancelMyWithdrawal as cancelMyWithdrawalApi,
  getAllDeposits as getAllDepositsApi,
  getAllWithdrawals as getAllWithdrawalsApi,
  getDeposits as getDepositsApi,
  getWallet as getWalletApi,
  getWithdrawals as getWithdrawalsApi,
  requestDeposit as requestDepositApi,
  requestWithdrawal as requestWithdrawalApi,
  updateDepositStatus as updateDepositStatusApi,
  updateWithdrawalStatus as updateWithdrawalStatusApi,
} from "@/lib/api/walletApi";
import { logout } from "@/redux/auth/authSlice";
import { createHandledAsyncThunk } from "@/redux/utils/createHandledAsyncThunk";
import {
  createRequestState,
  EMPTY_REQUEST_STATE,
  setFulfilledState,
  setPendingState,
  setRejectedState,
} from "@/redux/utils/requestState";

const createInitialState = () => ({
  queries: {
    wallet: createRequestState(),
    withdrawals: createRequestState(),
    allWithdrawals: createRequestState(),
    deposits: createRequestState(),
    allDeposits: createRequestState(),
  },
  mutations: {
    requestWithdrawal: createRequestState(),
    cancelMyWithdrawal: createRequestState(),
    updateWithdrawalStatus: createRequestState(),
    requestDeposit: createRequestState(),
    updateDepositStatus: createRequestState(),
  },
});

export const getWallet = createHandledAsyncThunk("wallet/getWallet", getWalletApi, {
  errorMessage: "Failed to load wallet",
});

export const getWithdrawals = createHandledAsyncThunk("wallet/getWithdrawals", getWithdrawalsApi, {
  errorMessage: "Failed to load withdrawals",
});

export const getAllWithdrawals = createHandledAsyncThunk(
  "wallet/getAllWithdrawals",
  getAllWithdrawalsApi,
  {
    errorMessage: "Failed to load all withdrawals",
  }
);

export const getDeposits = createHandledAsyncThunk("wallet/getDeposits", getDepositsApi, {
  errorMessage: "Failed to load deposits",
});

export const getAllDeposits = createHandledAsyncThunk(
  "wallet/getAllDeposits",
  getAllDepositsApi,
  {
    errorMessage: "Failed to load all deposits",
  }
);

export const requestWithdrawal = createHandledAsyncThunk(
  "wallet/requestWithdrawal",
  requestWithdrawalApi,
  {
    errorMessage: "Failed to request withdrawal",
  }
);

export const cancelMyWithdrawal = createHandledAsyncThunk(
  "wallet/cancelMyWithdrawal",
  cancelMyWithdrawalApi,
  {
    errorMessage: "Failed to cancel withdrawal",
  }
);

export const updateWithdrawalStatus = createHandledAsyncThunk(
  "wallet/updateWithdrawalStatus",
  updateWithdrawalStatusApi,
  {
    errorMessage: "Failed to update withdrawal status",
  }
);

export const requestDeposit = createHandledAsyncThunk("wallet/requestDeposit", requestDepositApi, {
  errorMessage: "Failed to submit deposit request",
});

export const updateDepositStatus = createHandledAsyncThunk(
  "wallet/updateDepositStatus",
  updateDepositStatusApi,
  {
    errorMessage: "Failed to update deposit status",
  }
);

const walletSlice = createSlice({
  name: "wallet",
  initialState: createInitialState(),
  reducers: {
    resetWalletMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getWallet.pending, (state) => {
        setPendingState(state.queries.wallet);
      })
      .addCase(getWallet.fulfilled, (state, action) => {
        setFulfilledState(state.queries.wallet, action.payload);
      })
      .addCase(getWallet.rejected, (state, action) => {
        setRejectedState(state.queries.wallet, action.payload || action.error, "Failed to load wallet");
      })
      .addCase(getWithdrawals.pending, (state) => {
        setPendingState(state.queries.withdrawals);
      })
      .addCase(getWithdrawals.fulfilled, (state, action) => {
        setFulfilledState(state.queries.withdrawals, action.payload);
      })
      .addCase(getWithdrawals.rejected, (state, action) => {
        setRejectedState(
          state.queries.withdrawals,
          action.payload || action.error,
          "Failed to load withdrawals"
        );
      })
      .addCase(getAllWithdrawals.pending, (state) => {
        setPendingState(state.queries.allWithdrawals);
      })
      .addCase(getAllWithdrawals.fulfilled, (state, action) => {
        setFulfilledState(state.queries.allWithdrawals, action.payload);
      })
      .addCase(getAllWithdrawals.rejected, (state, action) => {
        setRejectedState(
          state.queries.allWithdrawals,
          action.payload || action.error,
          "Failed to load all withdrawals"
        );
      })
      .addCase(getDeposits.pending, (state) => {
        setPendingState(state.queries.deposits);
      })
      .addCase(getDeposits.fulfilled, (state, action) => {
        setFulfilledState(state.queries.deposits, action.payload);
      })
      .addCase(getDeposits.rejected, (state, action) => {
        setRejectedState(
          state.queries.deposits,
          action.payload || action.error,
          "Failed to load deposits"
        );
      })
      .addCase(getAllDeposits.pending, (state) => {
        setPendingState(state.queries.allDeposits);
      })
      .addCase(getAllDeposits.fulfilled, (state, action) => {
        setFulfilledState(state.queries.allDeposits, action.payload);
      })
      .addCase(getAllDeposits.rejected, (state, action) => {
        setRejectedState(
          state.queries.allDeposits,
          action.payload || action.error,
          "Failed to load all deposits"
        );
      })
      .addCase(requestWithdrawal.pending, (state) => {
        setPendingState(state.mutations.requestWithdrawal, { keepData: false });
      })
      .addCase(requestWithdrawal.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.requestWithdrawal, action.payload);
      })
      .addCase(requestWithdrawal.rejected, (state, action) => {
        setRejectedState(
          state.mutations.requestWithdrawal,
          action.payload || action.error,
          "Failed to request withdrawal"
        );
      })
      .addCase(cancelMyWithdrawal.pending, (state) => {
        setPendingState(state.mutations.cancelMyWithdrawal, { keepData: false });
      })
      .addCase(cancelMyWithdrawal.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.cancelMyWithdrawal, action.payload);
      })
      .addCase(cancelMyWithdrawal.rejected, (state, action) => {
        setRejectedState(
          state.mutations.cancelMyWithdrawal,
          action.payload || action.error,
          "Failed to cancel withdrawal"
        );
      })
      .addCase(updateWithdrawalStatus.pending, (state) => {
        setPendingState(state.mutations.updateWithdrawalStatus, { keepData: false });
      })
      .addCase(updateWithdrawalStatus.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateWithdrawalStatus, action.payload);
      })
      .addCase(updateWithdrawalStatus.rejected, (state, action) => {
        setRejectedState(
          state.mutations.updateWithdrawalStatus,
          action.payload || action.error,
          "Failed to update withdrawal status"
        );
      })
      .addCase(requestDeposit.pending, (state) => {
        setPendingState(state.mutations.requestDeposit, { keepData: false });
      })
      .addCase(requestDeposit.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.requestDeposit, action.payload);
      })
      .addCase(requestDeposit.rejected, (state, action) => {
        setRejectedState(
          state.mutations.requestDeposit,
          action.payload || action.error,
          "Failed to submit deposit request"
        );
      })
      .addCase(updateDepositStatus.pending, (state) => {
        setPendingState(state.mutations.updateDepositStatus, { keepData: false });
      })
      .addCase(updateDepositStatus.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateDepositStatus, action.payload);
      })
      .addCase(updateDepositStatus.rejected, (state, action) => {
        setRejectedState(
          state.mutations.updateDepositStatus,
          action.payload || action.error,
          "Failed to update deposit status"
        );
      });
  },
});

export const selectWalletQueryState = (state) => state.wallet?.queries?.wallet || EMPTY_REQUEST_STATE;
export const selectWithdrawalsQueryState = (state) =>
  state.wallet?.queries?.withdrawals || EMPTY_REQUEST_STATE;
export const selectAllWithdrawalsQueryState = (state) =>
  state.wallet?.queries?.allWithdrawals || EMPTY_REQUEST_STATE;
export const selectDepositsQueryState = (state) =>
  state.wallet?.queries?.deposits || EMPTY_REQUEST_STATE;
export const selectAllDepositsQueryState = (state) =>
  state.wallet?.queries?.allDeposits || EMPTY_REQUEST_STATE;

export const selectWalletMutationState = (state, mutationName) =>
  state.wallet?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetWalletMutation } = walletSlice.actions;
export default walletSlice.reducer;
