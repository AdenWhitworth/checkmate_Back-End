import express from "express";
import http from "http";
import { Server } from "socket.io";
import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Mapping ELO ranges to ONNX models
const modelPaths: Record<string, string> = {
  less_1000: "./onnx_models/less_1000_model.onnx",
  "1000_1500": "./onnx_models/1000_1500_model.onnx",
  "1500_2000": "./onnx_models/1500_2000_model.onnx",
  greater_2000: "./onnx_models/greater_2000_model.onnx",
};

// Preload all models
const modelSessions: Record<string, ort.InferenceSession> = {};

async function preloadModels() {
  modelSessions.less_1000 = await ort.InferenceSession.create(modelPaths.less_1000);
  modelSessions["1000_1500"] = await ort.InferenceSession.create(modelPaths["1000_1500"]);
  modelSessions["1500_2000"] = await ort.InferenceSession.create(modelPaths["1500_2000"]);
  modelSessions.greater_2000 = await ort.InferenceSession.create(modelPaths.greater_2000);
}

// Helper to get model by ELO
function getModelSession(elo: number): ort.InferenceSession {
  if (elo < 1000) return modelSessions.less_1000;
  if (elo < 1500) return modelSessions["1000_1500"];
  if (elo < 2000) return modelSessions["1500_2000"];
  return modelSessions.greater_2000;
}

// Helper function to convert FEN to a model-friendly input tensor
function fenToTensor(fen: string): ort.Tensor {
  const pieceMap: Record<string, number> = {
    p: -1, n: -2, b: -3, r: -4, q: -5, k: -6, // Black pieces
    P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6,      // White pieces
  };

  const rows = fen.split(" ")[0].split("/");
  const boardArray: number[] = [];

  for (const row of rows) {
    for (const char of row) {
      if (parseInt(char)) {
        boardArray.push(...Array(parseInt(char)).fill(0));
      } else {
        boardArray.push(pieceMap[char]);
      }
    }
  }

  return new ort.Tensor("float32", new Float32Array(boardArray), [1, 8, 8, 1]);
}

// Helper function to convert model output to a chess.js move
function outputToMove(output: ort.Tensor, chess: Chess): Move | null {
  const moveIndex = output.data[0];
  const fromSquare = Math.floor(moveIndex / 64);
  const toSquare = moveIndex % 64;

  const fromFile = String.fromCharCode("a".charCodeAt(0) + (fromSquare % 8));
  const fromRank = Math.floor(fromSquare / 8) + 1;
  const toFile = String.fromCharCode("a".charCodeAt(0) + (toSquare % 8));
  const toRank = Math.floor(toSquare / 8) + 1;

  return chess.moves({ verbose: true }).find(move => 
    move.from === `${fromFile}${fromRank}` && 
    move.to === `${toFile}${toRank}`
  ) || null;
}

// Socket.IO logic
io.on("connection", (socket) => {
  console.log("Player connected");

  const chess = new Chess(); // Create a new chess game instance

  socket.on("playerMove", async ({ move, elo }: { move: Move; elo: number }) => {
    try {
      chess.move(move); // Apply the player's move
      console.log("Player moved:", move);

      if (chess.isGameOver()) {
        socket.emit("gameOver", { winner: "Player" });
        return;
      }

      const session = getModelSession(elo);

      // Prepare the board state for the model
      const fen = chess.fen();
      const inputTensor = fenToTensor(fen);

      // Run the model
      const output = await session.run({ [session.inputNames[0]]: inputTensor });
      const botMove = outputToMove(output[session.outputNames[0]], chess);

      if (!botMove) {
        socket.emit("error", { message: "Bot could not find a valid move." });
        return;
      }

      chess.move(botMove); // Apply the bot's move
      console.log("Bot moved:", botMove);

      // Emit the bot's move back to the client
      socket.emit("botMove", botMove);

      if (chess.isGameOver()) {
        socket.emit("gameOver", { winner: "Bot" });
      }
    } catch (err) {
      console.error("Error handling move:", err);
      socket.emit("error", { message: "An error occurred." });
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected");
  });
});

// Start the server
const PORT = 3000;

preloadModels().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

