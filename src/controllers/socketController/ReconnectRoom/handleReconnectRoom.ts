import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { firestore } from "../../../services/firebaseService";
import { ReconnectRoomArgs } from "./ReconnectRoomTypes";
import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Handles a player's attempt to reconnect to an existing game room.
 * If the player was previously disconnected, this function updates their connection status in Firestore 
 * and re-joins them to the appropriate Socket.IO room.
 * 
 * @async
 * @function handleReconnectRoom
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the reconnecting client.
 *        The socket contains the `userId` in its data, which is used to identify the player.
 * 
 * @param {ReconnectRoomArgs} reconnectRoomArgs - An object containing details about the game the player is reconnecting to.
 * @param {string} reconnectRoomArgs.gameId - The game ID to reconnect to.
 * 
 * @param {Function} callback - A callback function to be executed once the reconnection process is complete.
 *        The callback receives three arguments:
 *        - an error flag (`boolean`),
 *        - a message (`string`),
 *        - an optional updated `ReconnectRoomArgs` object.
 * 
 * @throws {Error} If the `gameId` argument is missing or if the game document does not exist in Firestore.
 * 
 * @returns {Promise<void>} Resolves when the player is successfully reconnected to the game room or an error is handled.
 */
export const handleReconnectRoom = async (
  socket: Socket,
  reconnectRoomArgs: ReconnectRoomArgs,
  callback: Function
): Promise<void> => {
  const userId = socket.data.userId;
  const gameId = reconnectRoomArgs.gameId;

  try {
    if(!gameId) throw new Error("Missing game ID");

    const gameRef = firestore.collection('games').doc(gameId);

    socket.data.gameId = gameId;
    await socket.join(gameId);

    const {updatedGame, updatedPlayer} = await firestore.runTransaction(async (transaction) => {
      const gameDoc = await transaction.get(gameRef);
      if (!gameDoc.exists) throw new Error("Game does not exist.");

      const gameData = gameDoc.data() as Game;
      if (!gameData) throw new Error("Game information missing.");

      let updatedPlayer = null;
      if (gameData.playerA.userId === userId) {
        updatedPlayer = 'playerA';
        gameData.playerA.connected = true;
        transaction.update(gameRef, { 'playerA.connected': true });
      } else if (gameData.playerB.userId === userId) {
        updatedPlayer = 'playerB';
        gameData.playerB.connected = true;
        transaction.update(gameRef, { 'playerB.connected': true });
      } else {
        throw new Error("Player not found in this game.");
      }

      return {updatedGame: gameData, updatedPlayer};
    });

    const success = await new Promise<boolean>((resolve) => {
      socket.timeout(3000).broadcast.to(gameId).emit('roomReconnected', {game: updatedGame, connectUserId: updatedPlayer}, (error: any, response: any) => {
        if(updatedGame.playerA.connected && updatedGame.playerB.connected){
          if (error || !response || response.length !== 1 || !response[0]?.message) {
            resolve(false);
          } else {
            resolve(true);
          }
        } else {
          resolve(true);
        }
      });
    });

    if (!success) {
      await gameRef.update({ [`${updatedGame.playerA.userId === userId ? 'playerA' : 'playerB'}.connected`]: false });
      handleCallback(callback, true, "Error broadcasting room reconnected");
      return;
    }

    handleCallback(callback, false, "Player reconnected successfully", {game: updatedGame});
  } catch (error: any) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
