import { Socket } from "socket.io";
import { Room, Player } from "../../types/gameTypes";

export const handleDisconnect = (
  socket: Socket, 
  rooms: Map<string, Room>
) => {
  const gameRooms = Array.from(rooms.values());

  gameRooms.forEach((room: Room) => {
    const userInRoom = room.players.find((player: Player) => player.id === socket.id);

    if (userInRoom) {
      socket.broadcast.to(room.roomId).emit("playerDisconnected", userInRoom);
    }
  });
};
  