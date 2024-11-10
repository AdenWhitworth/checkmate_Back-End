import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { ForfeitArgs, CallbackResponsePlayerForfeit } from "./PlayerForfeitTypes";

/**
 * Handles the event of a player forfeiting a game by broadcasting the forfeit message to all other clients
 * in the specified game room. It sends a notification to the remaining players, indicating that a player has forfeited.
 * 
 * @async
 * @function handlePlayerForfeited
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client who is forfeiting.
 * 
 * @param {ForfeitArgs} forfeitArgs - An object containing the details of the forfeit event.
 * @param {Game} forfeitArgs.game - The game object containing the game ID and player information.
 * @param {Player} forfeitArgs.player - The player who is forfeiting the game, including their userId and username.
 * 
 * @param {Function} callback - A callback function to be executed once the forfeit operation is complete.
 *        The callback receives two arguments:
 *        - an error flag (`boolean`)
 *        - a message (`string`)
 * 
 * @fires socket#playerForfeited - Emits a "playerForfeited" event to all other clients in the room,
 *                                 sending the details of the player who forfeited.
 * 
 * @throws {Error} If there is an error in broadcasting the forfeit event or if the response is invalid.
 * 
 * @returns {Promise<void>} Resolves when the forfeit event is successfully broadcast to the room,
 *                          or an error is handled and passed to the callback.
 */
export const handlePlayerForfeited = async (
  socket: Socket,
  forfeitArgs: ForfeitArgs,
  callback: Function
): Promise<void> => {
  try {
    socket.timeout(1000).broadcast.to(forfeitArgs.game.gameId).emit("playerForfeited", forfeitArgs, (error: any, response: CallbackResponsePlayerForfeit[]) => {
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

  