import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";
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
      return handleError(socket, "joinRoomError", "Room does not exist.");
    }
    if (room.players.length >= 2) {
      return handleError(socket, "joinRoomError", "Room is full.");
    }

    const newPlayer: Player = { id: socket.id, username: socket.data.username };
    room.players.push(newPlayer);
    rooms.set(args.roomId, room);

    socket.broadcast.to(args.roomId).emit('opponentJoined', { room });
    handleCallback(callback, "Joined room", { room });
  } catch (error: any) {
    handleError(socket, "joinRoomError", "Error joining room");
  }
};
  