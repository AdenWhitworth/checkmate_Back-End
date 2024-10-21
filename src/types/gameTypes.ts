/**
 * Represents a player in a game room.
 * 
 * @interface Player
 * 
 * @property {string} id - A unique identifier for the player, typically representing their socket ID.
 * @property {string} username - The username of the player.
 */
export interface Player {
    id: string;
    username: string;
};
  
/**
 * Represents a game room with multiple players.
 * 
 * @interface Room
 * 
 * @property {string} roomId - A unique identifier for the room.
 * @property {Player[]} players - An array of players currently in the room.
 */
export interface Room {
    roomId: string;
    players: Player[];
};
  