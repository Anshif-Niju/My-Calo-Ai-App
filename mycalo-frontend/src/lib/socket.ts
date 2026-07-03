import { io, Socket } from "socket.io-client";

/**
 * Singleton Socket.IO client.
 *
 * The backend reads the `accessToken` httpOnly cookie forwarded automatically
 * by the browser when `withCredentials: true` is set — no manual token
 * passing required. The socket starts disconnected (`autoConnect: false`) and
 * connects only when `connectSocket()` is called (e.g. after login).
 */
let socket: Socket | null = null;

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace("/api", "");

/**
 * Returns (and lazily creates) the shared socket instance.
 * The socket is NOT connected until `connectSocket()` is called.
 */
export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,           // Forwards the httpOnly accessToken cookie
      autoConnect: false,              // Connect explicitly after login
      transports: ["websocket", "polling"],
    });
  }
  return socket;
};

/**
 * Connect the socket. Call this after the user successfully logs in.
 * Safe to call multiple times — no-op if already connected.
 */
export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

/**
 * Disconnect and destroy the singleton. Call this on logout.
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
