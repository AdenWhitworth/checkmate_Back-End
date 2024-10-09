import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { setupSocket } from "./controllers/socketController";
import { errorHandler } from "./utility/errorhandler";

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cors({
  origin: ['https://yourtrusteddomain.com'], // Adjust allowed origins
  methods: ['GET', 'POST']
}));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const io = new Server(server, {
  cors: {
    origin: ['https://yourtrusteddomain.com'],
  },
});

setupSocket(io);

// Global error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
