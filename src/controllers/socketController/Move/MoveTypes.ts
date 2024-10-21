import { Room } from "../../../types/gameTypes"

/**
 * Represents the arguments required to broadcast a move within a game room.
 * 
 * @interface MoveArgs
 * 
 * @property {Room} room - The room object where the move is being made. This includes the room's ID and other relevant details.
 * @property {string} move - The details of the move being made, typically represented as a string.
 */
export interface MoveArgs {
    room: Room, 
    move: string
};

/**
 * Represents the response received after a move is broadcast to the game room.
 * 
 * @interface CallbackResponseMove
 * 
 * @property {string} message - The response message indicating the result of the move broadcast.
 */
export interface CallbackResponseMove {
    message: string;
}