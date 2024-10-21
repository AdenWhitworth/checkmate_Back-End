import { Socket } from "socket.io";
import { Room, Player } from "../../../types/gameTypes";
import { DisconnectArgs } from "./DisconnectTypes";

/**
 * Handles the disconnection of a player by finding and notifying all rooms where the player was present.
 * 
 * @param {Socket} socket - The Socket.IO socket instance representing the disconnecting client.
 * @param {Map<string, Room>} rooms - A map containing all the active rooms, where the key is the room ID and the value is a `Room` object.
 * 
 * @fires socket#playerDisconnected - Emits a "playerDisconnected" event to all other clients in the room when a player disconnects.
 * The event sends an object containing information about the disconnecting player.
 * 
 * @returns {void} This function does not return a value.
 */
export const handleDisconnect = (
  socket: Socket, 
  rooms: Map<string, Room>
): void => {
  const gameRooms = Array.from(rooms.values());

  gameRooms.forEach((room: Room) => {

    const userInRoom: Player | undefined = room.players.find((player: Player) =>player.id === socket.id);

    if (userInRoom) {

      const disconnectArgs: DisconnectArgs = {
        player: userInRoom
      }

      socket.broadcast.to(room.roomId).emit("playerDisconnected", disconnectArgs);
    }
  });
};
  