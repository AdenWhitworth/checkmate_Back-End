import { Room } from "../../../types/gameTypes";

export interface Message {
    id: string;
    message: string;
    time: string;
    username: string;
    room: Room;
    status: "sending" | "delivered" | "error";
}

export interface InGameMessageArgs {
    inGameMessage: Message
}

export interface CallbackResponseInGameMessage {
    message: string;
}