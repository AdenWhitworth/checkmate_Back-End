import { Socket } from "socket.io";
import { InGamePlayer, Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required to create a new bot game.
 *
 * @interface CreateBotGameArgs
 * @property {InGamePlayer} playerA - Details of Player A participating in the bot game.
 * @property {InGamePlayer} playerB - Details of Player B participating in the bot game.
 * @property {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the bot.
 * @property {"assisted" | "friendly" | "challenge"} help - The bot game mode affecting assistance and challenges.
 * @property {Socket} socket - The socket connection of the user initiating the game.
 */
export interface CreateBotGameArgs {
    playerA: InGamePlayer,
    playerB: InGamePlayer,
    difficulty: "novice" | "intermediate" | "advanced" | "master";
    help: "assisted" | "friendly" | "challenge";
    socket: Socket;
}

/**
 * Extends the Game interface to include additional properties specific to bot games.
 *
 * @interface BotGame
 * @extends Game
 * @property {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the bot.
 * @property {"assisted" | "friendly" | "challenge"} help - The bot game mode affecting assistance and challenges.
 * @property {number} remainingUndos - The number of remaining undos available in the bot game.
 * @property {number} remainingHints - The number of remaining hints available in the bot game.
 */
export interface BotGame extends Game{
    difficulty: "novice" | "intermediate" | "advanced" | "master";
    help: "assisted" | "friendly" | "challenge";
    remainingUndos: number;
    remainingHints: number;
}