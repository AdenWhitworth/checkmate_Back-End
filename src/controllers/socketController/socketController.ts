import { Server, Socket } from "socket.io";
import { handleAddUser } from './AddUser/handleAddUser';
import { handleCreateRoom } from './CreateRoom/handleCreateRoom';
import { handleJoinRoom } from './JoinRoom/handleJoinRoom';
import { handleMove } from './Move/handleMove';
import { handleDisconnect } from './Disconnect/handleDisconnect';
import { handlePlayerForfeited } from './PlayerForfeit/handlePlayerForfeit';
import { handleCloseRoom } from './CloseRoom/handleCloseRoom';
import { handleSendGameMessage } from "./InGameMessage/handleInGameMessage";
import { authMiddleware } from "../../middleware/authMiddleware";
import { Room } from "../../types/gameTypes";
import { AddUserArgs } from "./AddUser/AddUserTypes";
import { JoinRoomArgs } from "./JoinRoom/JoinRoomTypes";
import { MoveArgs } from "./Move/MoveTypes";
import { ForfeitArgs } from "./PlayerForfeit/PlayerForfeitTypes";
import { CloseRoomArgs } from "./CloseRoom/CloseRoomTypes";
import { InGameMessageArgs } from "./InGameMessage/InGameMessageTypes";

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
    socket.on('addUser', (addUserArgs: AddUserArgs, callback: Function) => handleAddUser(socket, addUserArgs, callback));
    socket.on('createRoom', (callback: Function) => handleCreateRoom(socket, callback, rooms));
    socket.on('joinRoom', (joinRoomArgs: JoinRoomArgs, callback: Function) => handleJoinRoom(socket, joinRoomArgs, callback, rooms));
    socket.on('sendMove', (moveArgs: MoveArgs, callback: Function) => handleMove(io, socket, rooms, moveArgs, callback));
    socket.on('disconnect', () => handleDisconnect(socket, rooms));
    socket.on('playerForfeited', (forfeitArgs: ForfeitArgs, callback: Function) => handlePlayerForfeited(socket, forfeitArgs, callback));
    socket.on('closeRoom', (closeRoomArgs: CloseRoomArgs, callback: Function) => handleCloseRoom(io, closeRoomArgs, callback, rooms));
    socket.on('sendGameMessage', (inGameMessageArgs: InGameMessageArgs, callback: Function) => handleSendGameMessage(socket, inGameMessageArgs, callback));
  });
};



