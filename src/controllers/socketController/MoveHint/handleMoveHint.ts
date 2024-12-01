import { Move } from "chess.js";
import { determineNextBotMove, determineNextBotMoveSimple } from "../../../chessBot/handleBotActions";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { MoveHintArgs } from "./MoveHintTypes";

/**
 * Handles the calculation of a move hint for a chess game by analyzing the current board state
 * and determining the best possible move for the given position.
 *
 * @param {MoveHintArgs} moveHintArgs - The arguments required to calculate a move hint, including FEN and the current turn.
 * @param {Function} callback - The callback function to handle the result of the operation.
 * @returns {Promise<void>} Resolves when the move hint is successfully determined and returned.
 * @throws {Error} Throws an error if the FEN string or current turn is invalid or if an error occurs during move calculation.
 */
export const handleMoveHint = async (
  moveHintArgs: MoveHintArgs,
  callback: Function
): Promise<void> => {
    try {
        const { fen, currentTurn } = moveHintArgs;

        if (!fen || !currentTurn) {
            throw new Error("Invalid chess data for hint");
        }

        //const botMove: Move = await determineNextBotMove(difficulty, fen, currentTurn);
        const bestMove: Move = await determineNextBotMoveSimple(fen);

        handleCallback(callback, false, "Successfully determined the best next move", {move: bestMove});
    } catch (error) {
        handleCallback(callback, true, extractErrorMessage(error));
    }
};