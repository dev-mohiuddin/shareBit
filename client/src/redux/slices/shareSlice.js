import { createSlice } from "@reduxjs/toolkit";
import {
  assignShare as assignShareApi,
  getMyShareAccounts as getMyShareAccountsApi,
  getShareAccountsByAsset as getShareAccountsByAssetApi,
  getSharePayments as getSharePaymentsApi,
  recordSharePayment as recordSharePaymentApi,
} from "@/lib/api/shareApi";
import { logout } from "@/redux/auth/authSlice";
import { createHandledAsyncThunk } from "@/redux/utils/createHandledAsyncThunk";
import {
  createRequestState,
  EMPTY_REQUEST_STATE,
  setFulfilledState,
  setPendingState,
  setRejectedState,
} from "@/redux/utils/requestState";
import { serializeArg } from "@/redux/utils/serializeArg";

export const buildShareAccountsByAssetKey = (assetId) => serializeArg(assetId || "");
export const buildSharePaymentsKey = (shareAccountId) => serializeArg(shareAccountId || "");

const createInitialState = () => ({
  queries: {
    shareAccountsByAssetByKey: {},
    sharePaymentsByAccountKey: {},
    myShareAccounts: createRequestState(),
  },
  mutations: {
    assignShare: createRequestState(),
    recordSharePayment: createRequestState(),
  },
});

const getOrCreateMapRequestState = (map, key) => {
  if (!map[key]) {
    map[key] = createRequestState();
  }
  return map[key];
};

export const getShareAccountsByAsset = createHandledAsyncThunk(
  "shares/getShareAccountsByAsset",
  getShareAccountsByAssetApi,
  {
    errorMessage: "Failed to load share accounts",
  }
);

export const assignShare = createHandledAsyncThunk("shares/assignShare", assignShareApi, {
  errorMessage: "Failed to assign share",
});

export const recordSharePayment = createHandledAsyncThunk(
  "shares/recordSharePayment",
  recordSharePaymentApi,
  {
    errorMessage: "Failed to record share payment",
  }
);

export const getSharePayments = createHandledAsyncThunk(
  "shares/getSharePayments",
  getSharePaymentsApi,
  {
    errorMessage: "Failed to load share payments",
  }
);

export const getMyShareAccounts = createHandledAsyncThunk(
  "shares/getMyShareAccounts",
  getMyShareAccountsApi,
  {
    errorMessage: "Failed to load my share accounts",
  }
);

const shareSlice = createSlice({
  name: "shares",
  initialState: createInitialState(),
  reducers: {
    resetShareMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getShareAccountsByAsset.pending, (state, action) => {
        const key = buildShareAccountsByAssetKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.shareAccountsByAssetByKey, key);
        setPendingState(target);
      })
      .addCase(getShareAccountsByAsset.fulfilled, (state, action) => {
        const key = buildShareAccountsByAssetKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.shareAccountsByAssetByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getShareAccountsByAsset.rejected, (state, action) => {
        const key = buildShareAccountsByAssetKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.shareAccountsByAssetByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load share accounts");
      })
      .addCase(getSharePayments.pending, (state, action) => {
        const key = buildSharePaymentsKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.sharePaymentsByAccountKey, key);
        setPendingState(target);
      })
      .addCase(getSharePayments.fulfilled, (state, action) => {
        const key = buildSharePaymentsKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.sharePaymentsByAccountKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getSharePayments.rejected, (state, action) => {
        const key = buildSharePaymentsKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.sharePaymentsByAccountKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load share payments");
      })
      .addCase(getMyShareAccounts.pending, (state) => {
        setPendingState(state.queries.myShareAccounts);
      })
      .addCase(getMyShareAccounts.fulfilled, (state, action) => {
        setFulfilledState(state.queries.myShareAccounts, action.payload);
      })
      .addCase(getMyShareAccounts.rejected, (state, action) => {
        setRejectedState(
          state.queries.myShareAccounts,
          action.payload || action.error,
          "Failed to load my share accounts"
        );
      })
      .addCase(assignShare.pending, (state) => {
        setPendingState(state.mutations.assignShare, { keepData: false });
      })
      .addCase(assignShare.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.assignShare, action.payload);
      })
      .addCase(assignShare.rejected, (state, action) => {
        setRejectedState(state.mutations.assignShare, action.payload || action.error, "Failed to assign share");
      })
      .addCase(recordSharePayment.pending, (state) => {
        setPendingState(state.mutations.recordSharePayment, { keepData: false });
      })
      .addCase(recordSharePayment.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.recordSharePayment, action.payload);
      })
      .addCase(recordSharePayment.rejected, (state, action) => {
        setRejectedState(
          state.mutations.recordSharePayment,
          action.payload || action.error,
          "Failed to record share payment"
        );
      });
  },
});

export const selectShareAccountsByAssetQueryState = (state, key) =>
  state.shares?.queries?.shareAccountsByAssetByKey?.[key] || EMPTY_REQUEST_STATE;
export const selectSharePaymentsQueryState = (state, key) =>
  state.shares?.queries?.sharePaymentsByAccountKey?.[key] || EMPTY_REQUEST_STATE;
export const selectMyShareAccountsQueryState = (state) =>
  state.shares?.queries?.myShareAccounts || EMPTY_REQUEST_STATE;

export const selectShareMutationState = (state, mutationName) =>
  state.shares?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetShareMutation } = shareSlice.actions;
export default shareSlice.reducer;
