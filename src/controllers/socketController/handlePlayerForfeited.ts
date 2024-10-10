import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";

export const handlePlayerForfeited = async (
  socket: Socket,
  data: { roomId: string },
  callback: Function
) => {
  try {
    socket.timeout(1000).broadcast.to(data.roomId).emit("playerForfeited", data, (err: Error | null, response: any) => {
      if (err) {
        return handleError(socket, "playerForfeitError", "Error forfeiting the game");
      }
      
      handleCallback(callback, "Opponent recieved your forgeit.");
      
    });
  } catch (error) {
    handleError(socket, "playerForfeitError", "Error forfeiting the game");
  }
};

  