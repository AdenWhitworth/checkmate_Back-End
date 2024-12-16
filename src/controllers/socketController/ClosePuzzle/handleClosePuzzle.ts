import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { admin, firestore } from "../../../services/firebaseService";
import { ClosePuzzleArgs, CompletedPuzzle } from "./ClosePuzzleTypes";
import { Socket } from "socket.io";

/**
 * Handles the closure of an active chess puzzle using subcollections for completed puzzles.
 *
 * This function performs the following operations:
 * - Validates the input arguments and the user's active puzzle.
 * - Adds the puzzle as a new document in the `completedPuzzles` subcollection.
 * - Updates the `lastPuzzle` number for the corresponding difficulty.
 * - Removes the `activePuzzle` field from the user's document.
 *
 * @param {Socket} socket - The Socket.IO connection object containing user information.
 * @param {ClosePuzzleArgs} closePuzzleArgs - The arguments required to close the puzzle.
 * @param {Function} callback - The callback function to handle success or error responses.
 * @returns {Promise<void>} A promise that resolves when the puzzle is closed successfully or rejects with an error.
 *
 * @throws {Error} If the user ID is missing, parameters are invalid, or the active puzzle does not match the one being closed.
 */
export const handleClosePuzzle = async (
  socket: Socket,
  closePuzzleArgs: ClosePuzzleArgs,
  callback: Function,
): Promise<void> => {
  try {
    if (!socket.data.userId) throw Error("Socket username and userId required.");
    const userId = socket.data.userId;

    const { difficulty, puzzleId, timeToComplete } = closePuzzleArgs;
    if (!difficulty || !puzzleId || !timeToComplete) {
      throw Error("Invalid or missing parameters.");
    }

    const userRef = firestore.collection("users").doc(userId);
    const completedPuzzlesRef = userRef.collection("completedPuzzles");
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw Error("User document not found.");
    }

    const userData = userDoc.data();

    const activePuzzle = userData?.activePuzzle;
    if (!activePuzzle || activePuzzle.puzzleId !== puzzleId || activePuzzle.difficulty !== difficulty) {
      throw Error("No matching active puzzle found to close.");
    }

    const completedPuzzle: CompletedPuzzle = {
      puzzleId: activePuzzle.puzzleId,
      completedAt: admin.firestore.Timestamp.now(),
      timeToComplete,
    };

    await firestore.runTransaction(async (transaction) => {
      const userDocSnapshot = await transaction.get(userRef);

      if (!userDocSnapshot.exists) {
        throw Error("User document not found during transaction.");
      }

      const lastPuzzleNumber = userDocSnapshot.data()?.lastPuzzle?.[difficulty] || 0;

      const completedPuzzleRef = completedPuzzlesRef.doc();
      transaction.set(completedPuzzleRef, {
        ...completedPuzzle,
        difficulty,
      });

      transaction.update(userRef, {
        [`lastPuzzle.${difficulty}`]: lastPuzzleNumber + 1,
        activePuzzle: admin.firestore.FieldValue.delete(),
      });
    });

    handleCallback(callback, false, "Successfully closed the puzzle");
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};

