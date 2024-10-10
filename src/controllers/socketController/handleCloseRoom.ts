import { Server, Socket } from "socket.io";
import { handleCallback, handleError } from "../../utility/handleCallback";
import { RemoteSocket } from "socket.io";
import { Room } from "../../types/gameTypes";

export const handleCloseRoom = async (
  io: Server,
  socket: Socket,
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
    handleCallback(callback, "Room closed");
  } catch (error) {
    handleError(socket, "closeRoomError","Error closing room");
  }
};



