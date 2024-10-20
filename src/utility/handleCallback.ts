export const handleCallback = (callback: Function, error: boolean, message: string, data?: any) => {
    callback({ error, message, ...data });
};

export function extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}
  