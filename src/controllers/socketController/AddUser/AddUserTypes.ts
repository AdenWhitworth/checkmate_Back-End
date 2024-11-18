/**
 * Represents the arguments required to add a user.
 *
 * @interface AddUserArgs
 *
 * @property {string} username - The username of the user to be added. Must be a non-empty string containing the display name of the user.
 * @property {string} userId - The unique identifier for the user. This should be a valid, non-empty string representing the user's ID in the system.
 */
export interface AddUserArgs {
    username: string;
    userId: string;
};