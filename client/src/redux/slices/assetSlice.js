import { createSlice } from "@reduxjs/toolkit";
import {
  createAsset as createAssetApi,
  deleteAsset as deleteAssetApi,
  getAssets as getAssetsApi,
  updateAsset as updateAssetApi,
} from "@/lib/api/assetApi";
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
    assets: createRequestState(),
  },
  mutations: {
    createAsset: createRequestState(),
    updateAsset: createRequestState(),
    deleteAsset: createRequestState(),
  },
});

export const getAssets = createHandledAsyncThunk("assets/getAssets", getAssetsApi, {
  errorMessage: "Failed to load assets",
});

export const createAsset = createHandledAsyncThunk("assets/createAsset", createAssetApi, {
  errorMessage: "Failed to create asset",
});

export const updateAsset = createHandledAsyncThunk("assets/updateAsset", updateAssetApi, {
  errorMessage: "Failed to update asset",
});

export const deleteAsset = createHandledAsyncThunk("assets/deleteAsset", deleteAssetApi, {
  errorMessage: "Failed to delete asset",
});

const assetSlice = createSlice({
  name: "assets",
  initialState: createInitialState(),
  reducers: {
    resetAssetMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getAssets.pending, (state) => {
        setPendingState(state.queries.assets);
      })
      .addCase(getAssets.fulfilled, (state, action) => {
        setFulfilledState(state.queries.assets, action.payload);
      })
      .addCase(getAssets.rejected, (state, action) => {
        setRejectedState(state.queries.assets, action.payload || action.error, "Failed to load assets");
      })
      .addCase(createAsset.pending, (state) => {
        setPendingState(state.mutations.createAsset, { keepData: false });
      })
      .addCase(createAsset.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createAsset, action.payload);
      })
      .addCase(createAsset.rejected, (state, action) => {
        setRejectedState(state.mutations.createAsset, action.payload || action.error, "Failed to create asset");
      })
      .addCase(updateAsset.pending, (state) => {
        setPendingState(state.mutations.updateAsset, { keepData: false });
      })
      .addCase(updateAsset.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.updateAsset, action.payload);
      })
      .addCase(updateAsset.rejected, (state, action) => {
        setRejectedState(state.mutations.updateAsset, action.payload || action.error, "Failed to update asset");
      })
      .addCase(deleteAsset.pending, (state) => {
        setPendingState(state.mutations.deleteAsset, { keepData: false });
      })
      .addCase(deleteAsset.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.deleteAsset, action.payload);
      })
      .addCase(deleteAsset.rejected, (state, action) => {
        setRejectedState(state.mutations.deleteAsset, action.payload || action.error, "Failed to delete asset");
      });
  },
});

export const selectAssetsQueryState = (state) => state.assets?.queries?.assets || EMPTY_REQUEST_STATE;
export const selectAssetMutationState = (state, mutationName) =>
  state.assets?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetAssetMutation } = assetSlice.actions;
export default assetSlice.reducer;
