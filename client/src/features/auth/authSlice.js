import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  login as loginApi,
  register as registerApi,
  verifyOtp as verifyOtpApi,
  resendOtp as resendOtpApi,
  refreshToken as refreshTokenApi,
} from "@/lib/api/authApi";

const initialState = {
  user: null,
  status: "idle",
  error: null,
  isAuthenticated: false,
};

export const login = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue }) => {
    const response = await loginApi(payload);
    if (!response.success) {
      return rejectWithValue(response.message || "Login failed");
    }
    return response.data;
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    const response = await registerApi(payload);
    if (!response.success) {
      return rejectWithValue(response.message || "Registration failed");
    }
    return response.data;
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (payload, { rejectWithValue }) => {
    const response = await verifyOtpApi(payload);
    if (!response.success) {
      return rejectWithValue(response.message || "OTP verification failed");
    }
    return response.data;
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (payload, { rejectWithValue }) => {
    const response = await resendOtpApi(payload);
    if (!response.success) {
      return rejectWithValue(response.message || "Resend OTP failed");
    }
    return response.data;
  }
);

export const refreshToken = createAsyncThunk(
  "auth/refreshToken",
  async (_, { rejectWithValue }) => {
    const response = await refreshTokenApi();
    if (!response.success) {
      return rejectWithValue(response.message || "Refresh failed");
    }
    return response.data;
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload || null;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload || "Login failed");
      })
      .addCase(register.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.status = "succeeded";
      })
      .addCase(register.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload || "Registration failed");
      })
      .addCase(verifyOtp.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload || null;
        state.isAuthenticated = Boolean(action.payload);
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.status = "failed";
        state.error = String(action.payload || "OTP verification failed");
      })
      .addCase(resendOtp.pending, (state) => {
        state.status = "loading";
      });
  },
});

export const { logout, setUser } = authSlice.actions;
export default authSlice.reducer;
