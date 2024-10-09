import { Server, Socket } from "socket.io";
import { v4 as uuidV4 } from "uuid";
import { validationResult } from "express-validator";
import { authMiddleware } from "../middleware/authMiddleware";

const rooms = new Map<string, any>();

export const setupSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      await authMiddleware(socket, next);
    } catch (err) {
      next(err as Error);
    }
  });

  io.on("connection", (socket: Socket) => {
    // Handle username event
    socket.on("username", async (username: string, callback: Function) => {
      socket.data.username = username;
      callback({ error: false, message: "Username added" });
    });

    // Handle room creation
    socket.on("createRoom", async (callback: Function) => {
      const roomId = uuidV4();
      socket.join(roomId);
      rooms.set(roomId, { players: [{ id: socket.id, username: socket.data.username }] });
      callback({ error: false, message: "Room created", roomId });
    });

    // Handle join room
    socket.on("joinRoom", async (data: { roomId: string }, callback: Function) => {
      const errors = validationResult(data);
      if (!errors.isEmpty()) {
        return callback({ error: true, message: errors.array() });
      }

      const room = rooms.get(data.roomId);
      if (!room || room.players.length >= 2) {
        return callback({ error: true, message: "Room is full or does not exist" });
      }

      socket.join(data.roomId);
      room.players.push({ id: socket.id, username: socket.data.username });
      callback({ error: false, message: "Joined room", room });
    });

    // Handle move
    socket.on("move", async (data: { room: string, move: string }, callback: Function) => {
      socket.broadcast.to(data.room).emit("move", data.move);
      callback({ error: false, message: "Move made" });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      rooms.forEach((room, roomId) => {
        room.players = room.players.filter((player: any) => player.id !== socket.id);
        if (room.players.length === 0) rooms.delete(roomId);
      });
    });
  });
};
