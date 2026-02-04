import http from "http";
import express from "express";
import { Server } from "socket.io";

export const app = express();
export const server = http.createServer(app);

export const io = new Server(server, {
	cors: { origin: true, credentials: true },
});

const userSocketMap = new Map();

io.on("connection", (socket) => {
	socket.on("register", (userId) => {
		if (!userId) return;
		userSocketMap.set(userId.toString(), socket.id);
	});

	socket.on("disconnect", () => {
		for (const [userId, socketId] of userSocketMap.entries()) {
			if (socketId === socket.id) {
				userSocketMap.delete(userId);
				break;
			}
		}
	});
});

export const emitToUser = (userId, event, payload) => {
	if (!userId) return;
	const socketId = userSocketMap.get(userId.toString());
	if (socketId) {
		io.to(socketId).emit(event, payload);
	}
};
