import { Room } from "../../../types/gameTypes"

export interface MoveArgs {
    room: Room, 
    move: string
};

export interface CallbackResponseMove {
    message: string;
}