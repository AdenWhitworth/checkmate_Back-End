import { v4 as uuidV4 } from "uuid";
import { Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";
import { Room } from "../../types/gameTypes";

export const handleCreateRoom = async (
  socket: Socket,
  callback: Function,
  rooms: Map<string, Room>
) => {
  try {
    const roomId = uuidV4();
    await socket.join(roomId);

    const newRoom: Room = {
      roomId,
      players: [{ id: socket.id, username: socket.data.username }],
    };

    rooms.set(roomId, newRoom);

    handleCallback(callback, "Room created", { roomId });
  } catch (error) {
    handleError(socket, "createRoomError","Error creating room");
  }
};

