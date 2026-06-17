// import { Server as HttpServer } from "http";
// import { Server } from "socket.io";

// let io: Server;

// export function initSocket(httpServer: HttpServer) {
//   io = new Server(httpServer, {
//     cors: {
//       origin: process.env.FRONTEND_URL || "http://localhost:3000",
//       credentials: true,
//     },
//   });

//   io.on("connection", (socket) => {
//     console.log("✅ Socket connected:", socket.id);
//     socket.on("join-scan", (scanId: string, callback?: () => void) => {
//       console.log("JOIN", scanId);

//       socket.join(`scan:${scanId}`);

//       callback?.();
//     });

//     socket.on("disconnect", () => {
//       console.log("❌ Socket disconnected:", socket.id);
//     });
//   });

//   return io;
// }

// export function getIO() {
//   if (!io) throw new Error("Socket not initialized");
//   return io;
// }
