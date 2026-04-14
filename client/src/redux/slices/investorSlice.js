import { createSlice } from "@reduxjs/toolkit";
import {
  createInvestorByAdmin as createInvestorByAdminApi,
  getInvestorDetails as getInvestorDetailsApi,
  getInvestorDocuments as getInvestorDocumentsApi,
  getUsers as getUsersApi,
  reviewInvestorApprovalByAdmin as reviewInvestorApprovalByAdminApi,
  updateInvestorByAdmin as updateInvestorByAdminApi,
  updateInvestorStatusByAdmin as updateInvestorStatusByAdminApi,
  uploadInvestorDocumentByAdmin as uploadInvestorDocumentByAdminApi,
} from "@/lib/api/investorApi";
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

export const buildInvestorQueryKey = (investorId) => serializeArg(investorId || "");

const createInitialState = () => ({
  queries: {
    users: createRequestState(),
    investorDetailsByKey: {},
    investorDocumentsByKey: {},
  },
  mutations: {
    createInvestorByAdmin: createRequestState(),
    updateInvestorByAdmin: createRequestState(),
    updateInvestorStatusByAdmin: createRequestState(),
    reviewInvestorApprovalByAdmin: createRequestState(),
    uploadInvestorDocumentByAdmin: createRequestState(),
  },
});

const getOrCreateMapRequestState = (map, key) => {
  if (!map[key]) {
    map[key] = createRequestState();
  }
  return map[key];
};

export const getUsers = createHandledAsyncThunk("investors/getUsers", getUsersApi, {
  errorMessage: "Failed to load users",
});

export const createInvestorByAdmin = createHandledAsyncThunk(
  "investors/createInvestorByAdmin",
  createInvestorByAdminApi,
  {
    errorMessage: "Failed to create investor",
  }
);

export const getInvestorDetails = createHandledAsyncThunk(
  "investors/getInvestorDetails",
  getInvestorDetailsApi,
  {
    errorMessage: "Failed to load investor details",
  }
);

export const updateInvestorByAdmin = createHandledAsyncThunk(
  "investors/updateInvestorByAdmin",
  updateInvestorByAdminApi,
  {
    errorMessage: "Failed to update investor",
  }
);

export const updateInvestorStatusByAdmin = createHandledAsyncThunk(
  "investors/updateInvestorStatusByAdmin",
  updateInvestorStatusByAdminApi,
  {
    errorMessage: "Failed to update investor status",
  }
);

export const reviewInvestorApprovalByAdmin = createHandledAsyncThunk(
  "investors/reviewInvestorApprovalByAdmin",
  reviewInvestorApprovalByAdminApi,
  {
    errorMessage: "Failed to review investor approval",
  }
);

export const getInvestorDocuments = createHandledAsyncThunk(
  "investors/getInvestorDocuments",
  getInvestorDocumentsApi,
  {
    errorMessage: "Failed to load investor documents",
  }
);

export const uploadInvestorDocumentByAdmin = createHandledAsyncThunk(
  "investors/uploadInvestorDocumentByAdmin",
  uploadInvestorDocumentByAdminApi,
  {
    errorMessage: "Failed to upload investor document",
  }
);

const investorSlice = createSlice({
  name: "investors",
  initialState: createInitialState(),
  reducers: {
    resetInvestorMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getUsers.pending, (state) => {
        setPendingState(state.queries.users);
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        setFulfilledState(state.queries.users, action.payload);
      })
      .addCase(getUsers.rejected, (state, action) => {
        setRejectedState(state.queries.users, action.payload || action.error, "Failed to load users");
      })
      .addCase(getInvestorDetails.pending, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDetailsByKey, key);
        setPendingState(target);
      })
      .addCase(getInvestorDetails.fulfilled, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDetailsByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getInvestorDetails.rejected, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDetailsByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load investor details");
      })
      .addCase(getInvestorDocuments.pending, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDocumentsByKey, key);
        setPendingState(target);
      })
      .addCase(getInvestorDocuments.fulfilled, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDocumentsByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getInvestorDocuments.rejected, (state, action) => {
        const key = buildInvestorQueryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.investorDocumentsByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load investor documents");
      })
      .addCase(createInvestorByAdmin.pending, (state) => {
        setPendingState(state.mutations.createInvestorByAdmin, { keepData: false });
      })
      .addCase(createInvestorByAdmin.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createInvestorByAdmin, action.payload);
      })
      .addCase(createInvestorByAdmin.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createInvestorByAdmin,
          action.payload || action.error,
          "Failed to create investor"
        );
      })
      .addCase(updateInvestorByAdmin.pending, (state) => {
        setPendingState(state.mutations.updateInvestorByAdmin, { keepData: false });
      })
      .addCase(updateInvestorByAdmin.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateInvestorByAdmin, action.payload);
      })
      .addCase(updateInvestorByAdmin.rejected, (state, action) => {
        setRejectedState(
          state.mutations.updateInvestorByAdmin,
          action.payload || action.error,
          "Failed to update investor"
        );
      })
      .addCase(updateInvestorStatusByAdmin.pending, (state) => {
        setPendingState(state.mutations.updateInvestorStatusByAdmin, { keepData: false });
      })
      .addCase(updateInvestorStatusByAdmin.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateInvestorStatusByAdmin, action.payload);
      })
      .addCase(updateInvestorStatusByAdmin.rejected, (state, action) => {
        setRejectedState(
          state.mutations.updateInvestorStatusByAdmin,
          action.payload || action.error,
          "Failed to update investor status"
        );
      })
      .addCase(reviewInvestorApprovalByAdmin.pending, (state) => {
        setPendingState(state.mutations.reviewInvestorApprovalByAdmin, { keepData: false });
      })
      .addCase(reviewInvestorApprovalByAdmin.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.reviewInvestorApprovalByAdmin, action.payload);
      })
      .addCase(reviewInvestorApprovalByAdmin.rejected, (state, action) => {
        setRejectedState(
          state.mutations.reviewInvestorApprovalByAdmin,
          action.payload || action.error,
          "Failed to review investor approval"
        );
      })
      .addCase(uploadInvestorDocumentByAdmin.pending, (state) => {
        setPendingState(state.mutations.uploadInvestorDocumentByAdmin, { keepData: false });
      })
      .addCase(uploadInvestorDocumentByAdmin.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.uploadInvestorDocumentByAdmin, action.payload);
      })
      .addCase(uploadInvestorDocumentByAdmin.rejected, (state, action) => {
        setRejectedState(
          state.mutations.uploadInvestorDocumentByAdmin,
          action.payload || action.error,
          "Failed to upload investor document"
        );
      });
  },
});

export const selectUsersQueryState = (state) => state.investors?.queries?.users || EMPTY_REQUEST_STATE;
export const selectInvestorDetailsQueryState = (state, key) =>
  state.investors?.queries?.investorDetailsByKey?.[key] || EMPTY_REQUEST_STATE;
export const selectInvestorDocumentsQueryState = (state, key) =>
  state.investors?.queries?.investorDocumentsByKey?.[key] || EMPTY_REQUEST_STATE;

export const selectInvestorMutationState = (state, mutationName) =>
  state.investors?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetInvestorMutation } = investorSlice.actions;
export default investorSlice.reducer;
