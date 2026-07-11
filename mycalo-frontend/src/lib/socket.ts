import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const SOCKET_URL =
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api").replace("/api", "");

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

export const connectSocket = (): void => {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
