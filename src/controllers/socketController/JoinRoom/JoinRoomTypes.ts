import { Room } from "../../../types/gameTypes";

/**
 * Represents the arguments required for a player to join a room.
 * 
 * @interface JoinRoomArgs
 * 
 * @property {Room} room - The room object that the player is attempting to join. This should include the room's ID and other relevant details.
 */
export interface JoinRoomArgs {
    room: Room;
}

/**
 * Represents the response received after a player attempts to join a room.
 * 
 * @interface CallbackResponseJoinRoom
 * 
 * @property {string} message - The response message indicating the result of the join room attempt.
 */
export interface CallbackResponseJoinRoom {
    message: string;
}
