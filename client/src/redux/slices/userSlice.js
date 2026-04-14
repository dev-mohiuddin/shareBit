import { createSlice } from "@reduxjs/toolkit";
import {
  getMe as getMeApi,
  getMyDocuments as getMyDocumentsApi,
  getMyInvestorDashboardSnapshot as getMyInvestorDashboardSnapshotApi,
  getMyTransactions as getMyTransactionsApi,
  submitMyProfileForApproval as submitMyProfileForApprovalApi,
  updateMe as updateMeApi,
  uploadMyDocument as uploadMyDocumentApi,
} from "@/lib/api/userApi";
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

export const buildMyTransactionsQueryKey = (params) => serializeArg(params || {});

const createInitialState = () => ({
  queries: {
    me: createRequestState(),
    myInvestorDashboardSnapshot: createRequestState(),
    myDocuments: createRequestState(),
    myTransactionsByKey: {},
  },
  mutations: {
    updateMe: createRequestState(),
    submitMyProfileForApproval: createRequestState(),
    uploadMyDocument: createRequestState(),
  },
});

const getOrCreateMapRequestState = (map, key) => {
  if (!map[key]) {
    map[key] = createRequestState();
  }
  return map[key];
};

export const getMe = createHandledAsyncThunk("users/getMe", getMeApi, {
  errorMessage: "Failed to load profile",
});

export const updateMe = createHandledAsyncThunk("users/updateMe", updateMeApi, {
  errorMessage: "Failed to update profile",
});

export const getMyInvestorDashboardSnapshot = createHandledAsyncThunk(
  "users/getMyInvestorDashboardSnapshot",
  getMyInvestorDashboardSnapshotApi,
  {
    errorMessage: "Failed to load dashboard snapshot",
  }
);

export const getMyTransactions = createHandledAsyncThunk(
  "users/getMyTransactions",
  getMyTransactionsApi,
  {
    errorMessage: "Failed to load transactions",
  }
);

export const submitMyProfileForApproval = createHandledAsyncThunk(
  "users/submitMyProfileForApproval",
  submitMyProfileForApprovalApi,
  {
    errorMessage: "Failed to submit profile",
  }
);

export const getMyDocuments = createHandledAsyncThunk("users/getMyDocuments", getMyDocumentsApi, {
  errorMessage: "Failed to load documents",
});

export const uploadMyDocument = createHandledAsyncThunk(
  "users/uploadMyDocument",
  uploadMyDocumentApi,
  {
    errorMessage: "Failed to upload document",
  }
);

const userSlice = createSlice({
  name: "users",
  initialState: createInitialState(),
  reducers: {
    resetUserMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getMe.pending, (state) => {
        setPendingState(state.queries.me);
      })
      .addCase(getMe.fulfilled, (state, action) => {
        setFulfilledState(state.queries.me, action.payload);
      })
      .addCase(getMe.rejected, (state, action) => {
        setRejectedState(state.queries.me, action.payload || action.error, "Failed to load profile");
      })
      .addCase(getMyInvestorDashboardSnapshot.pending, (state) => {
        setPendingState(state.queries.myInvestorDashboardSnapshot);
      })
      .addCase(getMyInvestorDashboardSnapshot.fulfilled, (state, action) => {
        setFulfilledState(state.queries.myInvestorDashboardSnapshot, action.payload);
      })
      .addCase(getMyInvestorDashboardSnapshot.rejected, (state, action) => {
        setRejectedState(
          state.queries.myInvestorDashboardSnapshot,
          action.payload || action.error,
          "Failed to load dashboard snapshot"
        );
      })
      .addCase(getMyTransactions.pending, (state, action) => {
        const key = buildMyTransactionsQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.myTransactionsByKey, key);
        setPendingState(target);
      })
      .addCase(getMyTransactions.fulfilled, (state, action) => {
        const key = buildMyTransactionsQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.myTransactionsByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getMyTransactions.rejected, (state, action) => {
        const key = buildMyTransactionsQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.myTransactionsByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load transactions");
      })
      .addCase(getMyDocuments.pending, (state) => {
        setPendingState(state.queries.myDocuments);
      })
      .addCase(getMyDocuments.fulfilled, (state, action) => {
        setFulfilledState(state.queries.myDocuments, action.payload);
      })
      .addCase(getMyDocuments.rejected, (state, action) => {
        setRejectedState(state.queries.myDocuments, action.payload || action.error, "Failed to load documents");
      })
      .addCase(updateMe.pending, (state) => {
        setPendingState(state.mutations.updateMe, { keepData: false });
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateMe, action.payload);
        if (state.queries.me.data?.success && action.payload?.success) {
          state.queries.me.data = action.payload;
        }
      })
      .addCase(updateMe.rejected, (state, action) => {
        setRejectedState(state.mutations.updateMe, action.payload || action.error, "Failed to update profile");
      })
      .addCase(submitMyProfileForApproval.pending, (state) => {
        setPendingState(state.mutations.submitMyProfileForApproval, { keepData: false });
      })
      .addCase(submitMyProfileForApproval.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.submitMyProfileForApproval, action.payload);
      })
      .addCase(submitMyProfileForApproval.rejected, (state, action) => {
        setRejectedState(
          state.mutations.submitMyProfileForApproval,
          action.payload || action.error,
          "Failed to submit profile"
        );
      })
      .addCase(uploadMyDocument.pending, (state) => {
        setPendingState(state.mutations.uploadMyDocument, { keepData: false });
      })
      .addCase(uploadMyDocument.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.uploadMyDocument, action.payload);
      })
      .addCase(uploadMyDocument.rejected, (state, action) => {
        setRejectedState(
          state.mutations.uploadMyDocument,
          action.payload || action.error,
          "Failed to upload document"
        );
      });
  },
});

export const selectMeQueryState = (state) => state.users?.queries?.me || EMPTY_REQUEST_STATE;
export const selectMyInvestorDashboardSnapshotQueryState = (state) =>
  state.users?.queries?.myInvestorDashboardSnapshot || EMPTY_REQUEST_STATE;
export const selectMyDocumentsQueryState = (state) =>
  state.users?.queries?.myDocuments || EMPTY_REQUEST_STATE;
export const selectMyTransactionsQueryState = (state, key) =>
  state.users?.queries?.myTransactionsByKey?.[key] || EMPTY_REQUEST_STATE;

export const selectUserMutationState = (state, mutationName) =>
  state.users?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetUserMutation } = userSlice.actions;
export default userSlice.reducer;
