/**
 * Represents the arguments required to close a chess puzzle.
 *
 * @interface ClosePuzzleArgs
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the puzzle being closed.
 * @property {string} puzzleId - The unique identifier of the puzzle being closed.
 * @property {number} timeToComplete - The time taken to complete the puzzle, in seconds.
 */
export interface ClosePuzzleArgs {
    difficulty: "easy" | "medium" | "hard";
    puzzleId: string;
    timeToComplete: number;
}

/**
 * Represents a chess puzzle that has been completed by a user.
 *
 * @interface CompletedPuzzle
 * @property {string} puzzleId - The unique identifier of the completed puzzle.
 * @property {FirebaseFirestore.Timestamp} completedAt - The timestamp indicating when the puzzle was completed.
 * @property {number} timeToComplete - The time taken to complete the puzzle, in seconds.
 */
export interface CompletedPuzzle {
    puzzleId: string;
    completedAt: FirebaseFirestore.Timestamp;
    timeToComplete: number;
}