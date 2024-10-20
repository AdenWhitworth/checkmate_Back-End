import express from "express";
import { Server } from "socket.io";
import http from "http";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { setupSocket } from "./controllers/socketController/socketController";
import { errorHandler } from "./utility/errorhandler";

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
