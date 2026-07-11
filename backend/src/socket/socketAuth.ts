import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { parse as parseCookies } from "cookie";
import { AuthUserPayload } from "../types/index.js";
import { SocketWithUser } from "./types.js";
import { logger } from "../utils/logger.js";

export const applySocketAuth = (io: SocketIOServer): void => {
  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie ?? "";
      const cookies = parseCookies(rawCookies);
      const token = cookies["accessToken"];

      if (!token) {
        return next(new Error("Unauthorized: no access token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUserPayload;

      // Attach user to socket — available in all subsequent event handlers
      (socket as SocketWithUser).user = decoded;

      next();
    } catch {
      next(new Error("Unauthorized: invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const authedSocket = socket as SocketWithUser;
    const userId = authedSocket.user.userId;

    socket.join(userId);
    logger.info(`✅ Socket [${socket.id}] authenticated — user ${userId} joined personal room`);
  });
};
