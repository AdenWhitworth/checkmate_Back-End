import { Server, Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { MoveArgs, CallbackResponseMove } from "./MoveTypes";
import { Room } from "../../../types/gameTypes";

/**
 * Handles broadcasting a move to all other clients in the specified room and processes the response from the recipients.
 * 
 * @param {Server} io - The Socket.IO server instance to manage client connections and room interactions.
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {Map<string, Room>} rooms - A map containing all the active rooms, where the key is the room ID and the value is a `Room` object.
 * @param {MoveArgs} moveArgs - An object containing the move details and the room information.
 * @param {Room} moveArgs.room - The room object where the move is being made, including the room ID.
 * @param {Object} moveArgs.move - The details of the move being made.
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives three arguments: an error flag (`boolean`), a message (`string`), and an optional move arguments object.
 * 
 * @throws {Error} If the provided move data is invalid or incomplete.
 * 
 * @fires socket#recieveMove - Emits a "recieveMove" event to all other clients in the room, sending the move details and room information.
 * 
 * @returns {Promise<void>} Resolves when the move is successfully broadcast, or an error is handled.
 */
export const handleMove = async (
  io: Server,
  socket: Socket,
  rooms: Map<string, Room>,
  moveArgs: MoveArgs,
  callback: Function
): Promise<void> => {
  try {
    if (!moveArgs.room || !moveArgs.move) {
      throw new Error('Invalid move data');
    }

    socket.timeout(1000).broadcast.to(moveArgs.room.roomId).emit('recieveMove', moveArgs, (error: any, response: any) => {  
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
      
      handleCallback(callback, false, res.message, moveArgs);
    });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};


  