import { Socket } from "socket.io";
import { handleCallback, extractErrorMessage } from "../../../utility/handleCallback";
import { ForfeitArgs, CallbackResponsePlayerForfeit } from "./PlayerForfeitTypes";

export const handlePlayerForfeited = async (
  socket: Socket,
  forfeitArgs: ForfeitArgs,
  callback: Function
) => {
  try {
    socket.timeout(1000).broadcast.to(forfeitArgs.room.roomId).emit("playerForfeited", forfeitArgs, (error: any, response: CallbackResponsePlayerForfeit[]) => {
      if (error) {
        handleCallback(callback, true, "Error broadcasting player forfeited");
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
      
      handleCallback(callback, false, res.message);
    });
  } catch (error) {
    handleCallback(callback, true, extractErrorMessage(error));
  }
};

  