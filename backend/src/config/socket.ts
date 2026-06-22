import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./env";
import { ChatMessage } from "../models/ChatMessage.model";
import { Booking } from "../models/Booking.model";

// Singleton — one io instance shared across the whole app
let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join room for specific booking consultation
    socket.on("join-room", async ({ bookingId, userId }) => {
      socket.join(bookingId);
      console.log(`🚪 User ${userId} joined room ${bookingId}`);
      
      // Notify other users in the room
      socket.to(bookingId).emit("user-connected", { userId });
    });

    // Handle sending message
    socket.on("send-message", async ({ bookingId, senderId, senderType, message, messageType, fileUrl }) => {
      try {
        // Save message to MongoDB
        const chatMsg = await ChatMessage.create({
          bookingId,
          senderId,
          senderType,
          message,
          messageType: messageType || "text",
          fileUrl,
        });

        // Broadcast new message to the room
        io?.to(bookingId).emit("new-message", chatMsg);
      } catch (err) {
        console.error("Error saving/sending chat message:", err);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // WebRTC Signaling: Call user
    socket.on("call-user", ({ bookingId, offer }) => {
      socket.to(bookingId).emit("incoming-call", { offer });
    });

    // WebRTC Signaling: Answer call
    socket.on("answer-call", ({ bookingId, answer }) => {
      socket.to(bookingId).emit("call-answered", { answer });
    });

    // WebRTC Signaling: ICE Candidate
    socket.on("ice-candidate", ({ bookingId, candidate }) => {
      socket.to(bookingId).emit("ice-candidate", { candidate });
    });

    // WebRTC Signaling: End call
    socket.on("end-call", ({ bookingId }) => {
      socket.to(bookingId).emit("call-ended");
    });

    // WebRTC Signaling: Media state toggle (mic mute / video toggle)
    socket.on("toggle-media", ({ bookingId, type, enabled }) => {
      socket.to(bookingId).emit("media-state-changed", { type, enabled });
    });

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
