import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { firestore, admin } from "../../../services/firebaseService";
import { StartPuzzleArgs } from "./StartPuzzleTypes";
import { Puzzle } from "../../../puzzles/processPuzzleTypes";
import { Socket } from "socket.io";

/**
 * Handles the initialization of a new chess puzzle for a user.
 * 
 * This function performs the following operations:
 * - Fetches the next unplayed puzzle based on the user's progress.
 * - Updates the user's Firestore document to set the puzzle as active.
 * - Sends the puzzle data back to the client via the callback.
 * 
 * @param {Socket} socket - The Socket.IO connection object containing user information.
 * @param {StartPuzzleArgs} startPuzzleArgs - The arguments required to start a puzzle.
 * @param {"easy" | "medium" | "hard"} startPuzzleArgs.difficulty - The difficulty level of the puzzle to start.
 * @param {LastPuzzle} startPuzzleArgs.lastPuzzle - Object containing the last completed puzzle number for each difficulty.
 * @param {Function} callback - The callback function to handle success or error responses.
 * 
 * @returns {Promise<void>} A promise that resolves when the puzzle is successfully started or rejects with an error.
 * 
 * @throws {Error} If required parameters are missing, the next puzzle cannot be found, or Firestore operations fail.
 */
export const handleStartPuzzle = async (
  socket: Socket,
  startPuzzleArgs: StartPuzzleArgs,
  callback: Function
): Promise<void> => {
  try {

    const { difficulty, lastPuzzle } = startPuzzleArgs;

    if (!difficulty || !lastPuzzle || !socket.data.userId) {
      throw new Error("Invalid or missing parameters");
    }

    const lastPuzzleNumber: number = lastPuzzle[difficulty];
    const userId = socket.data.userId;

    const puzzlesRef = firestore.collection('puzzles');
    const nextPuzzleSnapshot = await puzzlesRef
      .where("difficulty", "==", difficulty)
      .where("puzzleNumber", "==", lastPuzzleNumber + 1)
      .limit(1)
      .get();

    if (nextPuzzleSnapshot.empty) {
      throw new Error(`No unplayed puzzles found for difficulty: ${difficulty}`);
    }

    const puzzleDoc = nextPuzzleSnapshot.docs[0];
    const puzzleData = puzzleDoc.data() as Puzzle;

    if (!puzzleData) {
      throw new Error("Puzzle data is missing");
    }

    const userRef = firestore.collection('users').doc(userId);
    await userRef.update({
      activePuzzle: {
        puzzleId: puzzleDoc.id,
        difficulty,
        puzzleNumber: lastPuzzleNumber + 1,
        startedAt: admin.firestore.Timestamp.now(),
      },
    });

    handleCallback(callback, false, "Successfully fetched the puzzle", { puzzle: puzzleData });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
