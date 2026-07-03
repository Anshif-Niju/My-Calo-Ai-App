import { Socket } from "socket.io";
import { AuthUserPayload } from "../types/index.js";

/**
 * An authenticated Socket.IO connection.
 * After socketAuth middleware runs, every socket in the app
 * has this shape — no `any` casts needed in event handlers.
 */
export interface SocketWithUser extends Socket {
  user: AuthUserPayload;
}
