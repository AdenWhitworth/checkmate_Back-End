import { Socket } from "socket.io";
import { admin } from "../services/firebaseService";

/**
 * Middleware function to authenticate and authorize a socket connection using Firebase ID tokens.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {Function} next - A callback function to proceed to the next middleware or handler in the connection lifecycle.
 *                          Takes an optional `Error` argument to indicate a failure.
 * 
 * @description This middleware extracts the authentication token from the socket's handshake data, verifies it using Firebase's Admin SDK, 
 * and stores the decoded user information in `socket.data.user`. If verification fails, an error is passed to `next` to indicate that the 
 * client is not authorized.
 * 
 * @throws {Error} If the token is invalid or verification fails, it passes an error to the next middleware with the message "Not authorized".
 * 
 * @returns {Promise<void>} Resolves when the middleware completes the verification or throws an error.
 */
export const authMiddleware = async (socket: Socket, next: (err?: Error) => void): Promise<void> => {
  try {
    const token = socket.handshake.auth.token;
    const decodedIdToken = await admin.auth().verifyIdToken(token);
    socket.data.user = decodedIdToken;
    next();
  } catch (error) {
    next(new Error("Not authorized"));
  }
};
