import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required when a player reconnects to a game.
 * 
 * @interface ReconnectRoomArgs
 * 
 * @property {Game} game - The game object associated with the game being reconnected to. 
 *                         This includes details such as the game ID, players, board state, current status, and move history.
 */
export interface ReconnectRoomArgs {
    game: Game
}