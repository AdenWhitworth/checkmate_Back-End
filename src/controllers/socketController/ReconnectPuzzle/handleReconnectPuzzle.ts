import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { firestore } from "../../../services/firebaseService";
import { Puzzle } from "../../../puzzles/processPuzzleTypes";
import { ReconnectPuzzleArgs } from "./ReconnectPuzzleTypes";

/**
 * Handles reconnecting a user to their active puzzle.
 * 
 * @param {ReconnectPuzzleArgs} reconnectPuzzleArgs - The arguments required to reconnect to the puzzle.
 * @param {Function} callback - The callback function to return success or error responses.
 * @returns {Promise<void>} - A promise that resolves when the puzzle is successfully fetched.
 */
export const handleReconnectPuzzle = async (
  reconnectPuzzleArgs: ReconnectPuzzleArgs,
  callback: Function
): Promise<void> => {
  try {
    const { activePuzzle } = reconnectPuzzleArgs;

    if (!activePuzzle?.puzzleId) {
      throw new Error("Invalid or missing parameters");
    }

    const puzzleRef = firestore.collection('puzzles').doc(activePuzzle.puzzleId);
    const puzzleDoc = await puzzleRef.get();

    if (!puzzleDoc.exists) {
      throw new Error(`No puzzle found with ID: ${activePuzzle.puzzleId}`);
    }

    const puzzleData = puzzleDoc.data() as Puzzle;

    if (!puzzleData) {
      throw new Error("Puzzle data is missing.");
    }

    handleCallback(callback, false, "Successfully reconnected to the puzzle", { puzzle: puzzleData });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};