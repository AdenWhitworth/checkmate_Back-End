import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { AddUserArgs } from "./AddUserTypes";

/**
 * Handles adding a user by setting their username in the socket data and invoking a callback with an appropriate message.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {AddUserArgs} addUserArgs - An object containing the arguments for adding a user.
 * @param {string} addUserArgs.username - The username to be added. Must be a non-empty string.
 * @param {string} addUserArgs.userId - The unique identifier for the user. Must be a non-empty string.
 * @param {Function} callback - A callback function to be executed once the operation is complete. The callback receives two arguments: an error flag (`boolean`) and a message (`string`).
 * 
 * @throws {Error} If the provided `username` or `userId` is invalid or empty.
 * 
 * @returns {Promise<void>} Resolves when the user is successfully added or an error is handled.
 */
export const handleAddUser = async (
  socket: Socket, 
  addUserArgs: AddUserArgs, 
  callback: Function
): Promise<void> => {
  try {
    const username = addUserArgs.username;
    const userId = addUserArgs.userId;

    if (!username || username.trim() === '' || !userId) {
      throw new Error('Invalid username or userId');
    }

    if (socket.data.username !== username) {
      socket.data.username = username;
    }

    if (socket.data.userId !== userId) {
      socket.data.userId = userId;
    }
    handleCallback(callback, false, "Username added");
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};