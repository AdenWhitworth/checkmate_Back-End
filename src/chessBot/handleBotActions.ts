import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";
import { getModelSession } from "./handleModels";
import * as path from "path";
import fs from "fs/promises";

type MoveHistory = string[];

type PredictRequest = {
  history: Move[];
  difficulty: "novice" | "intermediate" | "advanced" | "master";
  resolve: (value: Move) => void;
  reject: (reason?: any) => void;
  depth: number;
};

const maxLength = 485;
let moveToId: { [key: string]: number } | null = null;
let idToMove: { [key: number]: string } | null = null;
const requestQueue: PredictRequest[] = [];
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;

/**
 * Loads the move-to-ID and ID-to-move mappings from JSON files.
 * Ensures the mappings are loaded only once and stored globally.
 * 
 * @throws {Error} If the mapping files cannot be read or parsed.
 * @returns {Promise<void>} Resolves when the mappings are loaded.
 */
async function loadMappings(): Promise<void> {
  if (moveToId && idToMove) return;

  const moveToIdPath = path.resolve(process.cwd(), "src/chessBot/onnx_models/move_to_id.json");
  const idToMovePath = path.resolve(process.cwd(), "src/chessBot/onnx_models/id_to_move.json");

  try {
    moveToId = JSON.parse(await fs.readFile(moveToIdPath, "utf-8"));
    idToMove = JSON.parse(await fs.readFile(idToMovePath, "utf-8"));
    console.log("Mappings loaded successfully.");
  } catch (error) {
    console.error("Error loading mapping files:", error);
    throw new Error("Mapping files could not be loaded.");
  }
}

/**
 * Prepares the input tensor for ONNX model inference by converting the move history
 * into numeric IDs using the provided mapping and padding the sequence to the required length.
 *
 * @param {MoveHistory} moveHistory - An array of moves in SAN (Standard Algebraic Notation) format.
 * @param {{ [key: string]: number }} moveToId - A mapping from SAN moves to numeric IDs.
 * @param {number} maxLength - The maximum sequence length expected by the ONNX model.
 * @returns {Float32Array} A padded tensor representing the move history in numeric ID format.
 */
function prepareInput(moveHistory: MoveHistory, moveToId: { [key: string]: number }, maxLength: number): Float32Array {
  const tokenizedHistory = moveHistory.map((move) => moveToId[move] || 0);
  const paddedHistory = new Array(maxLength).fill(0);
  for (let i = 0; i < tokenizedHistory.length; i++) {
    paddedHistory[i] = tokenizedHistory[i];
  }
  return Float32Array.from(paddedHistory);
}

/**
 * Implements the Alpha-Beta pruning algorithm for searching the best move in a chess game.
 * 
 * @param {Chess} chess - The Chess.js instance representing the current game state.
 * @param {number} depth - The maximum depth of the search tree.
 * @param {number} alpha - The alpha value for pruning.
 * @param {number} beta - The beta value for pruning.
 * @param {boolean} maximizingPlayer - Indicates whether the current player is maximizing or minimizing the evaluation score.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @returns {Promise<{ score: number; bestMove: Move | null }>} A promise that resolves to an object containing the best score and the best move.
 */
async function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<{ score: number; bestMove: Move | null }> {
  if (depth === 0 || chess.isGameOver()) {
    const evaluation = await evaluateBoard(chess.history({ verbose: true }), difficulty);
    return { score: evaluation, bestMove: null };
  }

  const legalMoves = chess.moves({ verbose: true });

  if (maximizingPlayer) {
    let maxEval = -Infinity;
    let bestMove: Move | null = null;

    for (const move of legalMoves) {
      chess.move(move);
      const { score } = await alphaBeta(chess, depth - 1, alpha, beta, false, difficulty);
      chess.undo();

      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }

    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    let bestMove: Move | null = null;

    for (const move of legalMoves) {
      chess.move(move);
      const { score } = await alphaBeta(chess, depth - 1, alpha, beta, true, difficulty);
      chess.undo();

      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }

    return { score: minEval, bestMove };
  }
}

/**
 * Evaluates the board state using the ONNX model to return a score.
 * 
 * @param {Move[]} history - The game history represented as an array of verbose moves.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @returns {Promise<number>} A promise that resolves to the evaluation score of the board.
 * @throws {Error} If the ONNX session fails to load or the mappings are not available.
 */
async function evaluateBoard(history: Move[], difficulty: "novice" | "intermediate" | "advanced" | "master"): Promise<number> {
  await loadMappings();

  if (!moveToId || !idToMove) {
    throw new Error("Mappings not loaded properly.");
  }

  const session = getModelSession(difficulty);
  if (!session) {
    throw new Error("Failed to load ONNX session.");
  }

  const moveHistory = history.map((move) => move.san);
  const inputTensor = prepareInput(moveHistory, moveToId, maxLength);

  const feeds: Record<string, ort.Tensor> = {
    args_0: new ort.Tensor("float32", inputTensor, [1, maxLength]),
  };

  const results = await session.run(feeds);
  const outputName = session.outputNames[0];

  if (!results[outputName]) {
    throw new Error(`Output ${outputName} not found in model results.`);
  }

  const output = results[outputName].data as Float32Array;
  return output[0];
}

/**
 * Processes prediction requests in the queue with a limit on concurrent requests.
 * 
 * @returns {Promise<void>} Resolves when the request queue is processed.
 */
async function processQueue(): Promise<void> {
  if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) return;

  activeRequests++;

  const { history, difficulty, resolve, reject, depth } = requestQueue.shift()!;

  try {
    const chess = new Chess();
    history.forEach((move) => chess.move(move));

    const { bestMove } = await alphaBeta(chess, depth, -Infinity, Infinity, true, difficulty);

    if (!bestMove) {
      throw new Error("Failed to determine a valid move.");
    }

    resolve(bestMove);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    processQueue();
  }
}

/**
 * Adds a prediction request to the queue and returns a promise for the predicted move.
 * 
 * @param {Move[]} history - An array of moves in verbose format representing the game history.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @returns {Promise<Move>} A promise that resolves to the predicted move.
 */
export function predictNextMove(
  history: Move[],
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<Move> {
  const depthMapping: Record<"novice" | "intermediate" | "advanced" | "master", 0 | 1 | 2 | 2> = {
    novice: 0,
    intermediate: 1,
    advanced: 2,
    master: 2,
  };

  const depth = depthMapping[difficulty];

  return new Promise((resolve, reject) => {
    requestQueue.push({ history, difficulty, resolve, reject, depth });
    processQueue();
  });
}