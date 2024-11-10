import { Game } from "../CreateRoom/CreateRoomTypes";

/**
 * Represents the arguments required to close a room.
 * 
 * @interface CloseRoomArgs
 * @property {Game} game - The game object associated with the room that needs to be closed.
 * @property {boolean} inviteCancelled - A flag indicating whether the game was closed due to an invite being cancelled. If `true`, it means the room was closed without the game being played.
 */
export interface CloseRoomArgs {
    game: Game;
    inviteCancelled: boolean;
};