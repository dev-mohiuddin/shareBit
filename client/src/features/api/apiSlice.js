import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { logout, setUser } from "@/features/auth/authSlice";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const rawBaseQuery = fetchBaseQuery({
  baseUrl,
  credentials: "include",
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refresh = await rawBaseQuery(
      { url: "/api/v1/auth/refresh-token", method: "POST" },
      api,
      extraOptions
    );

    if (refresh.data?.success) {
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Auth",
    "Assets",
    "ShareAccounts",
    "SharePayments",
    "ProfitSummary",
    "AssetProfit",
    "ProfitLedger",
    "AuditLogs",
    "Wallet",
    "Users",
    "Withdrawals",
  ],
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        body: payload,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            dispatch(setUser(data.data));
          }
        } catch (_) {
          // handled by component
        }
      },
    }),
    register: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/register",
        method: "POST",
        body: payload,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/verify-otp",
        method: "POST",
        body: payload,
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.success) {
            dispatch(setUser(data.data));
          }
        } catch (_) {
          // handled by component
        }
      },
    }),
    resendOtp: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/resend-otp",
        method: "POST",
        body: payload,
      }),
    }),
    refreshToken: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/auth/refresh-token",
        method: "POST",
        body: payload,
      }),
    }),
    getMe: builder.query({
      query: () => "/api/v1/users/me",
      providesTags: ["Users"],
    }),
    getUsers: builder.query({
      query: () => "/api/v1/users",
      providesTags: ["Users"],
    }),
    getAssets: builder.query({
      query: () => "/api/v1/assets",
      providesTags: ["Assets"],
    }),
    createAsset: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/assets",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Assets"],
    }),
    getShareAccountsByAsset: builder.query({
      query: (assetId) => `/api/v1/assets/${assetId}/share-accounts`,
      providesTags: ["ShareAccounts"],
    }),
    assignShare: builder.mutation({
      query: ({ shareAccountId, ...payload }) => ({
        url: `/api/v1/share-accounts/${shareAccountId}/assign`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ShareAccounts"],
    }),
    recordSharePayment: builder.mutation({
      query: ({ shareAccountId, ...payload }) => ({
        url: `/api/v1/share-accounts/${shareAccountId}/payments`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["SharePayments", "ShareAccounts"],
    }),
    getSharePayments: builder.query({
      query: (shareAccountId) => `/api/v1/share-accounts/${shareAccountId}/payments`,
      providesTags: ["SharePayments"],
    }),
    getMyShareAccounts: builder.query({
      query: () => "/api/v1/share-accounts/me",
      providesTags: ["ShareAccounts"],
    }),
    getAuditLogs: builder.query({
      query: () => "/api/v1/audit-logs",
      providesTags: ["AuditLogs"],
    }),
    getProfitSummary: builder.query({
      query: (monthKey) =>
        `/api/v1/reports/profit-summary${monthKey ? `?monthKey=${monthKey}` : ""}`,
      providesTags: ["ProfitSummary"],
    }),
    createAssetProfit: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/asset-profits",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AssetProfit", "ProfitSummary"],
    }),
    createAssetProfitAdjustment: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/asset-profits/adjustments",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["AssetProfit", "ProfitSummary"],
    }),
    getAssetProfitEntries: builder.query({
      query: ({ assetId, monthKey }) => `/api/v1/assets/${assetId}/profit/${monthKey}`,
      providesTags: ["AssetProfit"],
    }),
    createProfitLedgerAdjustment: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/profit-ledger/adjustments",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["ProfitLedger", "ProfitSummary"],
    }),
    getWallet: builder.query({
      query: () => "/api/v1/wallet",
      providesTags: ["Wallet"],
    }),
    getWithdrawals: builder.query({
      query: () => "/api/v1/wallet/withdrawals",
      providesTags: ["Withdrawals"],
    }),
    getAllWithdrawals: builder.query({
      query: () => "/api/v1/wallet/withdrawals/admin",
      providesTags: ["Withdrawals"],
    }),
    requestWithdrawal: builder.mutation({
      query: (payload) => ({
        url: "/api/v1/wallet/withdrawals",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["Withdrawals", "Wallet"],
    }),
    updateWithdrawalStatus: builder.mutation({
      query: ({ withdrawalId, ...payload }) => ({
        url: `/api/v1/wallet/withdrawals/${withdrawalId}/status`,
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: ["Withdrawals", "Wallet"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useRefreshTokenMutation,
  useGetMeQuery,
  useGetUsersQuery,
  useGetAssetsQuery,
  useCreateAssetMutation,
  useGetShareAccountsByAssetQuery,
  useAssignShareMutation,
  useRecordSharePaymentMutation,
  useGetSharePaymentsQuery,
  useLazyGetSharePaymentsQuery,
  useGetMyShareAccountsQuery,
  useGetAuditLogsQuery,
  useGetProfitSummaryQuery,
  useCreateAssetProfitMutation,
  useCreateAssetProfitAdjustmentMutation,
  useGetAssetProfitEntriesQuery,
  useCreateProfitLedgerAdjustmentMutation,
  useGetWalletQuery,
  useGetWithdrawalsQuery,
  useGetAllWithdrawalsQuery,
  useRequestWithdrawalMutation,
  useUpdateWithdrawalStatusMutation,
} = apiSlice;
