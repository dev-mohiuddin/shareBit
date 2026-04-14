import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AppRoutes } from "@/router/AppRoutes";
import { registerSocketUser, getSocket } from "@/lib/socket";
import { Toaster } from "@/components/ui/toaster";
import {
  getAllDeposits,
  getAllWithdrawals,
  getDeposits,
  getWallet,
  getWithdrawals,
} from "@/redux/slices/walletSlice";
import { getMyTransactions } from "@/redux/slices/userSlice";
import { toast } from "@/hooks/use-toast";

export const App = () => {
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.auth?.user?._id || state.auth?.user?.id);
  const roleName = useAppSelector((state) => state.auth?.user?.roleName || "");
  const isAdmin = String(roleName).toLowerCase().includes("admin");

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

    const refreshWalletData = () => {
      dispatch(getWallet());
      dispatch(getWithdrawals());
      dispatch(getDeposits());
      dispatch(getMyTransactions({ limit: 100 }));

      if (isAdmin) {
        dispatch(getAllWithdrawals());
        dispatch(getAllDeposits());
      }
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
  }, [dispatch, isAdmin, userId]);

  return (
    <>
      <AppRoutes />
      <Toaster />
    </>
  );
};
