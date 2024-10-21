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

/**
 * Sets up Socket.IO server event handlers and authentication middleware.
 * 
 * @param {Server} io - The Socket.IO server instance to set up event listeners and middleware.
 * 
 * @description This function initializes middleware for authentication and defines event handlers for various socket events such as:
 * - `addUser`: To add a new user to a socket connection.
 * - `createRoom`: To create a new room and add the user to it.
 * - `joinRoom`: To join an existing room if not full.
 * - `sendMove`: To broadcast a game move to other players in the room.
 * - `disconnect`: To handle disconnection of a user from a room.
 * - `playerForfeited`: To broadcast a player forfeit event to other players in the room.
 * - `closeRoom`: To close a specified room and remove all users.
 * - `sendGameMessage`: To send an in-game message to other players in the room.
 * 
 * Middleware:
 * - Uses `authMiddleware` for authorization checks on socket connection.
 * 
 * @fires socket#addUser - Adds a user to the socket connection.
 * @fires socket#createRoom - Creates a new room and adds the user.
 * @fires socket#joinRoom - Joins an existing room if it is not full.
 * @fires socket#sendMove - Broadcasts a game move to other players in the room.
 * @fires socket#disconnect - Handles user disconnection from a room.
 * @fires socket#playerForfeited - Broadcasts a forfeit event to other players in the room.
 * @fires socket#closeRoom - Closes a specified room and removes all users.
 * @fires socket#sendGameMessage - Sends an in-game message to other players in the room.
 * 
 * @returns {void} This function does not return any value.
 */
export const setupSocket = (io: Server): void => {
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



