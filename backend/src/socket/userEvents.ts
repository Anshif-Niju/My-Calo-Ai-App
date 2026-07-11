import { Server as SocketIOServer } from "socket.io";
import { SocketWithUser } from "./types.js";
import { logger } from "../utils/logger.js";

export const registerUserEvents = (io: SocketIOServer): void => {
  io.on("connection", (socket) => {
    const authedSocket = socket as SocketWithUser;
    const userId = authedSocket.user.userId;

    socket.on("disconnect", (reason) => {
      logger.info(`🔌 Socket [${socket.id}] disconnected — user=${userId} reason=${reason}`);
    });
  });
};
