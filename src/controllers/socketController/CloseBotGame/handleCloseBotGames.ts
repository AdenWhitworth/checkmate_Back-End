import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { updateBotGameResult } from "../../../utility/gameResultHandler";
import { CloseBotGameArgs } from "./CloseBotGameTypes";

/**
 * Handles the closure of a bot game by validating input, updating the game result, 
 * and invoking a callback with the result.
 *
 * @param {CloseBotGameArgs} closeBotGameArgs - The arguments required to close a bot game.
 * @param {Function} callback - The callback function to handle the result of the operation.
 * @returns {Promise<void>} Resolves when the bot game has been successfully handled.
 * @throws Will throw an error if the gameId or userIds are invalid.
 */
export const handleCloseBotGame = async (
  closeBotGameArgs: CloseBotGameArgs,
  callback: Function,
): Promise<void> => {
  try {
    const gameId = closeBotGameArgs.botGame.gameId;

    if (!gameId || !closeBotGameArgs.botGame.playerA.userId || !closeBotGameArgs.botGame.playerB.userId) {
      throw new Error('Invalid gameId, userId or result');
    }

    await updateBotGameResult(closeBotGameArgs.botGame);

    handleCallback(callback, false, "Bot game successfully closed", closeBotGameArgs);
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};