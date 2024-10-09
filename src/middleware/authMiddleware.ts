import { Socket } from "socket.io";
import admin from "../services/firebaseService";

export const authMiddleware = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    const decodedIdToken = await admin.auth().verifyIdToken(token);
    socket.data.user = decodedIdToken;
    next();
  } catch (error) {
    next(new Error("Not authorized"));
  }
};
