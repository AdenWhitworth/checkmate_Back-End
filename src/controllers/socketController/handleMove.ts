import { Socket } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";

export const handleMove = async (
  socket: Socket,
  data: { room: string, move: string },
  callback: Function
) => {
  try {
    if (!data.room || !data.move) {
      return handleCallback(callback, true, "Invalid move data.");
    }

    socket.timeout(1000).broadcast.to(data.room).emit('move', data.move, (err: Error | null, response: any) => {
      if (err) {
        handleCallback(callback, true, err.message || "Error making move");
      } else {
        handleCallback(callback, false, "Move made", { move: data.move });
      }
    });
  } catch (error) {
    handleCallback(callback, true, "Error making move", { error });
  }
};


  