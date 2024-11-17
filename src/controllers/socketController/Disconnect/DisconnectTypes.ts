import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required when a player disconnects.
 * 
 * @interface DisconnectArgs
 * 
 * @property {Game} game - The game object that the player is disconnecting from.
 * @property {string} disconnectUserId - The userId for the player that is disconnecting.
 */
export interface DisconnectArgs {
    game: Game;
    disconnectUserId: string;
};