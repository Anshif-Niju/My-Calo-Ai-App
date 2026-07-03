import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env.js";
import { applySocketAuth } from "./socketAuth.js";
import { registerBookingEvents } from "./bookingEvents.js";
import { registerUserEvents } from "./userEvents.js";

// Singleton — one io instance shared across the whole app
let io: SocketIOServer | null = null;

/**
 * Initialises the Socket.IO server and wires up the full connection pipeline:
 *
 *   initSocket()
 *     └─ applySocketAuth()        — JWT cookie verification + user room join
 *     └─ registerBookingEvents()  — join-booking, chat, WebRTC
 *     └─ registerUserEvents()     — disconnect logging, future user events
 *
 * Must be called once on server startup before any worker calls getIO().
 */
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

/**
 * Returns the shared Socket.IO instance.
 * Used by BullMQ workers to push events to user or booking rooms.
 *
 * @throws if called before initSocket()
 */
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialised — call initSocket() first");
  }
  return io;
};
