import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { ForfeitArgs, CallbackResponsePlayerForfeit } from "./PlayerForfeitTypes";

/**
 * Handles the event of a player forfeiting a game by broadcasting the forfeit message to all other clients in the specified room.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {ForfeitArgs} forfeitArgs - An object containing the details of the forfeit event, including the room and player information.
 * @param {Room} forfeitArgs.room - The room object where the forfeit is occurring, including the room ID.
 * @param {Object} forfeitArgs.player - The player who is forfeiting the game.
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives two arguments: an error flag (`boolean`) and a message (`string`).
 * 
 * @throws {Error} If there is an error in broadcasting the forfeit or if the response is invalid.
 * 
 * @fires socket#playerForfeited - Emits a "playerForfeited" event to all other clients in the room, sending the forfeit details.
 * 
 * @returns {Promise<void>} Resolves when the forfeit event is successfully broadcast, or an error is handled.
 */
export const handlePlayerForfeited = async (
  socket: Socket,
  forfeitArgs: ForfeitArgs,
  callback: Function
): Promise<void> => {
  try {
    socket.timeout(1000).broadcast.to(forfeitArgs.room.roomId).emit("playerForfeited", forfeitArgs, (error: any, response: CallbackResponsePlayerForfeit[]) => {
      if (error) {
        handleCallback(callback, true, "Error broadcasting player forfeited");
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
      
      handleCallback(callback, false, res.message);
    });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};

  