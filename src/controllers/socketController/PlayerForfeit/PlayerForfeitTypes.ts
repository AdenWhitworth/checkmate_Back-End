import { Game, Player } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required when a player forfeits a game.
 * 
 * @interface ForfeitArgs
 * 
 * @property {Game} game - The game object associated with the forfeited game. 
 *                         This includes details such as the game ID, players, board state, current status, and move history.
 * 
 * @property {Player} player - The player who is forfeiting the game. 
 *                             This includes details like the player's userId, username, Elo rating, and connection status.
 */
export interface ForfeitArgs {
    game: Game;
    player: Player;
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
