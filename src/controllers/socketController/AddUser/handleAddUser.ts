import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { AddUserArgs } from "./AddUserTypes";

export const handleAddUser = async (
  socket: Socket, 
  addUserArgs: AddUserArgs, 
  callback: Function
) => {
  try {
    if (!addUserArgs.username || addUserArgs.username.trim() === '') {
      throw new Error('Invalid username');
    }

    socket.data.username = addUserArgs.username;
    handleCallback(callback, false, "Username added");
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
  