import { Server } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { RemoteSocket } from "socket.io";
import { Room } from "../../../types/gameTypes";
import { CloseRoomArgs } from "./CloseRoomTypes";

/**
 * Handles the closing of a specified room by removing all connected client sockets from it and 
 * deleting the room entry from the rooms map.
 * 
 * @param {Server} io - The Socket.IO server instance to manage client connections and room interactions.
 * @param {CloseRoomArgs} closeRoomArgs - An object containing the room information that needs to be closed.
 * @param {Room} closeRoomArgs.room - The room object that needs to be closed.
 * @param {Function} callback - A callback function to be executed once the operation is complete. 
 *        The callback receives three arguments: an error flag (`boolean`), a message (`string`), and the `CloseRoomArgs` object.
 * @param {Map<string, Room>} rooms - A map storing all the active rooms, where the key is the room ID and the value is a `Room` object.
 * 
 * @throws {Error} If an error occurs while fetching sockets, removing clients, or closing the room.
 * 
 * @returns {Promise<void>} Resolves when the room is successfully closed, or an error is handled.
 */
export const handleCloseRoom = async (
  io: Server,
  closeRoomArgs: CloseRoomArgs,
  callback: Function,
  rooms: Map<string, Room>
): Promise<void> => {
  try {
    const clientSockets: RemoteSocket<Record<string, any>, any>[] = await io.in(closeRoomArgs.room.roomId).fetchSockets();

    clientSockets.forEach((remoteSocket: RemoteSocket<Record<string, any>, any>) => {
      remoteSocket.leave(closeRoomArgs.room.roomId);
    });

    rooms.delete(closeRoomArgs.room.roomId);
    handleCallback(callback, false, "Room successfully closed", closeRoomArgs);
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};



