import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./env";

// Singleton — one io instance shared across the whole app
let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Used by workers and anywhere else that needs to emit events
export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO not initialised — call initSocket() first");
  }
  return io;
};
