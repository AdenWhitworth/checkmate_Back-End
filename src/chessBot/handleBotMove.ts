import * as ort from "onnxruntime-node";
import { Move, Square, PieceSymbol } from "chess.js";
import { getModelSession } from "./handleModels";

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

export async function determineNextBotMove(
  difficulty: "novice" | "intermediate" | "advanced" | "master",
  fen: string,
  currentTurn: "w" | "b"
): Promise<Move> {
  try {
    const session = getModelSession(difficulty);
    const inputTensor = fenToTensor(fen);
    const output = await session.run({ [session.inputNames[0]]: inputTensor });
    const botMove = outputToMove(output[session.outputNames[0]], fen, currentTurn);

    if (!botMove) {
      throw new Error("Bot couldn't find a valid move.");
    }

    return botMove;
  } catch (error) {
    return Promise.reject(new Error("Failed to determine the bot's next move."));
  }
}
