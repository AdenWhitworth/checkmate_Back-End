import { Server } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { RemoteSocket } from "socket.io";
import { firestore, admin } from "../../../services/firebaseService";
import { CloseRoomArgs, Opponent } from "./CloseRoomTypes";
import { updateGameResult } from "../../../utility/gameResultHandler";

/**
 * Handles the closing of a specified game room by removing all connected client sockets, 
 * deleting the game entry if the invite was cancelled, or updating the game result if the game was played.
 * 
 * @param {Server} io - The Socket.IO server instance used to manage client connections and room interactions.
 * @param {CloseRoomArgs} closeRoomArgs - An object containing the game and room information that needs to be closed.
 * @param {Game} closeRoomArgs.game - The game object associated with the room that is being closed. 
 *        Includes details such as gameId, playerA, playerB, and winner.
 * @param {boolean} closeRoomArgs.inviteCancelled - Indicates whether the room was closed due to an invite cancellation.
 * @param {Opponent} closeRoomArgs.opponent - the opponent object associated with the opponent closing the game room.
 * @param {Function} callback - A callback function to be executed once the operation is complete. 
 *        The callback receives three arguments: an error flag (`boolean`), a message (`string`), 
 *        and the `CloseRoomArgs` object.
 * 
 * @throws {Error} If an error occurs while fetching sockets, removing clients, or closing the game room.
 * 
 * @returns {Promise<void>} Resolves when the room is successfully closed or an error is handled.
 */
export const handleCloseRoom = async (
  io: Server,
  closeRoomArgs: CloseRoomArgs,
  callback: Function,
): Promise<void> => {
  try {
    const gameId = closeRoomArgs.game.gameId;
    const opponentUserId = closeRoomArgs.opponent?.opponentUserId;
    const opponentInviteId = closeRoomArgs.opponent?.opponentInviteId;

    if (!gameId || !closeRoomArgs.game.playerA.userId || !closeRoomArgs.game.playerB.userId) {
      throw new Error('Invalid gameId, userId or result');
    }

    const clientSockets: RemoteSocket<Record<string, any>, any>[] = await io.in(gameId).fetchSockets();

    clientSockets.forEach((remoteSocket: RemoteSocket<Record<string, any>, any>) => {
      remoteSocket.leave(gameId);
    });

    if (closeRoomArgs.inviteCancelled){
      if (!opponentUserId || !opponentInviteId) {
        throw new Error('Opponent user ID and invite ID are required to cancel the invitation');
      }

      const gameRef = firestore.collection('games').doc(gameId);

      const invitationRef = firestore
        .collection('users')
        .doc(opponentUserId)
        .collection('invites')
        .doc(opponentInviteId);

      const playerAUsersRef = firestore.collection('users').doc(closeRoomArgs.game.playerA.userId);

      await firestore.runTransaction(async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        const inviteDoc = await transaction.get(invitationRef);

        if (!gameDoc.exists) {
          throw new Error('Game not found');
        }
        if (!inviteDoc.exists) {
          throw new Error('Invitation not found');
        }
        
        transaction.update(playerAUsersRef, { currentGameId: admin.firestore.FieldValue.delete()});

        transaction.delete(gameRef);
        transaction.delete(invitationRef);
      });

    } else {
      await updateGameResult(closeRoomArgs.game);
    }

    handleCallback(callback, false, "Game successfully closed", closeRoomArgs);
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};



