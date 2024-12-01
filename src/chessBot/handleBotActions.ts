import * as ort from "onnxruntime-node";
import { Chess, Move, Square, PieceSymbol } from "chess.js";
import { getModelSession } from "./handleModels";

/**
 * Converts a FEN string to a tensor representation of the chess board.
 *
 * @param {string} fen - The FEN string representing the current board state.
 * @returns {ort.Tensor} A tensor representation of the chess board.
 */
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

  // Convert board array to Float32Array
  return new ort.Tensor("float32", new Float32Array(boardArray), [1, 8, 8, 1]);
}

/**
 * Extracts additional features from a FEN string to assist the model in decision-making.
 *
 * @param {string} fen - The FEN string representing the current board state.
 * @returns {ort.Tensor} A tensor containing features such as turn, castling rights, en passant availability, etc.
 */
function extractFeaturesFromFen(fen: string): ort.Tensor {
  const parts = fen.split(" ");
  const turn = parts[1] === "w" ? 1 : 0;
  const castling = parts[2];
  const enPassant = parts[3] !== "-" ? parts[3] : null;
  const halfMoveClock = parseInt(parts[4], 10);
  const fullMoveNumber = parseInt(parts[5], 10);

  const castlingRights = [
    castling.includes("K") ? 1 : 0,
    castling.includes("Q") ? 1 : 0,
    castling.includes("k") ? 1 : 0,
    castling.includes("q") ? 1 : 0,
  ];

  const enPassantFile = enPassant
    ? enPassant.charCodeAt(0) - "a".charCodeAt(0)
    : -1;

  const features = [
    turn,
    ...castlingRights,
    enPassantFile,
    halfMoveClock,
    fullMoveNumber,
  ];

  return new ort.Tensor("float32", new Float32Array(features), [1, features.length]);
}

/**
 * Retrieves the piece type on the chess board from the given FEN string and square.
 *
 * @param {string} fen - The FEN string representing the current board state.
 * @param {number} fromSquare - The square index (0-63) on the board.
 * @returns {string | undefined} The piece type (`"p"`, `"n"`, `"b"`, `"r"`, `"q"`, `"k"`) or `undefined` if no piece is present.
 */
function getPieceType(fen: string, fromSquare: number): string | undefined {
  const pieceMap: Record<string, string> = {
      p: "p", n: "n", b: "b", r: "r", q: "q", k: "k", // Black pieces
      P: "p", N: "n", B: "b", R: "r", Q: "q", K: "k", // White pieces
  };

  const rows = fen.split(" ")[0].split("/");
  const row = rows[Math.floor(fromSquare / 8)];
  let fileIndex = fromSquare % 8;

  for (const char of row) {
      if (parseInt(char)) {
          if (fileIndex < parseInt(char)) {
              return undefined;
          }
          fileIndex -= parseInt(char);
      } else {
          if (fileIndex === 0) {
              return pieceMap[char];
          }
          fileIndex--;
      }
  }

  return undefined;
}

/**
 * Converts the model's output tensor into a move object.
 *
 * @param {ort.Tensor} output - The tensor output from the model.
 * @param {string} fen - The FEN string representing the current board state.
 * @param {"w" | "b"} currentTurn - The current turn (`"w"` for white, `"b"` for black).
 * @returns {Move | null} A move object or `null` if the move is invalid.
 */
function outputToMove(output: ort.Tensor, fen: string, currentTurn: "w" | "b"): Move | null {
  const moveIndex = output.data[0] as number;
  const fromSquare = Math.floor(moveIndex / 64);
  const toSquare = moveIndex % 64;

  const fromFile = String.fromCharCode("a".charCodeAt(0) + (fromSquare % 8));
  const fromRank = Math.floor(fromSquare / 8) + 1;
  const toFile = String.fromCharCode("a".charCodeAt(0) + (toSquare % 8));
  const toRank = Math.floor(toSquare / 8) + 1;

  const from = `${fromFile}${fromRank}`;
  const to = `${toFile}${toRank}`;

  const promotion = toRank === 8 || toRank === 1 ? "q" : undefined;

  const piece = getPieceType(fen, fromSquare);

  if (!piece) {
      return null;
  }

  const moveData: Move = {
      from: from as Square,
      to: to as Square,
      color: currentTurn,
      piece: piece as PieceSymbol,
      promotion,
      flags: "",
      san: "",
      lan: "",
      before: "",
      after: "",
  };

  return moveData;
}

/**
 * Determines the next move for the bot based on a pre-trained ONNX model.
 *
 * @async
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @param {string} fen - The FEN string representing the current board state.
 * @param {"w" | "b"} currentTurn - The current turn (`"w"` for white, `"b"` for black).
 * @returns {Promise<Move>} A promise that resolves to the next move for the bot.
 * @throws {Error} Throws an error if the bot cannot determine a valid move or the game state is invalid.
 */
export async function determineNextBotMove(
  difficulty: "novice" | "intermediate" | "advanced" | "master",
  fen: string,
  currentTurn: "w" | "b"
): Promise<Move> {
  try {
    const session = getModelSession(difficulty);
    const boardTensor = fenToTensor(fen);
    const featuresTensor = extractFeaturesFromFen(fen);
    const output = await session.run({
      board_input: boardTensor,
      features_input: featuresTensor,
    });
    const botMove = outputToMove(output[session.outputNames[0]], fen, currentTurn);

    if (!botMove) {
      throw new Error("Bot couldn't find a valid move.");
    }

    return botMove;
  } catch (error) {
    console.log(error);
    return Promise.reject(new Error("Failed to determine the bot's next move."));
  }
}

/**
 * Determines the next move for the bot using simple heuristics.
 *
 * @async
 * @param {string} fen - The FEN string representing the current board state.
 * @returns {Promise<Move>} A promise that resolves to the next move for the bot.
 * @throws {Error} Throws an error if the game is already over.
 */
export async function determineNextBotMoveSimple(
  fen: string,
): Promise<Move> {
  const chess = new Chess();
  chess.load(fen);

  if (chess.isGameOver()) {
    throw new Error("Game is already over!");
  }

  const getGreedyMove = (): Move | null => {
    const moves = chess.moves({ verbose: true });
    let bestMove: Move | null = null;
    let highestValue = 0;

    const pieceValues: { [key: string]: number } = {
      p: 1,
      n: 3,
      b: 3,
      r: 5,
      q: 9,
    };

    for (const move of moves) {
      if (move.captured) {
        const value = pieceValues[move.captured.toLowerCase()] || 0;
        if (value > highestValue) {
          highestValue = value;
          bestMove = move;
        }
      }
    }

    return bestMove;
  };

  const getRandomMove = (): Move => {
    const moves = chess.moves({ verbose: true });
    const randomIndex = Math.floor(Math.random() * moves.length);
    return moves[randomIndex];
  };

  const move = getGreedyMove() || getRandomMove();
  return move;
}


