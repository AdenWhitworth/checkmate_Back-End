import { Socket } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";
import { Room, Player } from "../../types/gameTypes";

export const handleJoinRoom = async (
  socket: Socket,
  args: { roomId: string },
  callback: Function,
  rooms: Map<string, Room>
) => {
  try {
    const room = rooms.get(args.roomId);

    if (!room) {
      return handleCallback(callback, true, "Room does not exist.");
    }
    if (room.players.length >= 2) {
      return handleCallback(callback, true, "Room is full.");
    }

    const newPlayer: Player = { id: socket.id, username: socket.data.username };
    room.players.push(newPlayer);
    rooms.set(args.roomId, room);

    socket.broadcast.to(args.roomId).emit('opponentJoined', { room });
    handleCallback(callback, false, "Joined room", { room });
  } catch (error) {
    handleCallback(callback, true, "Error joining room", { error });
  }
};

  