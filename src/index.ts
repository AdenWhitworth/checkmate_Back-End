import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { setupSocket } from "./controllers/socketController/socketController";
import { errorHandler } from "./utility/errorhandler";

/**
 * Initializes and configures an Express application with Socket.IO, CORS, rate limiting, and error handling.
 * 
 * @module Server
 * 
 * @description This module sets up an Express server with CORS, rate limiting, and error handling. It also creates an HTTP server 
 * and attaches a Socket.IO server to handle real-time events. The server is configured with environment variables for the base URL and 
 * allowed origins for CORS.
 * 
 * Middleware:
 * - Parses incoming JSON requests.
 * - Configures CORS to allow specific origins and HTTP methods.
 * - Sets up rate limiting to limit the number of requests from each IP within a specific window.
 * - Attaches a Socket.IO instance to the server and sets up socket event handlers.
 * - Adds a global error handling middleware to standardize error responses.
 * 
 * Environment Variables:
 * - `BASE_URL`: The base URL allowed for CORS.
 * - `TEST_URL`: An additional URL allowed for CORS during testing.
 * - `PORT`: The port number on which the server listens (default: 8080).
 * 
 * @constant {express.Application} app - The Express application instance.
 * @constant {http.Server} server - The HTTP server instance created from the Express app.
 * @constant {Server} io - The Socket.IO server instance attached to the HTTP server.
 * @constant {number} limitMinutes - The duration (in minutes) for which the rate limiting window applies.
 * @constant {number} limitMilliSec - The duration (in milliseconds) for which the rate limiting window applies.
 * @constant {number} maxConnection - The maximum number of requests allowed from a single IP within the rate limiting window.
 * 
 * @fires server#listening - The server listens for incoming HTTP requests on the specified port.
 * 
 * @returns {void} This module does not return a value; it initializes and starts the server.
 */
const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin: [process.env.BASE_URL as string],
  methods: ['GET', 'POST']
}));


const limitMinutes = 15;
const limitMilliSec = limitMinutes * 60 * 1000;
const maxConnection = 100;

const limiter = rateLimit({
  windowMs: limitMilliSec,
  max: maxConnection,
});
app.use(limiter);

const io = new Server(server, {
  cors: {
    origin: [process.env.BASE_URL as string, process.env.TEST_URL as string],
  },
});

setupSocket(io);

app.use(errorHandler);

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
