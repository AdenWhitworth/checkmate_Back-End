import { Room } from "../../../types/gameTypes"

export interface JoinRoomArgs {
    room: Room
};

export interface CallbackResponseJoinRoom {
    message: string;
}