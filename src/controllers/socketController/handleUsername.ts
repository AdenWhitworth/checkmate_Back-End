import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";

export const handleUsername = async (
  socket: Socket, 
  username: string, 
  callback: Function
) => {
  try {
    if (!username || username.trim() === '') {
      return handleError(socket, "usernameError", "Invalid username");
    }

    socket.data.username = username;
    handleCallback(callback, "Username added");
  } catch (error) {
    handleError(socket, "usernameError", "Error adding username");
  }
};
  