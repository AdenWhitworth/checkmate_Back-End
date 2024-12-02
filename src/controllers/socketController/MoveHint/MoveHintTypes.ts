import { Move } from "chess.js";

/**
 * Represents the arguments required to calculate a move hint in a chess game.
 *
 * @interface MoveHintArgs
 * @property {string} fen - The current board state in Forsyth-Edwards Notation (FEN).
 * @property {"w" | "b"} currentTurn - Indicates whose turn it is to play ("w" for white, "b" for black).
 * @property {Move[]} history - The history of all chess moves made so far in the game.
 */
export interface MoveHintArgs {
    fen: string;
    currentTurn: "w" | "b";
    history: Move[];
};