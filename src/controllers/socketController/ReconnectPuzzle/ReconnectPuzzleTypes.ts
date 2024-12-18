/**
 * Represents the currently active chess puzzle for a user.
 *
 * @interface ActivePuzzle
 * @property {string} puzzleId - The unique identifier of the active puzzle.
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the active puzzle.
 * @property {number} puzzleNumber - The sequential number of the puzzle within its difficulty level.
 * @property {FirebaseFirestore.Timestamp} startedAt - The timestamp indicating when the puzzle was started.
 */
export interface ActivePuzzle {
    puzzleId: string;
    difficulty: "easy" | "medium" | "hard";
    puzzleNumber: number;
    startedAt: FirebaseFirestore.Timestamp;
}

/**
 * Represents the arguments required when a player reconnects to a puzzle.
 * 
 * @interface ReconnectPuzzleArgs
 * 
 * @property {ActivePuzzle} activePuzzle - The active puzzle object for the current puzzle available for the player.
 */
export interface ReconnectPuzzleArgs {
    activePuzzle: ActivePuzzle;
}