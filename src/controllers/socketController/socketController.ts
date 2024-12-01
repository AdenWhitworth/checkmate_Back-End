import { Server, Socket } from "socket.io";
import { handleAddUser } from './AddUser/handleAddUser';
import { handleCreateRoom } from './CreateRoom/handleCreateRoom';
import { handleJoinRoom } from './JoinRoom/handleJoinRoom';
import { handleMove } from './Move/handleMove';
import { handleDisconnect } from './Disconnect/handleDisconnect';
import { handlePlayerForfeited } from './PlayerForfeit/handlePlayerForfeit';
import { handleCloseRoom } from './CloseRoom/handleCloseRoom';
import { handleSendGameMessage } from "./InGameMessage/handleInGameMessage";
import { handleReconnectRoom } from "./ReconnectRoom/handleReconnectRoom";
import { authMiddleware } from "../../middleware/authMiddleware";
import { CreateRoomArgs } from "./CreateRoom/CreateRoomTypes";
import { AddUserArgs } from "./AddUser/AddUserTypes";
import { JoinRoomArgs } from "./JoinRoom/JoinRoomTypes";
import { MoveArgs } from "./Move/MoveTypes";
import { ForfeitArgs } from "./PlayerForfeit/PlayerForfeitTypes";
import { CloseRoomArgs } from "./CloseRoom/CloseRoomTypes";
import { InGameMessageArgs } from "./InGameMessage/InGameMessageTypes";
import { ReconnectRoomArgs } from "./ReconnectRoom/ReconnectRoomTypes";
import { BotMoveArgs } from "./BotMove/BotMoveTypes";
import { handleBotMove } from "./BotMove/handleBotMove";
import { CreateBotGameArgs } from "./CreateBotGame/CreateBotGameTypes";
import { handleCreateBotGame } from "./CreateBotGame/handleCreateBotGame";
import { MoveHintArgs } from "./MoveHint/MoveHintTypes";
import { handleMoveHint } from "./MoveHint/handleMoveHint";
import { CloseBotGameArgs } from "./CloseBotGame/CloseBotGameTypes";
import { handleCloseBotGame } from "./CloseBotGame/handleCloseBotGames";
import { ReconnectBotGameArgs } from "./ReconnectBotGame/ReconnectBotGameTypes";
import { handleReconnectBotGame } from "./ReconnectBotGame/handleReconnectBotGame";

/**
 * Sets up the Socket.IO server with authentication middleware and event handlers.
 *
 * @param {Server} io - The Socket.IO server instance to initialize.
 *
 * @description This function configures authentication middleware using `authMiddleware` 
 * and registers event listeners for various socket events:
 * 
 * **Event Handlers:**
 * - `addUser`: Adds a user to the socket connection.
 * - `createRoom`: Creates a new room and adds the user.
 * - `joinRoom`: Joins an existing room if not full.
 * - `sendMove`: Broadcasts a game move to other players in the room.
 * - `disconnect`: Handles user disconnection.
 * - `playerForfeited`: Broadcasts a forfeit event.
 * - `closeRoom`: Closes a room and removes users.
 * - `sendGameMessage`: Sends an in-game message to players.
 * - `reconnectRoom`: Reconnects a player to a room.
 * - `getBotMove`: Determines the bot's next move.
 * - `createBotGame`: Creates a new bot game.
 * - `closeBotGame`: Closes an existing bot game.
 * - `moveHint`: Provides a hint for the next best move.
 * - `reconnectBotGame`: Reconnects a player to a bot game.
 *
 * Middleware:
 * - `authMiddleware`: Ensures authorization for socket connections.
 *
 * @fires socket#addUser
 * @fires socket#createRoom
 * @fires socket#joinRoom
 * @fires socket#sendMove
 * @fires socket#disconnect
 * @fires socket#playerForfeited
 * @fires socket#closeRoom
 * @fires socket#sendGameMessage
 * @fires socket#reconnectRoom
 * @fires socket#getBotMove
 * @fires socket#createBotGame
 * @fires socket#closeBotGame
 * @fires socket#moveHint
 * @fires socket#reconnectBotGame
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
    socket.on('createRoom', (createRoomArgs: CreateRoomArgs, callback: Function) => handleCreateRoom(socket, createRoomArgs, callback));
    socket.on('joinRoom', (joinRoomArgs: JoinRoomArgs, callback: Function) => handleJoinRoom(socket, joinRoomArgs, callback));
    socket.on('sendMove', (moveArgs: MoveArgs, callback: Function) => handleMove(socket, moveArgs, callback));
    socket.on('disconnect', () => handleDisconnect(socket));
    socket.on('playerForfeited', (forfeitArgs: ForfeitArgs, callback: Function) => handlePlayerForfeited(socket, forfeitArgs, callback));
    socket.on('closeRoom', (closeRoomArgs: CloseRoomArgs, callback: Function) => handleCloseRoom(io, closeRoomArgs, callback));
    socket.on('sendGameMessage', (inGameMessageArgs: InGameMessageArgs, callback: Function) => handleSendGameMessage(socket, inGameMessageArgs, callback));
    socket.on('reconnectRoom', (reconnectRoomArgs: ReconnectRoomArgs, callback: Function) => handleReconnectRoom(socket, reconnectRoomArgs, callback));
    socket.on('getBotMove', (botMoveArgs: BotMoveArgs, callback: Function) => handleBotMove(botMoveArgs, callback));
    socket.on('createBotGame', (createBotGameArgs: CreateBotGameArgs, callback: Function) => handleCreateBotGame(socket, createBotGameArgs, callback));
    socket.on('closeBotGame', (closeBotGameArgs: CloseBotGameArgs, callback: Function) => handleCloseBotGame(closeBotGameArgs, callback));
    socket.on('moveHint', (moveHintArgs: MoveHintArgs, callback: Function) => handleMoveHint(moveHintArgs, callback));
    socket.on('reconnectBotGame', (reconnectBotGameArgs: ReconnectBotGameArgs, callback: Function) => handleReconnectBotGame(reconnectBotGameArgs, callback));
  });
};



