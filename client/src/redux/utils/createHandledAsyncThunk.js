import { createAsyncThunk } from "@reduxjs/toolkit";
import { toApiError } from "@/redux/utils/requestState";

export const createHandledAsyncThunk = (typePrefix, apiCall, options = {}) =>
  createAsyncThunk(typePrefix, async (arg, { rejectWithValue }) => {
    try {
      const response = await apiCall(arg);

      if (!response?.success) {
        return rejectWithValue(toApiError(response, options.errorMessage));
      }

      return response;
    } catch (error) {
      return rejectWithValue(toApiError(error, options.errorMessage));
    }
  });
