import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";
import { getModelSession } from "./handleModels";
import * as path from "path";
import fs from "fs/promises";

type MoveHistory = string[];

const maxLength = 485;
let moveToId: { [key: string]: number } | null = null;
let idToMove: { [key: number]: string } | null = null;

/**
 * Loads the move-to-ID and ID-to-move mappings from JSON files.
 * Ensures the mappings are loaded only once and stored globally.
 *
 * @throws {Error} If the mapping files cannot be read or parsed.
 */
async function loadMappings() {
  if (moveToId && idToMove) return;

  const moveToIdPath = path.resolve(__dirname, "onnx_models", "move_to_id.json");
  const idToMovePath = path.resolve(__dirname, "onnx_models", "id_to_move.json");

  try {
    moveToId = JSON.parse(await fs.readFile(moveToIdPath, "utf-8"));
    idToMove = JSON.parse(await fs.readFile(idToMovePath, "utf-8"));
    console.log("Mappings loaded successfully.");
  } catch (error) {
    console.error("Error loading mapping files. Check if the files exist and are accessible.", error);
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
  // Convert move history to IDs using moveToId mapping
  const tokenizedHistory = moveHistory.map((move) => moveToId[move] || 0);

  // Pad the history to match the model's expected input length
  const paddedHistory = new Array(maxLength).fill(0);
  for (let i = 0; i < tokenizedHistory.length; i++) {
    paddedHistory[i] = tokenizedHistory[i];
  }

  return Float32Array.from(paddedHistory);
}

/**
 * Converts a FEN string to a move history array.
 *
 * @param fen - The FEN string representing the current board state.
 * @returns An array of moves in SAN format representing the game history.
 */
function verboseToMoveHistory(verboseHistory: Move[]): MoveHistory {
  return verboseHistory.map((move) => move.san);
}

/**
 * Predicts the next chess move based on the provided game history and difficulty level.
 *
 * @param {Move[]} history - An array of moves representing the game history in verbose format.
 * Each move contains properties like `from`, `to`, `color`, `piece`, `san`, etc.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the prediction.
 * Determines which model to use for the prediction.
 * @returns {Promise<Move>} A Promise that resolves to a `Move` object representing the predicted move.
 * The `Move` object includes details like `from`, `to`, `san`, and other metadata about the move.
 *
 * @throws {Error} If there is an issue with loading mappings, ONNX session initialization,
 * model inference, or if no valid move can be determined.
 */
export async function predictNextMove(history: Move[], difficulty: "novice" | "intermediate" | "advanced" | "master",): Promise<Move> {
  try {
    const moveHistory: MoveHistory = verboseToMoveHistory(history);

    await loadMappings();
    if (!moveToId || !idToMove) {
      throw new Error("Mappings not loaded properly.");
    }

    const session = getModelSession("base");
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
        console.log("Valid predicted move found:", matchedMove);

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