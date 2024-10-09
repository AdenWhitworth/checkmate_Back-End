import { Socket } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";

export const handleUsername = async (
  socket: Socket, 
  username: string, 
  callback: Function
) => {
  try {
    if (!username || username.trim() === '') {
      return handleCallback(callback, true, "Invalid username.");
    }
    socket.data.username = username;
    handleCallback(callback, false, "Username added");
  } catch (error) {
    handleCallback(callback, true, "Error adding username", { error });
  }
};
  