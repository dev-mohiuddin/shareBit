import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AppRoutes } from "@/router/AppRoutes";
import { registerSocketUser, getSocket } from "@/lib/socket";
import { Toaster } from "@/components/ui/toaster";
import { getAssets } from "@/redux/slices/assetSlice";
import { getMyShareAccounts } from "@/redux/slices/shareSlice";
import {
  getAllDeposits,
  getAllWithdrawals,
  getDeposits,
  getWallet,
  getWithdrawals,
} from "@/redux/slices/walletSlice";
import {
  getMe,
  getMyInvestorDashboardSnapshot,
  getMyTransactions,
} from "@/redux/slices/userSlice";
import { toast } from "@/hooks/use-toast";
import { useNetworkStatus } from "@/hooks/use-network-status";

export const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth?.user?._id || state.auth?.user?.id);
  const roleName = useAppSelector((state) => state.auth?.user?.roleName || "");
  const isAdmin = String(roleName).toLowerCase().includes("admin");
  const isOnline = useNetworkStatus();
  const wasOnlineRef = useRef(isOnline);

  const refreshWalletData = useCallback(() => {
    dispatch(getWallet());
    dispatch(getWithdrawals());
    dispatch(getDeposits());
    dispatch(getMyTransactions({ limit: 100 }));

    if (isAdmin) {
      dispatch(getAllWithdrawals());
      dispatch(getAllDeposits());
    }
  }, [dispatch, isAdmin]);

  const refreshInvestorReadData = useCallback(() => {
    if (!userId) return;

    dispatch(getMe());
    refreshWalletData();

    if (!isAdmin) {
      dispatch(getMyInvestorDashboardSnapshot());
      dispatch(getAssets());
      dispatch(getMyShareAccounts());
    }
  }, [dispatch, isAdmin, refreshWalletData, userId]);

  useEffect(() => {
    if (!userId) return undefined;

    const socket = registerSocketUser(userId);
    if (!socket) return undefined;

    const handleProfit = (payload) => {
      // eslint-disable-next-line no-console
      console.info("Profit credited", payload);
    };

    const handleShareAssigned = (payload) => {
      // eslint-disable-next-line no-console
      console.info("Share assigned", payload);
    };

    const handleSharePayment = (payload) => {
      // eslint-disable-next-line no-console
      console.info("Share payment", payload);
    };

    const handleWithdrawalUpdate = (payload) => {
      toast({
        title: `Withdrawal ${payload?.status || "updated"}`,
        description: payload?.reason || payload?.note || "Wallet withdrawal request has been updated.",
        ...(payload?.status === "rejected" || payload?.status === "cancelled"
          ? { variant: "destructive" }
          : {}),
      });
      refreshWalletData();
    };

    const handleDepositUpdate = (payload) => {
      toast({
        title: `Deposit ${payload?.status || "updated"}`,
        description: payload?.reason || payload?.note || "Wallet deposit request has been updated.",
        ...(payload?.status === "rejected" || payload?.status === "cancelled"
          ? { variant: "destructive" }
          : {}),
      });
      refreshWalletData();
    };

    const handleBalanceUpdate = () => {
      refreshWalletData();
    };

    socket.on("profit:credited", handleProfit);
    socket.on("share:assigned", handleShareAssigned);
    socket.on("share:payment", handleSharePayment);
    socket.on("wallet:withdrawal-updated", handleWithdrawalUpdate);
    socket.on("wallet:deposit-updated", handleDepositUpdate);
    socket.on("wallet:balance-updated", handleBalanceUpdate);

    return () => {
      const activeSocket = getSocket();
      activeSocket.off("profit:credited", handleProfit);
      activeSocket.off("share:assigned", handleShareAssigned);
      activeSocket.off("share:payment", handleSharePayment);
      activeSocket.off("wallet:withdrawal-updated", handleWithdrawalUpdate);
      activeSocket.off("wallet:deposit-updated", handleDepositUpdate);
      activeSocket.off("wallet:balance-updated", handleBalanceUpdate);
    };
  }, [refreshWalletData, userId]);

  useEffect(() => {
    if (wasOnlineRef.current === isOnline) return;

    if (!isOnline) {
      toast({
        variant: "destructive",
        title: "You are offline",
        description: "Read views may show older data. Write actions are paused until connection returns.",
      });
      wasOnlineRef.current = isOnline;
      return;
    }

    toast({
      title: "Back online",
      description: "Refreshing investor data to keep balances and statuses up to date.",
    });

    if (userId) {
      refreshInvestorReadData();
    }

    wasOnlineRef.current = isOnline;
  }, [isOnline, refreshInvestorReadData, userId]);

  return (
    <>
      {!isOnline ? (
        <div className="fixed inset-x-0 top-0 z-50 px-3 py-2">
          <div className="mx-auto max-w-3xl rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 shadow-sm">
            You are offline. Read-only data may be stale, and submit actions are temporarily disabled.
          </div>
        </div>
      ) : null}
      <div className={isOnline ? "" : "pt-12"}>
        <AppRoutes />
      </div>
      <Toaster />
    </>
  );
};
