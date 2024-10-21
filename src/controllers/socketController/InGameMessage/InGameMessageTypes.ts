import { Room } from "../../../types/gameTypes";

/**
 * Represents a message sent within a game room.
 * 
 * @interface Message
 * 
 * @property {string} id - A unique identifier for the message.
 * @property {string} message - The content of the message.
 * @property {string} time - The timestamp of when the message was sent, formatted as a string.
 * @property {string} username - The username of the player who sent the message.
 * @property {Room} room - The room object to which the message belongs.
 * @property {"sending" | "delivered" | "error"} status - The current status of the message.
 */
export interface Message {
    id: string;
    message: string;
    time: string;
    username: string;
    room: Room;
    status: "sending" | "delivered" | "error";
}

/**
 * Represents the arguments required to send an in-game message.
 * 
 * @interface InGameMessageArgs
 * 
 * @property {Message} inGameMessage - An object containing the details of the in-game message.
 */
export interface InGameMessageArgs {
    inGameMessage: Message
}

/**
 * Represents the response received after sending an in-game message.
 * 
 * @interface CallbackResponseInGameMessage
 * 
 * @property {string} message - The response message indicating the result of the in-game message sending operation.
 */
export interface CallbackResponseInGameMessage {
    message: string;
}