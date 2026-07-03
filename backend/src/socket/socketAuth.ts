import { Server as SocketIOServer } from "socket.io";
import jwt from "jsonwebtoken";
import { parse as parseCookies } from "cookie";
import { AuthUserPayload } from "../types/index.js";
import { SocketWithUser } from "./types.js";
import { logger } from "../utils/logger.js";

/**
 * Socket.IO authentication middleware.
 *
 * Reads the `accessToken` httpOnly cookie that the Express auth layer already
 * set, verifies it with the same JWT_SECRET, attaches the decoded payload to
 * `socket.user`, and immediately joins the user's personal room
 * (`socket.join(userId)`) so workers can push user-specific events (AI scans,
 * notifications, subscription updates) without ever trusting the frontend.
 *
 * Connections that arrive without a valid token are rejected immediately.
 */
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

  // After a socket is authenticated, immediately join its personal user room
  io.on("connection", (socket) => {
    const authedSocket = socket as SocketWithUser;
    const userId = authedSocket.user.userId;

    // Personal room: io.to(userId) reaches only this user across all their connections
    socket.join(userId);
    logger.info(`✅ Socket [${socket.id}] authenticated — user ${userId} joined personal room`);
  });
};
