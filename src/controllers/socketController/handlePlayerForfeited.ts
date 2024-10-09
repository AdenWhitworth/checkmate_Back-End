import { Socket } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";

export const handlePlayerForfeited = async (
  socket: Socket,
  data: { roomId: string },
  callback: Function
) => {
  try {
    socket.timeout(1000).broadcast.to(data.roomId).emit("playerForfeited", data, (err: Error | null, response: any) => {
      if (err) {
        handleCallback(callback, true, err.message || "Error forfeiting");
      } else {
        handleCallback(callback, false, "Player forfeited");
      }
    });
  } catch (error) {
    handleCallback(callback, true, "Error forfeiting", { error });
  }
};

  