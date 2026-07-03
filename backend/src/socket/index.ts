/**
 * Public API for the Socket.IO module.
 *
 * Usage:
 *   - Server startup:  import { initSocket } from "./socket"
 *   - Workers / jobs:  import { getIO }       from "./socket"
 */
export { initSocket, getIO } from "./socket.js";
export type { SocketWithUser } from "./types.js";
