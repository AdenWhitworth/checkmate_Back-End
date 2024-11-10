import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { MoveArgs } from "./MoveTypes";
import { admin, firestore } from "../../../services/firebaseService";

/**
 * Handles broadcasting a move to all other clients in the specified room, updates the game state in Firestore, 
 * and processes the response from the recipients.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client making the move.
 * @param {MoveArgs} moveArgs - An object containing the details of the move and the game information.
 * @param {Game} moveArgs.game - The game object containing the game ID and player details.
 * @param {Object} moveArgs.move - The details of the move being made, such as the piece moved, start and end positions.
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives three arguments:
 *        - an error flag (`boolean`),
 *        - a message (`string`),
 *        - an optional move arguments object (`MoveArgs`).
 * 
 * @throws {Error} If the provided move data is invalid or incomplete.
 * 
 * @fires socket#recieveMove - Emits a "recieveMove" event to all other clients in the room, sending the move details and game information.
 * 
 * @returns {Promise<void>} Resolves when the move is successfully broadcast and saved, or an error is handled.
 */
export const handleMove = async (
  socket: Socket,
  moveArgs: MoveArgs,
  callback: Function
): Promise<void> => {
  try {
    const { game, move } = moveArgs;

    if (!game || !game.gameId || !move) {
      throw new Error('Invalid move data');
    }

    const gameRef = firestore.collection('games').doc(game.gameId);

    socket.timeout(1000).broadcast.to(game.gameId).emit('recieveMove', moveArgs, async (error: any, response: any) => {
      if (error) {
        handleCallback(callback, true, "Error broadcasting move to opponent");
        return;
      }

      if (response.length !== 1) {
        handleCallback(callback, true, "Unexpected number of responses");
        return;
      }

      const res = response[0];
      if (!res || !res.message) {
        handleCallback(callback, true, "Empty or invalid response");
        return;
      }

      try {
        await firestore.runTransaction(async (transaction) => {
          const gameDoc = await transaction.get(gameRef);
          if (!gameDoc.exists) {
            throw new Error('Game not found');
          }

          const gameData = gameDoc.data();
          if (!gameData) throw new Error('Game data is missing');

          const updatedMoveHistory = [...(gameData.moveHistory || []), move];
          transaction.update(gameRef, {
            moveHistory: updatedMoveHistory,
            lastMoveTime: admin.firestore.Timestamp.now(),
          });
        });

        handleCallback(callback, false, res.message, moveArgs);
      } catch (firestoreError) {
        handleCallback(callback, true, "Error updating game in Firestore");
      }
    });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
  