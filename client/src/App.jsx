import { useEffect } from "react";
import { useAppSelector } from "@/app/hooks";
import { AppRoutes } from "@/router/AppRoutes";
import { registerSocketUser, getSocket } from "@/lib/socket";

export const App = () => {
  const userId = useAppSelector((state) => state.auth?.user?._id || state.auth?.user?.id);

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

    socket.on("profit:credited", handleProfit);
    socket.on("share:assigned", handleShareAssigned);
    socket.on("share:payment", handleSharePayment);

    return () => {
      const activeSocket = getSocket();
      activeSocket.off("profit:credited", handleProfit);
      activeSocket.off("share:assigned", handleShareAssigned);
      activeSocket.off("share:payment", handleSharePayment);
    };
  }, [userId]);

  return <AppRoutes />;
};
