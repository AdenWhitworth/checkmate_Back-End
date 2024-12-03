import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { firestore } from "../../../services/firebaseService";
import { Game } from "../CreateRoom/CreateRoomTypes";
import { ReconnectBotGameArgs } from "./ReconnectBotGameTypes";

/**
 * Handles the process of reconnecting a player to an existing bot game.
 *
 * @param {ReconnectBotGameArgs} reconnectBotGameArgs - The arguments required to reconnect to a bot game, including the game ID.
 * @param {Function} callback - The callback function to handle the result of the operation.
 * @returns {Promise<void>} Resolves when the reconnection process is successfully completed.
 * @throws {Error} Throws an error if the game ID is missing, the game does not exist, or game data is invalid.
 */
export const handleReconnectBotGame = async (
  reconnectBotGameArgs: ReconnectBotGameArgs,
  callback: Function
): Promise<void> => {
  const gameId = reconnectBotGameArgs.gameId;

  try {
    if(!gameId) throw new Error("Missing bot game ID");

    const gameRef = firestore.collection('botGames').doc(gameId);

    const {updatedGame} = await firestore.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists) throw new Error("Game does not exist.");

        const gameData = gameDoc.data() as Game;
        if (!gameData) throw new Error("Game information missing.");

        gameData.playerA.connected = true;
        transaction.update(gameRef, { 'playerA.connected': true });
        return {updatedGame: gameData};
    });

    handleCallback(callback, false, "Player reconnected successfully to the bot game", {botGame: updatedGame});
  } catch (error: any) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};