import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { firestore } from "../../../services/firebaseService";
import { ReconnectRoomArgs } from "./ReconnectRoomTypes";

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
 * @param {Game} reconnectRoomArgs.game - The game object, which includes the game ID, player details, and game state.
 * 
 * @param {Function} callback - A callback function to be executed once the reconnection process is complete.
 *        The callback receives three arguments:
 *        - an error flag (`boolean`),
 *        - a message (`string`),
 *        - an optional updated `ReconnectRoomArgs` object.
 * 
 * @throws {Error} If the `game` argument is missing or if the game document does not exist in Firestore.
 * 
 * @returns {Promise<void>} Resolves when the player is successfully reconnected to the game room or an error is handled.
 */
export const handleReconnectRoom = async (
    socket: Socket,
    reconnectRoomArgs: ReconnectRoomArgs,
    callback: Function,
): Promise<void> => {
  try {
    const userId = socket.data.userId;
    
    if (!reconnectRoomArgs.game) throw Error("Missing game arguments");

    socket.data.gameId = reconnectRoomArgs.game.gameId;
    await socket.join(reconnectRoomArgs.game.gameId);

    const gameRef = firestore.collection('games').doc(reconnectRoomArgs.game.gameId);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) throw new Error("Game does not exist.")

    const gameData = gameDoc.data();

    if (gameData?.playerA?.userId === userId) {
        await gameRef.update({ 'playerA.connected': true });
    } else if (gameData?.playerB?.userId === userId) {
        await gameRef.update({ 'playerB.connected': true });
    }

    handleCallback(callback, false, "Player reconnected successfully", reconnectRoomArgs);
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};