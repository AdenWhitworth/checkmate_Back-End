import { Move } from "chess.js";
import { predictNextMove, predictNextMoveWithStockfish } from "../../../chessBot/handleBotActions";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { BotMoveArgs } from "./BotMoveTypes";
import { admin, firestore } from "../../../services/firebaseService";

/**
 * Handles the bot's move by determining the next move based on the provided FEN and difficulty level.
 * 
 * @param {BotMoveArgs} botMoveArgs - The arguments containing the game state and bot configuration.
 * @param {Function} callback - The callback function to handle success or error responses.
 * @returns {Promise<void>} A promise that resolves when the bot's move is determined and the callback is invoked.
 */
export const handleBotMove = async (
  botMoveArgs: BotMoveArgs,
  callback: Function
): Promise<void> => {
    try {
        const { botGame, difficulty, fen, currentTurn, history } = botMoveArgs;

        if (!botGame || !botGame.gameId || !difficulty || !fen || !currentTurn || !history) {
            throw new Error("Invalid bot move data");
        }

        const gameRef = firestore.collection('botGames').doc(botGame.gameId);

        //const botMove: Move = await predictNextMove(history, difficulty);
        const botMove: Move = await predictNextMoveWithStockfish(history, difficulty)

        await firestore.runTransaction(async (transaction) => {
            const gameDoc = await transaction.get(gameRef);
            if (!gameDoc.exists) {
              throw new Error('Game not found');
            }
  
            const gameData = gameDoc.data();
            if (!gameData) throw new Error('Game data is missing');
  
            const serializedHistory = history.map((move) => JSON.stringify(move));
            serializedHistory.push(JSON.stringify(botMove));
  
            transaction.update(gameRef, {
              history: serializedHistory,
              fen: botMove.after,
              currentTurn: botMove.color === "w" ? "b" : "w",
              lastMoveTime: admin.firestore.Timestamp.now(),
            });
        });

        handleCallback(callback, false, "Successfully determined the bots next move", {botMove});
    } catch (error) {
      console.log(error);
      handleCallback(callback, true, extractErrorMessage(error));
    }
};