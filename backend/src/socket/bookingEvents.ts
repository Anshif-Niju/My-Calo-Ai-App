import { Server as SocketIOServer } from "socket.io";
import { ChatMessage } from "../models/ChatMessage.model.js";
import { Booking } from "../models/Booking.model.js";
import { SocketWithUser } from "./types.js";
import { logger } from "../utils/logger.js";

export const registerBookingEvents = (io: SocketIOServer): void => {
  io.on("connection", (socket) => {
    const authedSocket = socket as SocketWithUser;
    socket.on("join-booking", async ({ bookingId }: { bookingId: string }) => {
      try {
        if (!bookingId) {
          socket.emit("error", { message: "bookingId is required" });
          return;
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
          socket.emit("error", { message: "Booking not found" });
          return;
        }

        const userId = authedSocket.user.userId;
        const isParticipant =
          booking.userId.toString() === userId ||
          booking.doctorId.toString() === userId;

        if (!isParticipant) {
          socket.emit("error", { message: "Unauthorized: not a participant of this booking" });
          logger.warn(`⛔ Unauthorized join-booking attempt: user=${userId} booking=${bookingId}`);
          return;
        }

        socket.join(bookingId);

        // Notify other participants that someone connected
        socket.to(bookingId).emit("user-connected", { userId });

        logger.info(`🚪 User ${userId} joined booking room ${bookingId}`);
      } catch (err) {
        logger.error("join-booking error:", err);
        socket.emit("error", { message: "Failed to join booking room" });
      }
    });

    // ─────────────────────────────────────────────────────────────────────────
    // send-message
    // Frontend sends: { bookingId, senderType, message, messageType?, fileUrl? }
    // senderId comes from socket.user — never trusted from frontend
    // ─────────────────────────────────────────────────────────────────────────
    socket.on(
      "send-message",
      async ({
        bookingId,
        senderType,
        message,
        messageType,
        fileUrl,
      }: {
        bookingId: string;
        senderType: "user" | "doctor";
        message: string;
        messageType?: "text" | "file" | "call_log";
        fileUrl?: string;
      }) => {
        try {
          const chatMsg = await ChatMessage.create({
            bookingId,
            senderId: authedSocket.user.userId, // Always from JWT, never from frontend
            senderType,
            message,
            messageType: messageType ?? "text",
            fileUrl,
          });

          io.to(bookingId).emit("new-message", chatMsg);
        } catch (err) {
          logger.error("send-message error:", err);
          socket.emit("error", { message: "Failed to send message" });
        }
      }
    );

    // ─────────────────────────────────────────────────────────────────────────
    // WebRTC Signaling — relay only, no business logic changes
    // ─────────────────────────────────────────────────────────────────────────

    socket.on("call-user", ({ bookingId, offer }: { bookingId: string; offer: unknown }) => {
      socket.to(bookingId).emit("incoming-call", { offer });
    });

    socket.on("answer-call", ({ bookingId, answer }: { bookingId: string; answer: unknown }) => {
      socket.to(bookingId).emit("call-answered", { answer });
    });

    socket.on("ice-candidate", ({ bookingId, candidate }: { bookingId: string; candidate: unknown }) => {
      socket.to(bookingId).emit("ice-candidate", { candidate });
    });

    socket.on("end-call", ({ bookingId }: { bookingId: string }) => {
      socket.to(bookingId).emit("call-ended");
    });

    socket.on(
      "toggle-media",
      ({ bookingId, type, enabled }: { bookingId: string; type: "audio" | "video"; enabled: boolean }) => {
        socket.to(bookingId).emit("media-state-changed", { type, enabled });
      }
    );
  });
};
