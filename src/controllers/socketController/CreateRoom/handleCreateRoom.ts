import { v4 as uuidV4 } from "uuid";
import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { Room } from "../../../types/gameTypes";

export const handleCreateRoom = async (
  socket: Socket,
  callback: Function,
  rooms: Map<string, Room>
) => {
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

