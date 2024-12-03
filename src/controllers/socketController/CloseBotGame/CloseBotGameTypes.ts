import { BotGame } from "../CreateBotGame/CreateBotGameTypes";

/**
 * Represents the arguments required to close a bot game.
 *
 * @interface CloseBotGameArgs
 * @property {BotGame} botGame - The bot game object containing the game's data to be closed.
 */
export interface CloseBotGameArgs {
    botGame: BotGame;
};