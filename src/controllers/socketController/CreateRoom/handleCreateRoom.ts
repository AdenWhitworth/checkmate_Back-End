import { v4 as uuidV4 } from "uuid";
import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { Room } from "../../../types/gameTypes";

/**
 * Handles the creation of a new room by generating a unique room ID, joining the socket to the room, 
 * and storing the room information in a provided rooms map.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {Function} callback - A callback function to be executed once the operation is complete. 
 *        The callback receives three arguments: an error flag (`boolean`), a message (`string`), and an object containing the created room details.
 * @param {Map<string, Room>} rooms - A map storing all the active rooms, where the key is the room ID and the value is a `Room` object.
 * 
 * @throws {Error} If the socket does not have a `username` set in its data.
 * 
 * @returns {Promise<void>} Resolves when the room is successfully created, or an error is handled.
 */
export const handleCreateRoom = async (
  socket: Socket,
  callback: Function,
  rooms: Map<string, Room>
): Promise<void> => {
  try {
    if (!socket.data.username) throw Error("Socket username required.")
    const roomId = uuidV4();
    await socket.join(roomId);

    const newRoom: Room = {
      roomId,
      players: [{ id: socket.id, username: socket.data.username }],
    };

    rooms.set(roomId, newRoom);
    handleCallback(callback, false, "Room successfully created", { room: newRoom});
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};

