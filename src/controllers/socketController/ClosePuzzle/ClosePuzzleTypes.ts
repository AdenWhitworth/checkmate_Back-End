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