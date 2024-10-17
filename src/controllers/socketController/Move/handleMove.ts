import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { MoveArgs, CallbackResponseMove } from "./MoveTypes";

export const handleMove = async (
  socket: Socket,
  moveArgs: MoveArgs,
  callback: Function
) => {
  try {
    if (!moveArgs.room || !moveArgs.move) {
      throw new Error('Invalid move data');
    }

    socket.timeout(1000).broadcast.to(moveArgs.room.roomId).emit('move', moveArgs, (error: any, response: CallbackResponseMove[]) => {  
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


  