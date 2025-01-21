import * as ort from "onnxruntime-node";
import { Chess, Move } from "chess.js";
import axios from "axios";

/**
 * Converts a FEN string into a tensor representation for the middle game model.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @returns {number[][][]} - A 3D tensor representing the board and turn information.
 */
function fenToTensorMiddle(fen: string): number[][][] {
  const pieceMap: Record<string, number> = {
    p: 1,
    r: 2,
    n: 3,
    b: 4,
    q: 5,
    k: 6,
    P: 7,
    R: 8,
    N: 9,
    B: 10,
    Q: 11,
    K: 12,
  };
  const tensor = Array.from({ length: 8 }, () =>
    Array.from({ length: 8 }, () => Array(12).fill(0))
  );

  const [board, turn] = fen.split(" ");
  let row = 0,
    col = 0;

  for (const char of board) {
    if (char === "/") {
      row++;
      col = 0;
    } else if (/\d/.test(char)) {
      col += parseInt(char, 10);
    } else {
      tensor[row][col][pieceMap[char] - 1] = 1;
      col++;
    }
  }

  const turnTensor = turn === "w" ? 1 : 0;
  tensor.forEach((row) =>
    row.forEach((col) => col.push(turnTensor))
  );

  return tensor;
}

/**
 * Converts a list of UCI moves into a tensor representation for the middle game model.
 *
 * @param {string[]} moves - Array of past moves in UCI notation.
 * @param {Record<string, number>} moveMap - Mapping of UCI moves to numeric indices.
 * @param {number} maxLength - Maximum length of the move history for padding.
 * @returns {number[]} - Tokenized and padded move history as a 1D array.
 */
function uciToTensorMiddle(
  moves: string[],
  moveMap: Record<string, number>,
  maxLength: number
): number[] {
  const moveIndices = moves.map((move) => moveMap[move]).filter((idx) => idx !== undefined);
  const paddedMoves = Array(maxLength).fill(0);
  moveIndices.slice(0, maxLength).forEach((idx, i) => {
    paddedMoves[i] = idx;
  });

  return paddedMoves;
}

/**
 * Counts the total number of pieces currently on the board.
 *
 * @param {Chess} board - The Chess.js instance representing the game state.
 * @returns {number} - The total number of pieces on the board.
 */
function countPieces(board: Chess): number {
  const boardState = board.board();
  let pieceCount = 0;

  for (const row of boardState) {
    for (const square of row) {
      if (square !== null) {
        pieceCount++;
      }
    }
  }

  return pieceCount;
}

/**
 * Predicts the best move for the middle game using a weighted priority approach.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @param {string[]} moves - Array of past moves in UCI notation.
 * @param {ort.InferenceSession} model - The ONNX middle game model.
 * @param {Record<string, number>} moveToIdx - Mapping of UCI moves to numeric indices.
 * @param {Record<number, string>} idxToMove - Mapping of numeric indices back to UCI moves.
 * @param {number} [maxMoveLength=195] - Maximum length of move history for the model input.
 * @param {number} [topN=5] - Number of top moves to return.
 * @param {number} [weightProb=0.4] - Weight assigned to move probability.
 * @param {number} [weightEval=0.6] - Weight assigned to evaluation scores.
 * @param {number} [mateEvalPriority=15] - Priority weight for mate evaluations.
 * @param {number} [kingSafetyPenalty=0.3] - Penalty for unsafe king positions.
 * @returns {Promise<{ predictedMove: string | null; topMoves: Record<string, any>[] }>} - Predicted best move and list of top moves with details.
 */
export async function predictMiddleMoveWeightedPriority(
  fen: string,
  moves: string[],
  model: ort.InferenceSession,
  moveToIdx: Record<string, number>,
  idxToMove: Record<number, string>,
  maxMoveLength: number = 195,
  topN: number = 5,
  weightProb: number = 0.4,
  weightEval: number = 0.6,
  mateEvalPriority: number = 15,
  kingSafetyPenalty: number = 0.3,
): Promise<{ predictedMove: string | null; topMoves: Record<string, any>[] }> {
  
  const middleGameMoves = moves.slice(10);
  const fenTensor = fenToTensorMiddle(fen);
  const movesTensor: number[] = uciToTensorMiddle(middleGameMoves, moveToIdx, maxMoveLength);

  const fenDims = [1, 8, 8, 13];
  const movesDims = [1, maxMoveLength];

  const inputs = {
    args_0: new ort.Tensor("float32", fenTensor.flat(3), fenDims),
    args_1: new ort.Tensor(
      "float32",
      new Float32Array(movesTensor),
      movesDims
    ),
  };

  const output = await model.run(inputs);

  const movePred = output["next_move_output"].data as number[];
  const cpPreds = output["cp_outputs"].data as number[];
  const matePreds = output["mate_outputs"].data as number[];

  const board = new Chess(fen);
  const legalMoves = board.moves({ verbose: true });
  const legalUciMoves = legalMoves.map(
    (move) => move.from + move.to + (move.promotion || "")
  );
  const isEndgame = countPieces(board) < 14;

  const sortedIndices = Array.from(movePred.keys()).sort((a, b) => {
    return movePred[b] - movePred[a];
  });

  const topMoves = [];

  for (const idx of sortedIndices) {
    const predictedMove = idxToMove[idx];

    const boardClone = new Chess(board.fen());

    if (!legalUciMoves.includes(predictedMove)) {
      continue;
    }

    const moveSuccess = boardClone.move(predictedMove);
    if (!moveSuccess) {
      continue;
    }

    const cpEvalRaw = cpPreds[idx] * 1000.0;
    const mateEvalRaw = matePreds[idx];
    const cpEval = Math.max(Math.min(cpEvalRaw / 500.0, 1), -1);
    const mateEval =
      Math.abs(mateEvalRaw) < 0.01
        ? 0
        : mateEvalRaw < 0
        ? Math.max(-1, mateEvalRaw / mateEvalPriority)
        : Math.min(1, mateEvalRaw / mateEvalPriority);

    let adjustedWeightProb = weightProb;
    let adjustedWeightEval = weightEval;

    if (cpEval > 1) {
      adjustedWeightProb += 0.2;
      adjustedWeightEval -= 0.1;
    }

    const finalKingSafetyPenalty = isEndgame ? kingSafetyPenalty + 0.1 : kingSafetyPenalty;

    const blendedEval = 0.8 * mateEval + 0.4 * cpEval;
    let weightedScore =
      adjustedWeightProb * Math.pow(movePred[idx], 0.75) +
      adjustedWeightEval * blendedEval -
      (boardClone.inCheck() ? finalKingSafetyPenalty : 0);

    topMoves.push({
      move: predictedMove,
      probability: movePred[idx],
      cpEvalRaw,
      mateEvalRaw,
      blendedEval,
      weightedScore: Math.max(weightedScore, 0),
    });

    if (topMoves.length === topN) break;
  }

  topMoves.sort((a, b) => b.weightedScore - a.weightedScore);
  return { predictedMove: topMoves[0]?.move || null, topMoves };
}

/**
 * Converts a FEN string into a tensor representation for the opening model.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @returns {number[]} - A 1D tensor representation of the board state and turn.
 * @throws {Error} - Throws an error if an unexpected FEN character is encountered.
 */
function fenToTensorOpening(fen: string): number[] {
  const charToIndex: Record<string, number> = {
    'p': 1, 'r': 2, 'n': 3, 'b': 4, 'q': 5, 'k': 6,
    'P': 7, 'R': 8, 'N': 9, 'B': 10, 'Q': 11, 'K': 12,
    '/': 0,
    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0 
  };

  const fixedLength = 65;

  const [board, turn] = fen.split(" ");
  const boardTensor: number[] = [];

  for (const char of board) {
    if (char in charToIndex) {
      const value = charToIndex[char];
      if (typeof value === "number") {
        boardTensor.push(value);
      }
    } else {
      throw new Error(`Unexpected FEN character: ${char}`);
    }
  }

  const turnTensor = turn === "w" ? 1 : 0;
  const fullTensor = [...boardTensor, turnTensor];

  if (fullTensor.length < fixedLength) {
    return [...fullTensor, ...Array(fixedLength - fullTensor.length).fill(0)];
  } else if (fullTensor.length > fixedLength) {
    return fullTensor.slice(0, fixedLength);
  }

  return fullTensor;
}

/**
 * Converts a list of UCI moves into a tensor representation for the opening model.
 *
 * @param {string[]} moves - Array of past moves in UCI notation.
 * @param {Record<string, number>} moveMap - Mapping of UCI moves to numeric indices.
 * @param {number} maxLength - Maximum length of the move history for padding.
 * @returns {number[]} - Tokenized and padded move history as a 1D array.
 */
function uciToTensorOpening(
  moves: string[],
  moveMap: Record<string, number>,
  maxLength: number
): number[] {
  const moveIndices = moves
    .map((move) => moveMap[move])
    .filter((idx) => idx !== undefined);

  if (moveIndices.length > maxLength) {
    return moveIndices.slice(0, maxLength);
  } else {
    return [...moveIndices, ...Array(maxLength - moveIndices.length).fill(0)];
  }
}

/**
 * Predicts the best opening move and its outcome using the opening model.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @param {string[]} moves - Array of past moves in UCI notation.
 * @param {ort.InferenceSession} model - The ONNX opening model.
 * @param {Record<string, number>} moveToIdx - Mapping of UCI moves to numeric indices.
 * @param {Record<number, string>} idxToMove - Mapping of numeric indices back to UCI moves.
 * @param {number} [maxMoveLength=28] - Maximum length of move history for the model input.
 * @returns {Promise<{ predictedMove: string; predictedOutcome: string }>} - Predicted best move and outcome.
 */
export async function predictOpeningeMoveOutcome(
  fen: string,
  moves: string[],
  model: ort.InferenceSession,
  moveToIdx: Record<string, number>,
  idxToMove: Record<number, string>,
  maxMoveLength: number = 28
): Promise<{ predictedMove: string; predictedOutcome: string }> {
  const fenTensor = new ort.Tensor(
    "float32",
    new Float32Array(fenToTensorOpening(fen)),
    [1, 65]
  );
  const movesTensor = new ort.Tensor(
    "float32",
    new Float32Array(uciToTensorOpening(moves, moveToIdx, maxMoveLength)),
    [1, maxMoveLength]
  );

  const output = await model.run({ args_0: fenTensor, args_1: movesTensor });
  const movePred = output["next_move_output"].data as Float32Array;
  const outcomePred = output["outcome_output"].data as Float32Array;

  const board = new Chess(fen);
  const legalMoves = board.moves({ verbose: true });
  const legalUciMoves = legalMoves.map(
    (move) => move.from + move.to + (move.promotion || "")
  );

  const sortedIndices = Array.from(movePred.keys()).sort(
    (a, b) => movePred[b] - movePred[a]
  );

  let predictedMove = "";
  for (const idx of sortedIndices) {
    const move = idxToMove[idx];

    if (legalUciMoves.includes(move)) {
      predictedMove = move;
      break;
    }
  }

  const reverseOutcomeMap = ["Loss", "Draw", "Win"];
  const predictedOutcome = reverseOutcomeMap[outcomePred.indexOf(Math.max(...outcomePred))];

  return { predictedMove, predictedOutcome };
}

/**
 * Queries the Lichess tablebase API for endgame predictions.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @returns {Promise<any | null>} - Tablebase data or null if not available.
 */
async function queryTablebase(fen: string): Promise<any | null> {
  const url = `https://tablebase.lichess.ovh/standard?fen=${encodeURIComponent(fen)}`;
  try {
    const response = await axios.get(url);
    if (response.status === 200) {
      return response.data;
    }
  } catch (error) {
    console.error("Error querying Lichess tablebase:", error);
  }
  return null;
}

interface TablebaseMove {
  uci: string;
  wdl: number;
}

/**
 * Predicts the best move during the endgame phase using tablebase data.
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @returns {Promise<{ predictedMove: string | null; }>} - Predicted best move or null if unavailable.
 */
async function predictEndMove(fen: string): Promise<{ predictedMove: string | null; }> {
  const tablebaseData = await queryTablebase(fen);
  if (tablebaseData && tablebaseData.moves) {
    const bestMove = tablebaseData.moves.reduce((prev: TablebaseMove, curr: TablebaseMove) =>
      (curr.wdl ?? 0) > (prev.wdl ?? 0) ? curr : prev
    );
    return {predictedMove: bestMove.uci};
  }
  return {predictedMove: null};
}

/**
 * Predicts the best move based on the game state (opening, middle, or endgame).
 *
 * @param {string} fen - The FEN string representing the chess board state.
 * @param {string[]} moves - Array of past moves in UCI notation.
 * @param {ort.InferenceSession} openingModel - The ONNX opening model.
 * @param {Record<string, number>} openingMoveToIdx - Opening move-to-index mapping.
 * @param {Record<number, string>} openingIdxToMove - Opening index-to-move mapping.
 * @param {ort.InferenceSession} middleModel - The ONNX middle game model.
 * @param {Record<string, number>} middleMoveToIdx - Middle move-to-index mapping.
 * @param {Record<number, string>} middleIdxToMove - Middle index-to-move mapping.
 * @returns {Promise<Move>} - The best move as a `Move` object.
 */
export async function predictBestMoveV6Model(
  fen: string,
  moves: string[],
  openingModel: ort.InferenceSession,
  openingMoveToIdx: Record<string, number>,
  openingIdxToMove: Record<number, string>,
  middleModel: ort.InferenceSession,
  middleMoveToIdx: Record<string, number>,
  middleIdxToMove: Record<number, string>,
): Promise<Move> {
  const board = new Chess(fen);
  const numPieces = countPieces(board)
  try {
    if (moves.length <= 10) {
      const result = await predictOpeningeMoveOutcome(fen,moves,openingModel,openingMoveToIdx, openingIdxToMove);
      if (!result.predictedMove) throw new Error("No opening prediction available.");
      return board.move(result.predictedMove);
    } else if (numPieces <= 7) {
      const result = await predictEndMove(fen);
      if (!result.predictedMove) throw new Error("No endgame prediction available.");
      return board.move(result.predictedMove);
    } else {
      const result = await predictMiddleMoveWeightedPriority(fen, moves, middleModel, middleMoveToIdx, middleIdxToMove);
      if (!result.predictedMove) throw new Error("No middle game prediction available.");
      return board.move(result.predictedMove);
    }
  } catch (error) {
    throw new Error("Unable to predict V6 model best move.");
  }
}
