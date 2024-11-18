/**
 * Represents the arguments required when a player reconnects to a game.
 * 
 * @interface ReconnectRoomArgs
 * 
 * @property {string} gameId - The game ID associated with the game being reconnected to. 
 */
export interface ReconnectRoomArgs {
    gameId: string;
}