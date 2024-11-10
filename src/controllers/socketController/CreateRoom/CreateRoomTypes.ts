/**
 * Represents a player in the game.
 * 
 * @interface Player
 * 
 * @property {string} userId - The unique identifier for the player.
 * @property {string} username - The display name of the player.
 * @property {number} elo - The player's Elo rating, used to assess their skill level.
 * @property {boolean | "pending"} connected - Indicates whether the player is currently connected to the game.
 *                                             Can be `true`, `false`, or `"pending"` if the connection is in progress.
 */
export interface Player{
    userId: string;
    username: string;
    elo: number;
    connected: boolean | "pending";
}

/**
 * Represents the state and details of a game.
 * 
 * @interface Game
 * 
 * @property {string} gameId - The unique identifier for the game.
 * @property {Player} playerA - The player who created the game (Player A).
 * @property {Player} playerB - The player who joined the game (Player B).
 * @property {string[]} boardState - An array representing the current state of the game board.
 *                                   Each string represents a piece or an empty space on the board.
 * @property {string[]} moveHistory - An array of moves made during the game, stored as strings.
 * @property {"playerA" | "playerB"} currentTurn - Indicates whose turn it is to make a move.
 * @property {"in-progress" | "completed" | "waiting"} status - The current status of the game.
 *                                                              `in-progress` indicates an ongoing game,
 *                                                              `completed` means the game has ended,
 *                                                              and `waiting` indicates a game awaiting a second player.
 * @property {"playerA" | "playerB" | "draw" | null} winner - The winner of the game.
 *                                                            Can be `playerA`, `playerB`, `draw`, or `null` if the game is still in progress.
 * @property {FirebaseFirestore.Timestamp} lastMoveTime - The timestamp of when the last move was made.
 * @property {FirebaseFirestore.Timestamp} createdAt - The timestamp of when the game was created.
 */
export interface Game {
    gameId: string;
    playerA: Player;
    playerB: Player;
    boardState: string[];
    moveHistory: string[];
    currentTurn: "playerA" | "playerB";
    status: "in-progress" | "completed" | "waiting";
    winner: "playerA" | "playerB" | "draw" | null;
    lastMoveTime: FirebaseFirestore.Timestamp;
    createdAt: FirebaseFirestore.Timestamp;
}

/**
 * Represents the arguments required to create a new game room.
 * 
 * @interface CreateRoomArgs
 * 
 * @property {Player} playerA - The player who initiates the creation of the game room (Player A).
 * @property {Player} playerB - The player who joins the game room (Player B).
 */
export interface CreateRoomArgs {
    playerA: Player,
    playerB: Player
}