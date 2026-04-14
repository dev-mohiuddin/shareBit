import { createSlice } from "@reduxjs/toolkit";
import {
  login as loginApi,
  refreshToken as refreshTokenApi,
  register as registerApi,
  resendOtp as resendOtpApi,
  verifyOtp as verifyOtpApi,
} from "@/lib/api/authApi";
import { createHandledAsyncThunk } from "@/redux/utils/createHandledAsyncThunk";
import {
  createRequestState,
  EMPTY_REQUEST_STATE,
  setFulfilledState,
  setPendingState,
  setRejectedState,
} from "@/redux/utils/requestState";

const createOperationsState = () => ({
  login: createRequestState(),
  register: createRequestState(),
  verifyOtp: createRequestState(),
  resendOtp: createRequestState(),
  refreshToken: createRequestState(),
});

const initialState = {
  user: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
  operations: createOperationsState(),
};

export const login = createHandledAsyncThunk("auth/login", loginApi, {
  errorMessage: "Login failed",
});

export const register = createHandledAsyncThunk("auth/register", registerApi, {
  errorMessage: "Registration failed",
});

export const verifyOtp = createHandledAsyncThunk("auth/verifyOtp", verifyOtpApi, {
  errorMessage: "OTP verification failed",
});

export const resendOtp = createHandledAsyncThunk("auth/resendOtp", resendOtpApi, {
  errorMessage: "Resend OTP failed",
});

export const refreshToken = createHandledAsyncThunk("auth/refreshToken", refreshTokenApi, {
  errorMessage: "Refresh failed",
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
      state.operations = createOperationsState();
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
    resetAuthOperation: (state, action) => {
      const operation = action.payload;
      if (!operation || !state.operations[operation]) return;
      state.operations[operation] = createRequestState();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        setPendingState(state.operations.login, { keepData: false });
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        setFulfilledState(state.operations.login, action.payload);
        state.status = "succeeded";
        state.error = null;
        state.user = action.payload?.data || null;
        state.isAuthenticated = Boolean(action.payload?.data);
      })
      .addCase(login.rejected, (state, action) => {
        setRejectedState(state.operations.login, action.payload || action.error, "Login failed");
        state.status = "failed";
        state.error = state.operations.login.error?.data?.message || "Login failed";
      })
      .addCase(register.pending, (state) => {
        setPendingState(state.operations.register, { keepData: false });
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        setFulfilledState(state.operations.register, action.payload);
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        setRejectedState(state.operations.register, action.payload || action.error, "Registration failed");
        state.status = "failed";
        state.error = state.operations.register.error?.data?.message || "Registration failed";
      })
      .addCase(verifyOtp.pending, (state) => {
        setPendingState(state.operations.verifyOtp, { keepData: false });
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        setFulfilledState(state.operations.verifyOtp, action.payload);
        state.status = "succeeded";
        state.error = null;
        state.user = action.payload?.data || null;
        state.isAuthenticated = Boolean(action.payload?.data);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        setRejectedState(
          state.operations.verifyOtp,
          action.payload || action.error,
          "OTP verification failed"
        );
        state.status = "failed";
        state.error = state.operations.verifyOtp.error?.data?.message || "OTP verification failed";
      })
      .addCase(resendOtp.pending, (state) => {
        setPendingState(state.operations.resendOtp, { keepData: false });
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        setFulfilledState(state.operations.resendOtp, action.payload);
      })
      .addCase(resendOtp.rejected, (state, action) => {
        setRejectedState(state.operations.resendOtp, action.payload || action.error, "Resend OTP failed");
      })
      .addCase(refreshToken.pending, (state) => {
        setPendingState(state.operations.refreshToken, { keepData: false });
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        setFulfilledState(state.operations.refreshToken, action.payload);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        setRejectedState(state.operations.refreshToken, action.payload || action.error, "Refresh failed");
      });
  },
});

export const selectAuthState = (state) => state.auth;
export const selectAuthUser = (state) => state.auth?.user || null;
export const selectIsAuthenticated = (state) => Boolean(state.auth?.isAuthenticated);
export const selectAuthOperation = (state, operation) =>
  state.auth?.operations?.[operation] || EMPTY_REQUEST_STATE;

export const { logout, resetAuthOperation, setUser } = authSlice.actions;
export default authSlice.reducer;
