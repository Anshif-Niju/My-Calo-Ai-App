import { Socket } from "socket.io";
import { AuthUserPayload } from "../types/index.js";

export interface SocketWithUser extends Socket {
  user: AuthUserPayload;
}
