import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { InGameMessageArgs, CallbackResponseInGameMessage } from "./InGameMessageTypes";

/**
 * Handles sending an in-game message to the specified room and processes the response from the recipient(s).
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {InGameMessageArgs} inGameMessageArgs - An object containing the in-game message data, including the room information and message content.
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives two arguments: an error flag (`boolean`) and a message (`string`).
 * 
 * @throws {Error} If the provided in-game message data is invalid or incomplete.
 * 
 * @returns {Promise<void>} Resolves when the message is successfully sent or an error is handled.
 */
export const handleSendGameMessage = async (
  socket: Socket,
  inGameMessageArgs: InGameMessageArgs,
  callback: Function
): Promise<void> => {
  try {

    if (!inGameMessageArgs.inGameMessage.game.gameId || !inGameMessageArgs.inGameMessage.message) {
      throw new Error('Invalid message data');
    }

    socket.timeout(1000).broadcast.to(inGameMessageArgs.inGameMessage.game.gameId).emit('receiveGameMessage', inGameMessageArgs, (error: any, response: CallbackResponseInGameMessage[]) => {  
      if (error) {
        handleCallback(callback, true, "Error broadcasting message to opponent");
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

  