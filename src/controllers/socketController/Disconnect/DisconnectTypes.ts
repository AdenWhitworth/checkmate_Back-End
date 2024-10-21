import { Player } from "../../../types/gameTypes";

/**
 * Represents the arguments required when a player disconnects.
 * 
 * @interface DisconnectArgs
 * 
 * @property {Player} player - The player object that is disconnecting. This should be an instance of the `Player` type.
 */
export interface DisconnectArgs {
    player: Player
};