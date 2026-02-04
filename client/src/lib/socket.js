import { io } from "socket.io-client";

const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(baseUrl, { withCredentials: true });
  }
  return socketInstance;
};

export const registerSocketUser = (userId) => {
  if (!userId) return null;
  const socket = getSocket();
  socket.emit("register", userId);
  return socket;
};
