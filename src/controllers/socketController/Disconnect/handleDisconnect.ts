import { Socket } from "socket.io";
import { firestore } from "../../../services/firebaseService";

/**
 * Handles the disconnection of a player by updating their connection status in the Firestore database
 * and notifying other players in the game room. This function ensures that the game's state remains
 * consistent when a player disconnects unexpectedly.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the disconnecting client.
 * 
 * @fires socket#playerDisconnected - Emits a "playerDisconnected" event to all other clients in the room when a player disconnects.
 * The event sends an object containing information about the disconnecting player.
 * 
 * @returns {Promise<void>} Resolves when the player's disconnection status is successfully updated in Firestore.
 */
export const handleDisconnect = async (
  socket: Socket,
): Promise<void> => {
  const gameId = socket.data.gameId;
  const userId = socket.data.userId;

  if (gameId && userId) {
    const gameRef = firestore.collection('games').doc(gameId);
    const gameDoc = await gameRef.get();

    if (gameDoc.exists) {
      const gameData = gameDoc.data();
      
      if (gameData?.playerA?.userId === userId) {
        await gameRef.update({ 'playerA.connected': false });
      } else if (gameData?.playerB?.userId === userId) {
        await gameRef.update({ 'playerB.connected': false });
      }
    }
  }
};
  