import { Server, Socket } from "socket.io";
import { handleUsername } from './handleUsername';
import { handleCreateRoom } from './handleCreateRoom';
import { handleJoinRoom } from './handleJoinRoom';
import { handleMove } from './handleMove';
import { handleDisconnect } from './handleDisconnect';
import { handlePlayerForfeited } from './handlePlayerForfeited';
import { handleCloseRoom } from './handleCloseRoom';
import { authMiddleware } from "../../middleware/authMiddleware";
import { Room } from "../../types/gameTypes";

const rooms = new Map<string, Room>();

export const setupSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      await authMiddleware(socket, next);
    } catch (err) {
      const error = new Error("Authorization failed") as any;
      error.data = { message: "You are not authorized" };
      next(error);
    }
  });

  io.on("connection", (socket: Socket) => {
    socket.on('username', (username: string, callback: Function) => handleUsername(socket, username, callback));
    socket.on('createRoom', (callback: Function) => handleCreateRoom(socket, callback, rooms));
    socket.on('joinRoom', (args: { roomId: string }, callback: Function) => handleJoinRoom(socket, args, callback, rooms));
    socket.on('move', (data: { room: string, move: string }, callback: Function) => handleMove(socket, data, callback));
    socket.on('disconnect', () => handleDisconnect(socket, rooms));
    socket.on('playerForfeited', (data: { roomId: string }, callback: Function) => handlePlayerForfeited(socket, data, callback));
    socket.on('closeRoom', (data: { roomId: string }, callback: Function) => handleCloseRoom(io, data, callback, rooms));
  });
};



