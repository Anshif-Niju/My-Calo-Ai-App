import { Server as SocketIOServer } from "socket.io";
import { SocketWithUser } from "./types.js";
import { logger } from "../utils/logger.js";

/**
 * Registers user-scoped socket events on the given io instance.
 *
 * The user's personal room (`userId`) is already joined in `socketAuth.ts`
 * before any of these handlers fire. Workers and background services emit
 * to this room using:
 *
 *   io.to(userId).emit("food-scan-completed", { scanId, data })
 *   io.to(userId).emit("notification", { ... })
 *   io.to(userId).emit("reminder", { ... })
 *
 * This file is the home for any future user-directed realtime features.
 */
export const registerUserEvents = (io: SocketIOServer): void => {
  io.on("connection", (socket) => {
    const authedSocket = socket as SocketWithUser;
    const userId = authedSocket.user.userId;

    socket.on("disconnect", (reason) => {
      logger.info(`🔌 Socket [${socket.id}] disconnected — user=${userId} reason=${reason}`);
    });
  });
};
