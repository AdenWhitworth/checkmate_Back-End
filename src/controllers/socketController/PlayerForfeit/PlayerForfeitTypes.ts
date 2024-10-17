import { Room } from "../../../types/gameTypes"

export interface ForfeitArgs {
    room: Room, 
    username: string
};

export interface CallbackResponsePlayerForfeit {
    message: string;
}