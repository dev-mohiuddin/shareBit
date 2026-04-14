import { createSlice } from "@reduxjs/toolkit";
import { getAuditLogs as getAuditLogsApi } from "@/lib/api/auditApi";
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
    auditLogs: createRequestState(),
  },
});

export const getAuditLogs = createHandledAsyncThunk("audit/getAuditLogs", getAuditLogsApi, {
  errorMessage: "Failed to load audit logs",
});

const auditSlice = createSlice({
  name: "audit",
  initialState: createInitialState(),
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logout, () => createInitialState())
      .addCase(getAuditLogs.pending, (state) => {
        setPendingState(state.queries.auditLogs);
      })
      .addCase(getAuditLogs.fulfilled, (state, action) => {
        setFulfilledState(state.queries.auditLogs, action.payload);
      })
      .addCase(getAuditLogs.rejected, (state, action) => {
        setRejectedState(state.queries.auditLogs, action.payload || action.error, "Failed to load audit logs");
      });
  },
});

export const selectAuditLogsQueryState = (state) =>
  state.audit?.queries?.auditLogs || EMPTY_REQUEST_STATE;

export default auditSlice.reducer;
