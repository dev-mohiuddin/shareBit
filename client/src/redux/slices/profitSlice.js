import { createSlice } from "@reduxjs/toolkit";
import {
  createAssetExpense as createAssetExpenseApi,
  createAssetExpenseCorrection as createAssetExpenseCorrectionApi,
  createAssetProfit as createAssetProfitApi,
  createAssetProfitAdjustment as createAssetProfitAdjustmentApi,
  createProfitLedgerAdjustment as createProfitLedgerAdjustmentApi,
  getAssetExpenses as getAssetExpensesApi,
  getAssetMonthPnl as getAssetMonthPnlApi,
  getAssetProfitEntries as getAssetProfitEntriesApi,
  getProfitSummary as getProfitSummaryApi,
} from "@/lib/api/profitApi";
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

export const buildProfitSummaryKey = (params) => serializeArg(params);
export const buildAssetProfitEntriesKey = (params) =>
  serializeArg({
    assetId: params?.assetId || "",
    monthKey: params?.monthKey || "",
  });
export const buildAssetMonthPnlKey = (params) =>
  serializeArg({
    assetId: params?.assetId || "",
    monthKey: params?.monthKey || "",
  });
export const buildAssetExpensesKey = (params) =>
  serializeArg({
    assetId: params?.assetId || "",
    monthKey: params?.monthKey || "",
    entryType: params?.entryType || "",
  });

const createInitialState = () => ({
  queries: {
    profitSummaryByKey: {},
    assetProfitEntriesByKey: {},
    assetMonthPnlByKey: {},
    assetExpensesByKey: {},
  },
  mutations: {
    createAssetProfit: createRequestState(),
    createAssetProfitAdjustment: createRequestState(),
    createAssetExpense: createRequestState(),
    createAssetExpenseCorrection: createRequestState(),
    createProfitLedgerAdjustment: createRequestState(),
  },
});

const getOrCreateMapRequestState = (map, key) => {
  if (!map[key]) {
    map[key] = createRequestState();
  }
  return map[key];
};

export const getProfitSummary = createHandledAsyncThunk("profit/getProfitSummary", getProfitSummaryApi, {
  errorMessage: "Failed to load profit summary",
});

export const createAssetProfit = createHandledAsyncThunk(
  "profit/createAssetProfit",
  createAssetProfitApi,
  {
    errorMessage: "Failed to create profit entry",
  }
);

export const createAssetProfitAdjustment = createHandledAsyncThunk(
  "profit/createAssetProfitAdjustment",
  createAssetProfitAdjustmentApi,
  {
    errorMessage: "Failed to create profit adjustment",
  }
);

export const getAssetProfitEntries = createHandledAsyncThunk(
  "profit/getAssetProfitEntries",
  getAssetProfitEntriesApi,
  {
    errorMessage: "Failed to load profit entries",
  }
);

export const getAssetMonthPnl = createHandledAsyncThunk("profit/getAssetMonthPnl", getAssetMonthPnlApi, {
  errorMessage: "Failed to load month PnL",
});

export const getAssetExpenses = createHandledAsyncThunk("profit/getAssetExpenses", getAssetExpensesApi, {
  errorMessage: "Failed to load asset expenses",
});

export const createAssetExpense = createHandledAsyncThunk(
  "profit/createAssetExpense",
  createAssetExpenseApi,
  {
    errorMessage: "Failed to create expense entry",
  }
);

export const createAssetExpenseCorrection = createHandledAsyncThunk(
  "profit/createAssetExpenseCorrection",
  createAssetExpenseCorrectionApi,
  {
    errorMessage: "Failed to create expense correction",
  }
);

export const createProfitLedgerAdjustment = createHandledAsyncThunk(
  "profit/createProfitLedgerAdjustment",
  createProfitLedgerAdjustmentApi,
  {
    errorMessage: "Failed to create ledger adjustment",
  }
);

const profitSlice = createSlice({
  name: "profit",
  initialState: createInitialState(),
  reducers: {
    resetProfitMutation: (state, action) => {
      const mutationName = action.payload;
      if (!mutationName || !state.mutations[mutationName]) return;
      state.mutations[mutationName] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getProfitSummary.pending, (state, action) => {
        const key = buildProfitSummaryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.profitSummaryByKey, key);
        setPendingState(target);
      })
      .addCase(getProfitSummary.fulfilled, (state, action) => {
        const key = buildProfitSummaryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.profitSummaryByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getProfitSummary.rejected, (state, action) => {
        const key = buildProfitSummaryKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.profitSummaryByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load profit summary");
      })
      .addCase(getAssetProfitEntries.pending, (state, action) => {
        const key = buildAssetProfitEntriesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetProfitEntriesByKey, key);
        setPendingState(target);
      })
      .addCase(getAssetProfitEntries.fulfilled, (state, action) => {
        const key = buildAssetProfitEntriesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetProfitEntriesByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getAssetProfitEntries.rejected, (state, action) => {
        const key = buildAssetProfitEntriesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetProfitEntriesByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load profit entries");
      })
      .addCase(getAssetMonthPnl.pending, (state, action) => {
        const key = buildAssetMonthPnlKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetMonthPnlByKey, key);
        setPendingState(target);
      })
      .addCase(getAssetMonthPnl.fulfilled, (state, action) => {
        const key = buildAssetMonthPnlKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetMonthPnlByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getAssetMonthPnl.rejected, (state, action) => {
        const key = buildAssetMonthPnlKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetMonthPnlByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load month PnL");
      })
      .addCase(getAssetExpenses.pending, (state, action) => {
        const key = buildAssetExpensesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetExpensesByKey, key);
        setPendingState(target);
      })
      .addCase(getAssetExpenses.fulfilled, (state, action) => {
        const key = buildAssetExpensesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetExpensesByKey, key);
        setFulfilledState(target, action.payload);
      })
      .addCase(getAssetExpenses.rejected, (state, action) => {
        const key = buildAssetExpensesKey(action.meta.arg);
        const target = getOrCreateMapRequestState(state.queries.assetExpensesByKey, key);
        setRejectedState(target, action.payload || action.error, "Failed to load asset expenses");
      })
      .addCase(createAssetProfit.pending, (state) => {
        setPendingState(state.mutations.createAssetProfit, { keepData: false });
      })
      .addCase(createAssetProfit.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createAssetProfit, action.payload);
      })
      .addCase(createAssetProfit.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createAssetProfit,
          action.payload || action.error,
          "Failed to create profit entry"
        );
      })
      .addCase(createAssetProfitAdjustment.pending, (state) => {
        setPendingState(state.mutations.createAssetProfitAdjustment, { keepData: false });
      })
      .addCase(createAssetProfitAdjustment.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createAssetProfitAdjustment, action.payload);
      })
      .addCase(createAssetProfitAdjustment.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createAssetProfitAdjustment,
          action.payload || action.error,
          "Failed to create profit adjustment"
        );
      })
      .addCase(createAssetExpense.pending, (state) => {
        setPendingState(state.mutations.createAssetExpense, { keepData: false });
      })
      .addCase(createAssetExpense.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createAssetExpense, action.payload);
      })
      .addCase(createAssetExpense.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createAssetExpense,
          action.payload || action.error,
          "Failed to create expense entry"
        );
      })
      .addCase(createAssetExpenseCorrection.pending, (state) => {
        setPendingState(state.mutations.createAssetExpenseCorrection, { keepData: false });
      })
      .addCase(createAssetExpenseCorrection.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createAssetExpenseCorrection, action.payload);
      })
      .addCase(createAssetExpenseCorrection.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createAssetExpenseCorrection,
          action.payload || action.error,
          "Failed to create expense correction"
        );
      })
      .addCase(createProfitLedgerAdjustment.pending, (state) => {
        setPendingState(state.mutations.createProfitLedgerAdjustment, { keepData: false });
      })
      .addCase(createProfitLedgerAdjustment.fulfilled, (state, action) => {
        setFulfilledState(state.mutations.createProfitLedgerAdjustment, action.payload);
      })
      .addCase(createProfitLedgerAdjustment.rejected, (state, action) => {
        setRejectedState(
          state.mutations.createProfitLedgerAdjustment,
          action.payload || action.error,
          "Failed to create ledger adjustment"
        );
      });
  },
});

export const selectProfitSummaryQueryState = (state, key) =>
  state.profit?.queries?.profitSummaryByKey?.[key] || EMPTY_REQUEST_STATE;
export const selectAssetProfitEntriesQueryState = (state, key) =>
  state.profit?.queries?.assetProfitEntriesByKey?.[key] || EMPTY_REQUEST_STATE;
export const selectAssetMonthPnlQueryState = (state, key) =>
  state.profit?.queries?.assetMonthPnlByKey?.[key] || EMPTY_REQUEST_STATE;
export const selectAssetExpensesQueryState = (state, key) =>
  state.profit?.queries?.assetExpensesByKey?.[key] || EMPTY_REQUEST_STATE;

export const selectProfitMutationState = (state, mutationName) =>
  state.profit?.mutations?.[mutationName] || EMPTY_REQUEST_STATE;

export const { resetProfitMutation } = profitSlice.actions;
export default profitSlice.reducer;
