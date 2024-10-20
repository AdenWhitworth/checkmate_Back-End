import { Socket } from "socket.io";
import { Room, Player } from "../../../types/gameTypes";
import { DisconnectArgs } from "./DisconnectTypes";

export const handleDisconnect = (
  socket: Socket, 
  rooms: Map<string, Room>
) => {
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
  