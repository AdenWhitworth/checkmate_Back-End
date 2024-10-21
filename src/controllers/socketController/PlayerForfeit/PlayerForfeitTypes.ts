import { Room } from "../../../types/gameTypes";

/**
 * Represents the arguments required when a player forfeits a game.
 * 
 * @interface ForfeitArgs
 * 
 * @property {Room} room - The room object where the forfeit is occurring, including the room ID and other relevant details.
 * @property {string} username - The username of the player who is forfeiting the game.
 */
export interface ForfeitArgs {
    room: Room;
    username: string;
}

/**
 * Represents the response received after a player forfeits a game.
 * 
 * @interface CallbackResponsePlayerForfeit
 * 
 * @property {string} message - The response message indicating the result of the forfeit event.
 */
export interface CallbackResponsePlayerForfeit {
    message: string;
}
