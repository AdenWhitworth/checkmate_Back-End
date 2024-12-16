/**
 * Tracks the last completed puzzle number for each difficulty level.
 *
 * @interface LastPuzzle
 * @property {number} easy - The number of the last completed puzzle for "easy" difficulty.
 * @property {number} medium - The number of the last completed puzzle for "medium" difficulty.
 * @property {number} hard - The number of the last completed puzzle for "hard" difficulty.
 */
export interface LastPuzzle {
    easy: number;
    medium: number;
    hard: number;
}

/**
 * Represents the arguments required to start a new chess puzzle.
 *
 * @interface StartPuzzleArgs
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the puzzle to start.
 * @property {LastPuzzle} lastPuzzle - An object containing the last completed puzzle number for each difficulty.
 */
export interface StartPuzzleArgs {
    difficulty: "easy" | "medium" | "hard";
    lastPuzzle: LastPuzzle;
}