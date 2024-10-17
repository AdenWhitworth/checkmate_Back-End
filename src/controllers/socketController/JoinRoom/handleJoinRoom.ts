import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { Room, Player } from "../../../types/gameTypes";
import { CallbackResponseJoinRoom, JoinRoomArgs } from "./JoinRoomTypes";

export const handleJoinRoom = async (
  socket: Socket,
  joinRoomArgs: JoinRoomArgs,
  callback: Function,
  rooms: Map<string, Room>
) => {
  try {
    const room = rooms.get(joinRoomArgs.room.roomId);

    if (!room) {
      throw new Error('Room does not exist');
    }
    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }

    const newPlayer: Player = { id: socket.id, username: socket.data.username };
    room.players.push(newPlayer);

    const newJoinRoomArgs: JoinRoomArgs = {
      room: room
    }

    socket.timeout(1000).broadcast.to(joinRoomArgs.room.roomId).emit('opponentJoined', newJoinRoomArgs, (error: any, response: CallbackResponseJoinRoom[]) => {
      if (error) {
        handleCallback(callback, true, "Error broadcasting opponent joined");
        return;
      }
      
      if (response.length !== 1) {
        handleCallback(callback, true, "Unexpected number of responses");
        return;
      }
    
      const res = response[0];
    
      if (!res || !res.message) {
        handleCallback(callback, true, "Empty or invalid response");
        return;
      }

      rooms.set(joinRoomArgs.room.roomId, room);
    
      handleCallback(callback, false, res.message, newJoinRoomArgs);
    });

  } catch (error: any) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};
  