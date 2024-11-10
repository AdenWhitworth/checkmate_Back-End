import { Game } from "../CreateRoom/CreateRoomTypes";
import { Move } from "chess.js";

/**
 * Represents the arguments required to broadcast a move within a game room.
 * 
 * @interface MoveArgs
 * 
 * @property {Game} game - The game object associated with the move being made.
 * @property {string} move - The details of the move being made, typically represented as a string.
 */
export interface MoveArgs {
    game: Game, 
    move: Move
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