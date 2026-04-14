import { configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
import { persistReducer, persistStore } from "redux-persist";
import storageLib from "redux-persist/lib/storage";
import { setAuthFailureHandler } from "@/lib/api";
import authReducer, { logout } from "@/redux/auth/authSlice";
import userReducer from "@/redux/slices/userSlice";
import investorReducer from "@/redux/slices/investorSlice";
import assetReducer from "@/redux/slices/assetSlice";
import shareReducer from "@/redux/slices/shareSlice";
import profitReducer from "@/redux/slices/profitSlice";
import walletReducer from "@/redux/slices/walletSlice";
import auditReducer from "@/redux/slices/auditSlice";

const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem(_key, value) {
    return Promise.resolve(value);
  },
  removeItem() {
    return Promise.resolve();
  },
});

const storage =
  typeof window !== "undefined"
    ? storageLib && storageLib.default
      ? storageLib.default
      : storageLib
    : createNoopStorage();

const rootReducer = combineReducers({
  auth: authReducer,
  users: userReducer,
  investors: investorReducer,
  assets: assetReducer,
  shares: shareReducer,
  profit: profitReducer,
  wallet: walletReducer,
  audit: auditReducer,
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

setAuthFailureHandler(() => {
  const state = store.getState();
  if (state?.auth?.isAuthenticated) {
    store.dispatch(logout());
  }
});

export const persistor = persistStore(store);
