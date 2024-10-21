import { Room } from "../../../types/gameTypes";

/**
 * Represents the arguments required to close a room.
 * 
 * @interface CloseRoomArgs
 * 
 * @property {Room} room - The room object that needs to be closed. This should be an instance of the `Room` type.
 */
export interface CloseRoomArgs {
    room: Room, 
};