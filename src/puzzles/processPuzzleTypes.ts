/**
 * Represents a chess puzzle stored in Firestore.
 *
 * @interface Puzzle
 * @property {string} puzzleTag - A unique identifier for the puzzle (e.g., "easy-001").
 * @property {string} fen - The Forsyth-Edwards Notation (FEN) string representing the initial chessboard state of the puzzle.
 * @property {string[]} moves - An array of moves in UCI format that represent the solution to the puzzle.
 * @property {number} rating - The difficulty rating of the puzzle, typically based on Elo.
 * @property {number} ratingDeviation - The deviation in the puzzle's rating, indicating its reliability.
 * @property {number} popularity - A score representing how popular the puzzle is among players.
 * @property {number} numberPlays - The number of times the puzzle has been attempted.
 * @property {string[]} themes - An array of themes or tags associated with the puzzle (e.g., "mateIn2", "endgame").
 * @property {string | null} openingTags - Tags describing the opening associated with the puzzle, or `null` if not applicable.
 * @property {"easy" | "medium" | "hard"} difficulty - The difficulty level of the puzzle.
 * @property {string} [puzzleId] - An optional unique identifier for the puzzle in Firestore.
 * @property {number} puzzleNumber - The sequential number of the puzzle within its difficulty level.
 */
export interface Puzzle {
    puzzleTag: string;
    fen: string;
    moves: string[];
    rating: number;
    ratingDeviation: number;
    popularity: number;
    numberPlays: number;
    themes: string[];
    openingTags: string | null;
    difficulty: "easy" | "medium" | "hard";
    puzzleId?: string;
    puzzleNumber: number;
}

  