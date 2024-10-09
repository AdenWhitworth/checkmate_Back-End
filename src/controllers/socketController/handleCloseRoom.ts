import { Server } from "socket.io";
import { handleCallback } from "../../utility/handleCallback";
import { RemoteSocket } from "socket.io";
import { Room } from "../../types/gameTypes";

export const handleCloseRoom = async (
  io: Server,
  data: { roomId: string },
  callback: Function,
  rooms: Map<string, Room>
) => {
  try {
    const clientSockets: RemoteSocket<Record<string, any>, any>[] = await io.in(data.roomId).fetchSockets();

    clientSockets.forEach((remoteSocket: RemoteSocket<Record<string, any>, any>) => {
      remoteSocket.leave(data.roomId);
    });

    rooms.delete(data.roomId);
    handleCallback(callback, false, "Room closed");
  } catch (error) {
    handleCallback(callback, true, "Error closing room", { error });
  }
};



