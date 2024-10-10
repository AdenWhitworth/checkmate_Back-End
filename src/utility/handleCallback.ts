import { Socket } from "socket.io";

export const handleCallback = (callback: Function, message: string, data?: any) => {
    callback({ message, ...data });
};

type ErrorEvents =
  | "closeRoomError"
  | "createRoomError"
  | "disconnectError"
  | "joinRoomError"
  | "moveError"
  | "playerForfeitError"
  | "sendGameMessageError"
  | "usernameError";

export const handleError = (socket: Socket, event: ErrorEvents, message: string) => {
    socket.emit(event, { errorEvent: event, message });
};

  