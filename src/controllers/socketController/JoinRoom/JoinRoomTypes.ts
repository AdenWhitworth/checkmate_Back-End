import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required for a player to join an existing game room.
 * This includes the details of the game that the player is attempting to join.
 * 
 * @interface JoinRoomArgs
 * 
 * @property {Game} game - The game object containing all relevant information about the game session.
 *                         This includes the game ID, player details, board state, and current game status.
 */
export interface JoinRoomArgs {
    game: Game;
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
