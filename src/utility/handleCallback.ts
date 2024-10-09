export const handleCallback = (callback: Function, error: boolean, message: string, data?: any) => {
    callback({ error, message, ...data });
};
  