import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { Room, Player } from "../../../types/gameTypes";
import { CallbackResponseJoinRoom, JoinRoomArgs } from "./JoinRoomTypes";

/**
 * Handles a player's attempt to join an existing room by validating the room, adding the player, and notifying others in the room.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the connected client.
 * @param {JoinRoomArgs} joinRoomArgs - An object containing the room information that the player wants to join.
 * @param {Room} joinRoomArgs.room - The room object with the ID of the room the player is attempting to join.
 * @param {Function} callback - A callback function to be executed once the operation is complete.
 *        The callback receives three arguments: an error flag (`boolean`), a message (`string`), and an optional updated room object.
 * @param {Map<string, Room>} rooms - A map containing all the active rooms, where the key is the room ID and the value is a `Room` object.
 * 
 * @throws {Error} If the room does not exist or is full.
 * 
 * @fires socket#opponentJoined - Emits an "opponentJoined" event to all other clients in the room, sending the updated room information.
 * 
 * @returns {Promise<void>} Resolves when the player is successfully added to the room, or an error is handled.
 */
export const handleJoinRoom = async (
  socket: Socket,
  joinRoomArgs: JoinRoomArgs,
  callback: Function,
  rooms: Map<string, Room>
): Promise<void> => {
  try {
    const room = rooms.get(joinRoomArgs.room.roomId);

    if (!room) {
      throw new Error('Room does not exist');
    }
    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }

    const newPlayer: Player = { id: socket.id, username: socket.data.username };
    room.players.push(newPlayer);

    const newJoinRoomArgs: JoinRoomArgs = {
      room: room
    }

    socket.timeout(3000).broadcast.to(joinRoomArgs.room.roomId).emit('opponentJoined', newJoinRoomArgs, async (error: any, response: CallbackResponseJoinRoom[]) => {
      if (error) {
        handleCallback(callback, true, "Error broadcasting opponent joined");
        return;
      }
      
      if (response.length !== 1) {
        handleCallback(callback, true, "Unexpected number of responses");
        return;
      }
    
      const res = response[0];
    
      if (!res || !res.message) {
        handleCallback(callback, true, "Empty or invalid response");
        return;
      }

      await socket.join(joinRoomArgs.room.roomId);
      rooms.set(joinRoomArgs.room.roomId, room);
    
      handleCallback(callback, false, res.message, newJoinRoomArgs);
    });

  } catch (error: any) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
  