import { Request, Response, NextFunction } from "express";

/**
 * Express error handling middleware to manage and respond to errors in a standardized format.
 * 
 * @param {any} err - The error object, which may contain a `statusCode` and a `message` property.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next middleware function, which is not used in this handler but is required by Express.
 * 
 * @description This middleware function captures errors occurring in the application, sets the appropriate status code, 
 * and sends a JSON response with an error message. If the error object does not have a `statusCode`, a default value of 500 (Internal Server Error) is used. 
 * Similarly, if the error object does not have a `message`, a default error message is used.
 * 
 * @returns {void} Sends a JSON response with the error status code and message.
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ error: true, message });
};
