import { Chess, Move } from "chess.js";
import { createStockfishInstance } from "./stockfishPreload";

const STOCKFISH_TIMEOUT_MILLISECONDS = 30000;

/**
 * Maps difficulty levels to Stockfish ELO ratings and search depths.
 *
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for Stockfish.
 * @returns {{ stockfishElo: number; depth: number }} - An object containing the Stockfish ELO rating and search depth.
 */
function difficultyToStockfishElo(
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): { stockfishElo: number; depth: number } {
  switch (difficulty) {
    case "novice":
      return { stockfishElo: 1350, depth: 1 };
    case "intermediate":
      return { stockfishElo: 1350, depth: 5 };
    case "advanced":
      return { stockfishElo: 1750, depth: 10 };
    case "master":
    default:
      return { stockfishElo: 2750, depth: 20 };
  }
}

/**
 * Predicts the best move for a given chess position using Stockfish.
 *
 * @param {string} fen - The FEN string representing the current chess board state.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level for the Stockfish engine.
 * @returns {Promise<Move>} - A promise that resolves with the best move as a `Move` object or rejects with an error.
 *
 * @throws {Error} - Throws an error if the Stockfish process times out, closes unexpectedly, or returns an invalid move.
 */
export async function predictBestMoveStockfish(
  fen: string,
  difficulty: "novice" | "intermediate" | "advanced" | "master"
): Promise<Move> {
  const chess = new Chess(fen);
  const { stockfishElo, depth } = difficultyToStockfishElo(difficulty);

  return new Promise<Move>((resolve, reject) => {
    const {stockfishInstance, syzygyPath} = createStockfishInstance()
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        stockfishInstance.kill();
        reject(new Error("Stockfish timed out."));
      }
    }, STOCKFISH_TIMEOUT_MILLISECONDS);

    stockfishInstance.stdout.on("data", (data) => {
      const output = data.toString();

      if (output.includes("bestmove")) {
        const bestMoveLAN = output.split("bestmove ")[1].split(" ")[0].trim();
        const move = chess.move(bestMoveLAN);

        if (move) {
          clearTimeout(timeout);
          resolved = true;
          stockfishInstance.kill();
          resolve(move);
        } else {
          clearTimeout(timeout);
          resolved = true;
          stockfishInstance.kill();
          reject(new Error(`Invalid move from Stockfish: ${bestMoveLAN}`));
        }
      }
    });

    stockfishInstance.stderr.on("data", (data) => {
      console.error("Stockfish error:", data.toString());
    });

    stockfishInstance.on("close", () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error("Stockfish process closed unexpectedly."));
      }
    });

    stockfishInstance.stdin.write("uci\n");
    stockfishInstance.stdin.write("isready\n");
    stockfishInstance.stdin.write("setoption name Threads value 1\n");
    stockfishInstance.stdin.write("setoption name Hash value 128\n");
    stockfishInstance.stdin.write(`position fen ${fen}\n`);
    stockfishInstance.stdin.write(`setoption name SyzygyPath value ${syzygyPath}\n`);
    stockfishInstance.stdin.write("setoption name SyzygyProbeDepth value 7\n");
    stockfishInstance.stdin.write("setoption name UCI_LimitStrength value false\n");
    stockfishInstance.stdin.write(`setoption name UCI_Elo value ${stockfishElo}\n`);
    stockfishInstance.stdin.write("setoption name Ponder value true\n");
    stockfishInstance.stdin.write(`go depth ${depth}\n`);
    stockfishInstance.stdin.write("setoption name MultiPV value 5\n");
    
  });
}