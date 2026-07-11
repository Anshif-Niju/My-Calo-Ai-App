import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
import { applySocketAuth } from "./socketAuth.js";
import { registerBookingEvents } from "./bookingEvents.js";
import { registerUserEvents } from "./userEvents.js";

let io: SocketIOServer | null = null;


export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  // 1. Auth — must run before any event handler
  applySocketAuth(io);

  // 2. Booking-scoped events (chat, WebRTC, room join)
  registerBookingEvents(io);

  // 3. User-scoped events (disconnect, future notifications)
  registerUserEvents(io);

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialised — call initSocket() first");
  }
  return io;
};
