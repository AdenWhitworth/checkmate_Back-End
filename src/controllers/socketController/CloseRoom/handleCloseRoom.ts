import { Server, Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { RemoteSocket } from "socket.io";
import { Room } from "../../../types/gameTypes";
import { CloseRoomArgs } from "./CloseRoomTypes";

export const handleCloseRoom = async (
  io: Server,
  closeRoomArgs: CloseRoomArgs,
  callback: Function,
  rooms: Map<string, Room>
) => {
  try {
    const clientSockets: RemoteSocket<Record<string, any>, any>[] = await io.in(closeRoomArgs.room.roomId).fetchSockets();

    clientSockets.forEach((remoteSocket: RemoteSocket<Record<string, any>, any>) => {
      remoteSocket.leave(closeRoomArgs.room.roomId);
    });

    rooms.delete(closeRoomArgs.room.roomId);
    handleCallback(callback, false, "Room successfully closed", closeRoomArgs);
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};



