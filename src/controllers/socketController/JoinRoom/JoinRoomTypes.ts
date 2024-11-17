import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required for a player to join an existing game room.
 * This includes the details of the game that the player is attempting to join.
 * 
 * @interface JoinRoomArgs
 * 
 * @property {string} gameId - The gameId for the game being joined.
 */
export interface JoinRoomArgs {
    gameId: string;
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

/**
 * Represents the arguments required by the opponent joining the game.
 * @interface CloseRoomArgs
 * @property {Game} game - The game joined by the opponent.
 */
export interface OpponentJoinedArgs {
    game: Game, 
};