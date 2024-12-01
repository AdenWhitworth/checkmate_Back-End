/**
 * Represents the arguments required to calculate a move hint in a chess game.
 *
 * @interface MoveHintArgs
 * @property {string} fen - The current board state in Forsyth-Edwards Notation (FEN).
 * @property {"w" | "b"} currentTurn - Indicates whose turn it is to play ("w" for white, "b" for black).
 */
export interface MoveHintArgs {
    fen: string;
    currentTurn: "w" | "b";
};