/**
 * Handles invoking a callback function with a standardized response format.
 * 
 * @param {Function} callback - The callback function to be executed. 
 *        It should accept an object with an `error` flag, a `message`, and optional additional data.
 * @param {boolean} error - A boolean flag indicating whether there was an error.
 * @param {string} message - A message string to describe the result or error.
 * @param {any} [data] - Optional additional data to include in the callback response.
 * 
 * @returns {void} This function does not return a value; it invokes the callback with a response object.
 */
export const handleCallback = (callback: Function, error: boolean, message: string, data?: any) => {
    callback({ error, message, ...data });
};

/**
 * Extracts the message from an error object or returns a string representation if the error is not an instance of `Error`.
 * 
 * @param {unknown} error - The error object from which to extract the message.
 * 
 * @returns {string} The extracted error message, or a stringified version of the input if not an instance of `Error`.
 */
export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
  