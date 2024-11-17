import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required when a player forfeits a game.
 * 
 * @interface ForfeitArgs
 * 
 * @property {Game} game - The game object associated with the forfeited game. 
 *                         This includes details such as the game ID, players, board state, current status, and move history.
 * @property {string} username - Username of the player forfeiting.
 */
export interface ForfeitArgs {
    game: Game;
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
