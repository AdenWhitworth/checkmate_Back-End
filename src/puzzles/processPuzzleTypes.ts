/**
 * Represents the structure of a chess puzzle with metadata and solution details.
 *
 * @interface Puzzle
 * @property {string} PuzzleId - Unique identifier for the puzzle.
 * @property {string} FEN - Forsyth-Edwards Notation (FEN) for the chessboard state.
 * @property {string[]} Moves - Array of moves in the solution, represented as strings.
 * @property {number} Rating - Rating of the puzzle indicating its difficulty level.
 * @property {number} RatingDeviation - Deviation in the rating, providing a measure of uncertainty.
 * @property {number} Popularity - Popularity score of the puzzle, based on user engagement.
 * @property {number} NbPlays - Number of times the puzzle has been played.
 * @property {string[]} Themes - Array of themes associated with the puzzle (e.g., 'mate', 'endgame').
 * @property {string} GameUrl - URL pointing to the game from which the puzzle was derived.
 * @property {string | null} OpeningTags - Tags for the opening associated with the puzzle, if available.
 * @property {"easy" | "medium" | "hard"} Difficulty - Calculated difficulty level of the puzzle, based on its rating.
 */
export interface Puzzle {
    PuzzleId: string;
    FEN: string;
    Moves: string[];
    Rating: number;
    RatingDeviation: number;
    Popularity: number;
    NbPlays: number;
    Themes: string[];
    GameUrl: string;
    OpeningTags: string | null;
    Difficulty: "easy" | "medium" | "hard";
}

  