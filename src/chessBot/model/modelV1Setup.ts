import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";

/**
 * Prepares input data for the ONNX model by tokenizing and padding the move history.
 *
 * @param {string[]} moves - Array of past moves in Standard Algebraic Notation (SAN).
 * @param {{ [key: string]: number }} moveToId - Mapping of moves to their corresponding numeric IDs.
 * @param {number} maxLength - Maximum length of the padded move history.
 * @returns {Float32Array} - Tokenized and padded move history as a Float32Array.
 */
function prepareInput(moves: string[], moveToId: { [key: string]: number }, maxLength: number): Float32Array {
  const tokenizedHistory = moves.map((move) => moveToId[move] || 0);
  const paddedHistory = new Array(maxLength).fill(0);
  for (let i = 0; i < tokenizedHistory.length; i++) {
    paddedHistory[i] = tokenizedHistory[i];
  }
  return Float32Array.from(paddedHistory);
}

/**
 * Predicts the best chess move using a preloaded ONNX model.
 *
 * @param {string[]} moves - Array of past moves in Standard Algebraic Notation (SAN).
 * @param {ort.InferenceSession} model - ONNX inference session for the model.
 * @param {Record<string, number>} moveToId - Mapping of moves to their corresponding numeric IDs.
 * @param {Record<number, string>} idToMove - Mapping of numeric IDs back to move strings.
 * @param {number} [maxMoveLength=485] - Maximum length of the move history for the model input.
 * @returns {Promise<Move>} - The best move as a Move object.
 * @throws {Error} - Throws if no valid predictions are available or the model fails to execute.
 */
export async function predictBestMoveV1Model(
  moves: string[],
  model: ort.InferenceSession,
  moveToId: Record<string, number>,
  idToMove: Record<number, string>,
  maxMoveLength: number = 485
): Promise<Move> {
  try {

    const board = new Chess();
    for (const move of moves) {
      board.move(move);
    }

    const inputTensor = prepareInput(moves, moveToId, maxMoveLength);

    const feeds: Record<string, ort.Tensor> = {
      args_0: new ort.Tensor("float32", inputTensor, [1, maxMoveLength]),
    };

    const results = await model.run(feeds);

    const outputName = model.outputNames[0];
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
      throw new Error("No prediction available.");
    }

    const bestMoveSAN = filteredProbabilities[0].move;
    const bestMove = legalMoves.find((move) => move.san === bestMoveSAN);

    if (bestMove) {
      return bestMove;
    } else {
      throw new Error("No prediction available.");
    }
  } catch (error) {
    throw new Error("Unable to predict V1 model best move.");
  }
}