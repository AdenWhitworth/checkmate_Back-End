import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { CallbackResponseJoinRoom, JoinRoomArgs, OpponentJoinedArgs } from "./JoinRoomTypes";
import { firestore } from "../../../services/firebaseService";
import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Handles a player's attempt to join an existing game room by validating the room's state,
 * updating the player's connection status, and notifying other players in the room.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 *        This socket instance contains the `userId` in its data.
 * 
 * @param {JoinRoomArgs} joinRoomArgs - An object containing information about the game the player wants to join.
 * @param {Game} joinRoomArgs.gameId - The game ID for the game being requested to join.
 * 
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives three arguments:
 *        - an error flag (`boolean`),
 *        - a message (`string`),
 *        - an optional updated room object (`JoinRoomArgs`).
 * 
 * @throws {Error} If the game does not exist, if the game data is missing, or if the game room is full.
 * 
 * @fires socket#opponentJoined - Emits an "opponentJoined" event to all other clients in the room,
 *                                sending the updated room information when a player joins.
 * 
 * @returns {Promise<void>} Resolves when the player is successfully added to the game room or if an error is handled.
 */
export const handleJoinRoom = async (
  socket: Socket,
  joinRoomArgs: JoinRoomArgs,
  callback: Function,
): Promise<void> => {
  try {
    const gameId = joinRoomArgs.gameId;
    const gameRef = firestore.collection('games').doc(gameId);

    const opponentJoinedArgs: OpponentJoinedArgs = await firestore.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists) {
        throw new Error("Game with this ID does not exist.");
      }

      const gameData = gameDoc.data() as Game;
      if (!gameData) {
        throw new Error("Game data is missing");
      }

      if (gameData.playerA.connected && gameData.playerB.connected) {
        throw new Error("Game is full");
      }
      if (gameData.playerB.connected) {
        throw new Error("Player B is already connected");
      }

      transaction.update(gameRef, { 'playerB.connected': 'pending' });

      const userRef = firestore.collection('users').doc(gameData.playerB.userId);

      const opponentJoinedArgs: OpponentJoinedArgs = { game: gameData };
      opponentJoinedArgs.game.playerB.connected = true;

      const success = await new Promise<boolean>((resolve) => {
        socket.timeout(3000).broadcast.to(gameId).emit(
          'opponentJoined',
          opponentJoinedArgs,
          (error: any, response: CallbackResponseJoinRoom[]) => {
            if (error || !response || response.length !== 1 || !response[0]?.message) {
              resolve(false);
            } else {
              resolve(true);
            }
          }
        );
      });

      if (!success) {
        transaction.update(gameRef, { 'playerB.connected': false });
        throw new Error("Error broadcasting opponent joined");
      }

      transaction.update(gameRef, { 'playerB.connected': true });
      transaction.update(userRef, { currentGameId: gameId });
      await socket.join(gameId);

      return opponentJoinedArgs;
    });

    handleCallback(callback, false, "Player B joined successfully", opponentJoinedArgs);
  } catch (error: any) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
  