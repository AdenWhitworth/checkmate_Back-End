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
 * Converts a verbose move history to a simple SAN format.
 * 
 * @param {Move[]} verboseHistory - An array of moves in verbose format.
 * @returns {MoveHistory} The move history in SAN format.
 */
function verboseToMoveHistory(verboseHistory: Move[]): MoveHistory {
  return verboseHistory.map((move) => move.san);
}

/**
 * Processes requests in the queue with concurrency control.
 *
 * @function processQueue
 * @returns {Promise<void>} Resolves when the queue has been processed.
 */
async function processQueue(): Promise<void> {
  if (requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) return;

  activeRequests++;

  const { history, difficulty, resolve, reject } = requestQueue.shift()!;

  try {
    const result = await predictNextMoveInternal(history, difficulty);
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    activeRequests--;
    processQueue();
  }
}

/**
 * Adds a prediction request to the queue and returns a Promise for the result.
 * 
 * @param {Move[]} history - An array of moves in verbose format representing the game history.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the prediction.
 * @returns {Promise<Move>} A Promise that resolves to the predicted move.
 */
export function predictNextMove(history: Move[], difficulty: "novice" | "intermediate" | "advanced" | "master"): Promise<Move> {
  return new Promise((resolve, reject) => {
    requestQueue.push({ history, difficulty, resolve, reject });
    processQueue();
  });
}

/**
 * Predicts the next chess move based on the provided game history and difficulty level.
 * This function performs the actual inference without concurrency management.
 * 
 * @param {Move[]} history - An array of moves in verbose format representing the game history.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the prediction.
 * @returns {Promise<Move>} A Promise that resolves to the predicted move.
 * @throws {Error} If there is an issue with loading mappings, ONNX session initialization, or inference.
 */
export async function predictNextMoveInternal(history: Move[], difficulty: "novice" | "intermediate" | "advanced" | "master",): Promise<Move> {
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

    const output = results[outputName].data as Float32Array;

    const moveProbabilities = Array.from(output);
    const sortedIndices = moveProbabilities
      .map((prob, idx) => ({ idx, prob }))
      .sort((a, b) => b.prob - a.prob)
      .map((entry) => entry.idx);

    const legalMoves = board.moves({ verbose: true });

    for (const predictedMoveId of sortedIndices) {
      const predictedMoveSAN = idToMove[predictedMoveId];
      const matchedMove = legalMoves.find((move) => move.san === predictedMoveSAN);
      if (matchedMove) {
        return {
          from: matchedMove.from,
          to: matchedMove.to,
          color: matchedMove.color,
          piece: matchedMove.piece,
          promotion: matchedMove.promotion || undefined,
          flags: matchedMove.flags || "",
          san: matchedMove.san,
          lan: matchedMove.lan || "",
          before: matchedMove.before || "",
          after: matchedMove.after || "",
        };
      }
    }

    console.warn("No valid predicted moves found. Selecting a random legal move.");
    const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];

    return {
      from: randomMove.from,
      to: randomMove.to,
      color: randomMove.color,
      piece: randomMove.piece,
      promotion: randomMove.promotion || undefined,
      flags: randomMove.flags || "",
      san: randomMove.san,
      lan: randomMove.lan || "",
      before: randomMove.before || "",
      after: randomMove.after || "",
    };
  } catch (error) {
    console.error("Error during ONNX model inference:", error);
    throw error;
  }
}