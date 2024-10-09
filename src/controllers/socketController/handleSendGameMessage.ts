import { Socket } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";

export const handleSendGameMessage = async (
  socket: Socket,
  data: any,
  callback: Function
) => {
  try {
    if (!data || !data.item || !data.item.room) {
      return handleCallback(callback, true, "Invalid message data.");
    }

    socket.timeout(1000).broadcast.to(data.item.room).emit('sendGameMessage', data, (err: Error | null, response: any) => {
      if (err) {
        handleCallback(callback, true, err.message || "Failed to send message");
      } else {
        handleCallback(callback, false, "Message received");
      }
    });
  } catch (error) {
    handleCallback(callback, true, "Error sending game message", { error });
  }
};

  