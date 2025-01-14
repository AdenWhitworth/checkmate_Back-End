import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";
import { getModelSession } from "./handleModels";
import * as path from "path";
import fs from "fs/promises";
import { spawn } from "child_process";

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
 * Performs alpha-beta pruning to find the best move.
 *
 * @param {Chess} chess - The current chess game state.
 * @param {number} depth - The remaining depth to search.
 * @param {number} alpha - The alpha value for pruning.
 * @param {number} beta - The beta value for pruning.
 * @param {boolean} maximizingPlayer - True if it's the maximizing player's turn.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level.
 * @param {Map<string, { score: number; depth: number }>} transpositionTable - Cache for storing evaluated positions.
 * @param {number} maxMoves - The maximum number of moves to evaluate at each depth.
 * @returns {Promise<{ score: number; bestMove: Move | null }>} The best move and its evaluation score.
 */
async function alphaBeta(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  maximizingPlayer: boolean,
  difficulty: "novice" | "intermediate" | "advanced" | "master",
  transpositionTable: Map<string, { score: number; depth: number }>,
  maxMoves: number = 5
): Promise<{ score: number; bestMove: Move | null }> {
  const fen = chess.fen();

  if (transpositionTable.has(fen)) {
    const cachedEntry = transpositionTable.get(fen)!;
    if (cachedEntry.depth >= depth) {
      return { score: cachedEntry.score, bestMove: null };
    }
  }

  if (depth === 0 || chess.isGameOver()) {
    const probabilities = await evaluateBoard(chess.history({ verbose: true }), difficulty);
    const legalMoves = chess.moves({ verbose: true });

    const legalMoveScores = legalMoves.map((move) => {
      const moveId = moveToId![move.san];
      return probabilities[moveId] || 0;
    });

    const sortedMoves = legalMoves
      .map((move, index) => ({ move, score: legalMoveScores[index] }))
      .sort((a, b) => b.score - a.score);

    const bestMove = sortedMoves[0]?.move || null;
    const maxScore = sortedMoves[0]?.score || 0;

    return { score: maxScore, bestMove };
  }

  const legalMoves = chess.moves({ verbose: true });

  const probabilities = await evaluateBoard(chess.history({ verbose: true }), difficulty);
  const scoredMoves = legalMoves.map((move) => ({
    move,
    score: probabilities[moveToId![move.san]] || 0,
  }));

  scoredMoves.sort((a, b) => b.score - a.score);

  const limitedMoves = scoredMoves.slice(0, maxMoves);

  let bestMove: Move | null = null;

  if (maximizingPlayer) {
    let maxEval = -Infinity;

    for (const { move } of limitedMoves) {
      chess.move(move);
      const { score } = await alphaBeta(
        chess,
        depth - 1,
        alpha,
        beta,
        false,
        difficulty,
        transpositionTable,
        maxMoves
      );
      chess.undo();

      if (score > maxEval) {
        maxEval = score;
        bestMove = move;
      }
      alpha = Math.max(alpha, score);
      if (beta <= alpha) break;
    }

    transpositionTable.set(fen, { score: maxEval, depth });
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;

    for (const { move } of limitedMoves) {
      chess.move(move);
      const { score } = await alphaBeta(
        chess,
        depth - 1,
        alpha,
        beta,
        true,
        difficulty,
        transpositionTable,
        maxMoves
      );
      chess.undo();

      if (score < minEval) {
        minEval = score;
        bestMove = move;
      }
      beta = Math.min(beta, score);
      if (beta <= alpha) break;
    }

    transpositionTable.set(fen, { score: minEval, depth });
    return { score: minEval, bestMove };
  }
}

/**
 * Evaluates the current board state using an ONNX model.
 *
 * @param {Move[]} history - An array of moves in verbose format representing the game history.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @returns {Promise<Float32Array>} A Float32Array of probabilities for all possible moves.
 * @throws {Error} If the ONNX model session cannot be loaded or mappings are missing.
 */
async function evaluateBoard(
  history: Move[],
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<Float32Array> {
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
  return output;
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
  const transpositionTable = new Map<string, { score: number; depth: number }>();

  try {
    const chess = new Chess();
    history.forEach((move) => chess.move(move));

    const { bestMove } = await alphaBeta(chess, depth, -Infinity, Infinity, true, difficulty, transpositionTable);

    if (!bestMove) {
      throw new Error("Failed to determine a valid move.");
    }

    resolve(bestMove);
  } catch (error) {
    console.error("Error during prediction:", error);
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
  const depthMapping: Record<"novice" | "intermediate" | "advanced" | "master", 0 | 1 | 2 | 3> = {
    novice: 0,
    intermediate: 1,
    advanced: 2,
    master: 3,
  };

  const depth = depthMapping[difficulty];

  return new Promise((resolve, reject) => {
    requestQueue.push({ history, difficulty, resolve, reject, depth });
    processQueue();
  });
}

/**
 * Converts a verbose history of moves into a simplified SAN (Standard Algebraic Notation) move history.
 *
 * @param {Move[]} verboseHistory - An array of moves in verbose format.
 * @returns {MoveHistory} An array of moves in SAN format.
 */
function verboseToMoveHistory(verboseHistory: Move[]): MoveHistory {
  return verboseHistory.map((move) => move.san);
}

/**
 * Predicts the next best move using an ONNX model, given the current game history and difficulty level.
 * 
 * @param {Move[]} history - The history of moves played in verbose format.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the prediction.
 * @returns {Promise<Move>} A promise that resolves to the predicted best move.
 * @throws {Error} If the ONNX model or mappings are not loaded properly.
 */
export async function predictNextMoveOriginal(
  history: Move[],
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<Move> {
  try {
    const moveHistory: MoveHistory = verboseToMoveHistory(history);

    await loadMappings();
    if (!moveToId || !idToMove) {
      throw new Error("Mappings not loaded properly.");
    }

    const session = getModelSession(difficulty);
    if (!session) {
      throw new Error("Failed to load ONNX session.");
    }

    const board = new Chess();
    for (const move of moveHistory) {
      board.move(move);
    }

    const inputTensor = prepareInput(moveHistory, moveToId, maxLength);

    const feeds: Record<string, ort.Tensor> = {
      args_0: new ort.Tensor("float32", inputTensor, [1, maxLength]),
    };

    const results = await session.run(feeds);

    const outputName = session.outputNames[0];
    if (!results[outputName]) {
      throw new Error(`Output ${outputName} not found in model results.`);
    }

    const output =
      results[outputName].data instanceof BigInt64Array
        ? Array.from(results[outputName].data, (bigInt) => Number(bigInt))
        : Array.from(results[outputName].data);

    const legalMoves = board.moves({ verbose: true });
    const legalMovesSAN = legalMoves.map((move) => move.san);

    const filteredProbabilities = output
      .map((prob, idx) => ({
        id: idx,
        move: idToMove?.[idx] || "Unknown",
        probability: prob,
      }))
      .filter((entry) => legalMovesSAN.includes(entry.move))
      .sort((a, b) => b.probability - a.probability);

    if (filteredProbabilities.length === 0) {
      console.warn("No valid predicted moves. Falling back to random.");
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }

    const bestMoveSAN = filteredProbabilities[0].move;
    const bestMove = legalMoves.find((move) => move.san === bestMoveSAN);

    if (bestMove) {
      return bestMove;
    } else {
      console.warn("Best move not found. Falling back to random.");
      return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    }
  } catch (error) {
    console.error("Error predicting move:", error);
    throw error;
  }
}

/**
 * Type representing a Stockfish prediction request.
 * 
 * @type {Object} StockfishPredictRequest
 * @property {Move[]} history - An array of moves representing the current game state history.
 * @property {"novice" | "intermediate" | "advanced" | "master"} difficulty - The desired difficulty level for Stockfish.
 * @property {Function} resolve - A function to resolve the promise with the best move chosen by Stockfish.
 * @property {Function} reject - A function to reject the promise in case of errors or timeout.
 */
type StockfishPredictRequest = {
  history: Move[];
  difficulty: "novice" | "intermediate" | "advanced" | "master"
  resolve: (value: Move) => void;
  reject: (reason?: any) => void;
};

const stockfishRequestQueue: StockfishPredictRequest[] = [];
const MAX_CONCURRENT_STOCKFISH_REQUESTS = 1;
let activeStockfishRequests = 0;
const STOCKFISH_TIMEOUT_MILLI_SECONDS = 30000;

/**
 * Converts a difficulty level to the corresponding Elo rating and search depth for Stockfish.
 * 
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level.
 * @returns {Object} An object containing the Elo rating and the depth for Stockfish.
 * @returns {number} stockfish_elo - The Elo rating to set for Stockfish.
 * @returns {number} depth - The search depth to set for Stockfish.
 */
function difficultyToStockfishElo(difficulty: "novice" | "intermediate" | "advanced" | "master"): {stockfish_elo: number, depth: number} {
  if (difficulty === "novice") return {stockfish_elo: 1350, depth: 1};
  if (difficulty === "intermediate") return {stockfish_elo: 1350, depth: 5};
  if (difficulty === "advanced") return {stockfish_elo: 1750, depth: 10};
  return {stockfish_elo: 2750, depth: 20};
}

/**
 * Predicts the next move using Stockfish based on the given history and difficulty level.
 * 
 * @param {Move[]} history - An array of moves representing the current game state history.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for Stockfish.
 * @returns {Promise<Move>} A promise that resolves with the best move predicted by Stockfish.
 */
export function predictNextMoveWithStockfish(
  history: Move[],
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<Move> {
  return new Promise((resolve, reject) => {
    stockfishRequestQueue.push({ history, difficulty, resolve, reject });
    processStockfishQueue();
  });
}

/**
 * Processes the Stockfish request queue by executing requests one at a time.
 * If there is an active request being processed, it waits until it's completed.
 */
function processStockfishQueue(): void {
  if (stockfishRequestQueue.length === 0 || activeStockfishRequests >= MAX_CONCURRENT_STOCKFISH_REQUESTS) {
    return;
  }

  activeStockfishRequests++;
  const { history, difficulty, resolve, reject } = stockfishRequestQueue.shift()!;
  const { stockfish_elo, depth } =  difficultyToStockfishElo(difficulty);
  const stockfishPath = path.resolve(process.cwd(), "src/chessBot/stockfish/stockfish.exe");
  const syzygyPath = path.resolve(process.cwd(), "src/chessBot/stockfish/src/syzygy");
  const stockfish = spawn(stockfishPath);

  let bestMove: Move | null = null;
  let resolved = false;

  const chess = new Chess();
  try {
    history.forEach((move) => chess.move(move));
  } catch (error: any) {
    reject(new Error(`Invalid move history: ${error.message}`));
    activeStockfishRequests--;
    processStockfishQueue();
    return;
  }

  const fen = chess.fen();
  const timeout = setTimeout(() => {
    if (!resolved) {
      resolved = true;
      stockfish.kill();
      reject(new Error("Stockfish process timed out"));
      activeStockfishRequests--;
      processStockfishQueue();
    }
  }, STOCKFISH_TIMEOUT_MILLI_SECONDS);

  stockfish.stdout.on("data", (data) => {
    const output = data.toString();
  
    if (output.includes("bestmove")) {
      const bestMoveLAN = output.split("bestmove ")[1].split(" ")[0].trim();
      const currentTurn = chess.turn();
      const move = chess.move(bestMoveLAN); 
  
      if (!move) {
        console.error(`Invalid move for ${currentTurn === 'b' ? 'Black' : 'White'}'s turn: ${bestMoveLAN}`);
        bestMove = null;
      } else {
        bestMove = move;
      }
  
      if (bestMove === null) {
        reject(new Error("Stockfish did not return a valid move."));
      } else {
        resolve(bestMove);
      }
  
      resolved = true;
      clearTimeout(timeout);
      activeStockfishRequests--;
      processStockfishQueue();
    }
  });
  
  stockfish.stderr.on("data", (data) => {
    console.error(`Stockfish error: ${data.toString()}`);
  });

  stockfish.on("error", (error) => {
    if (!resolved) {
      resolved = true;
      clearTimeout(timeout);
      reject(new Error(`Failed to spawn Stockfish process: ${error.message}`));
      activeStockfishRequests--;
      processStockfishQueue();
    }
  });

  stockfish.on("close", () => {
    if (!resolved) {
      resolved = true;
      clearTimeout(timeout);
      reject(new Error("Failed to determine the best move from Stockfish."));
      activeStockfishRequests--;
      processStockfishQueue();
    }
  });

  stockfish.stdin.write("uci\n");
  stockfish.stdin.write("isready\n");
  stockfish.stdin.write("setoption name Threads value 8\n");
  stockfish.stdin.write("setoption name Hash value 4096\n");
  stockfish.stdin.write(`position fen ${fen}\n`);
  stockfish.stdin.write(`setoption name SyzygyPath value ${syzygyPath}\n`);
  stockfish.stdin.write("setoption name SyzygyProbeDepth value 7\n");
  stockfish.stdin.write("setoption name UCI_LimitStrength value false\n");
  stockfish.stdin.write(`setoption name UCI_Elo value ${stockfish_elo}\n`);
  stockfish.stdin.write("setoption name Ponder value true\n");
  stockfish.stdin.write(`go depth ${depth}\n`);
  stockfish.stdin.write("setoption name MultiPV value 5\n");
  stockfish.stdin.end();
}