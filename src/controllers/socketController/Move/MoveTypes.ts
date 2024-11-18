import { Game } from "../CreateRoom/CreateRoomTypes";
import { Move } from "chess.js";

/**
 * Represents the arguments required to broadcast a move within a game room.
 * 
 * @interface MoveArgs
 * @property {Game} moveArgs.game - The game object containing the game ID and player details.
 * @property {Move} moveArgs.move - The details of the move being made, such as the piece moved, start and end positions.
 * @property {Move[]} moveArgs.history - An array of all the moves made during the game.
 * @property {string} moveArgs.fen - The current chess fen of the board state.
 * @property {"w" | "b"} moveArgs.currentTurn - the player whose turn it is.
 */
export interface MoveArgs {
    game: Game; 
    move: Move;
    history: Move[];
    fen: string;
    currentTurn: "w" | "b";
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