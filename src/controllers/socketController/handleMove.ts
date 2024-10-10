import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";

export const handleMove = async (
  socket: Socket,
  data: { room: string, move: string },
  callback: Function
) => {
  try {
    if (!data.room || !data.move) {
      return handleError(socket, "moveError", "Invalid move data.");
    }

    socket.timeout(1000).broadcast.to(data.room).emit('move', data.move, (err: Error | null, response: any) => {
      if (err) {
        return handleError(socket, "moveError", "Error making move");
      } 
        
      handleCallback(callback, "Move made", { move: data.move });
      
    });
  } catch (error) {
    handleError(socket, "moveError", "Error making move");
  }
};


  