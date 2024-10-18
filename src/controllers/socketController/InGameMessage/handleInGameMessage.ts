import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { InGameMessageArgs, CallbackResponseInGameMessage } from "./InGameMessageTypes";

export const handleSendGameMessage = async (
  socket: Socket,
  inGameMessageArgs: InGameMessageArgs,
  callback: Function
) => {
  try {

    if (!inGameMessageArgs.inGameMessage.room.roomId || !inGameMessageArgs.inGameMessage.message) {
      throw new Error('Invalid message data');
    }

    socket.timeout(1000).broadcast.to(inGameMessageArgs.inGameMessage.room.roomId).emit('receiveGameMessage', inGameMessageArgs, (error: any, response: CallbackResponseInGameMessage[]) => {  
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

  