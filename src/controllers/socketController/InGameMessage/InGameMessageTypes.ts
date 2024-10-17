import { Room } from "../../../types/gameTypes";

export interface Message {
    message: string;
    time: string;
    username: string;
    room: Room;
    messageError: boolean;
}

export interface InGameMessageArgs {
    inGameMessage: Message
}

export interface CallbackResponseInGameMessage {
    message: string;
}