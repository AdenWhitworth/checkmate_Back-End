import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";

export const handleSendGameMessage = async (
  socket: Socket,
  data: any,
  callback: Function
) => {
  try {
    if (!data || !data.item || !data.item.room) {
      return handleError(socket, "sendGameMessageError", "Invalid message data");
    }

    socket.timeout(1000).broadcast.to(data.item.room).emit('sendGameMessage', data, (err: Error | null, response: any) => {
      if (err) { 
        return handleError(socket, "sendGameMessageError", "Error sending game message");
      }
        
      handleCallback(callback, "Message received by opponent");
      
    });
  } catch (error) {
    handleError(socket, "sendGameMessageError", "Error sending game message");
  }
};

  