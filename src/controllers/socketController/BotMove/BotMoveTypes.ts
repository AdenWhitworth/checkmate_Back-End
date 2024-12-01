import { Move } from "chess.js";
import { BotGame } from "../CreateBotGame/CreateBotGameTypes";

/**
 * Represents the arguments required to calculate a bot's move in a chess game.
 *
 * @interface BotMoveArgs
 * @property {BotGame} botGame - The current bot game object containing game details.
 * @property {"novice" | "intermediate" | "advanced" | "master"} difficulty - The bot's difficulty level.
 * @property {string} fen - The current board state in Forsyth-Edwards Notation (FEN).
 * @property {"w" | "b"} currentTurn - Indicates whose turn it is to play ("w" for white, "b" for black).
 * @property {Move[]} history - An array of previous moves in the game, represented as Move objects.
 */
export interface BotMoveArgs {
    botGame: BotGame;
    difficulty: "novice" | "intermediate" | "advanced" | "master";
    fen: string;
    currentTurn: "w" | "b";
    history: Move[];
};