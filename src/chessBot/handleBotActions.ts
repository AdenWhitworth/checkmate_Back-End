import { Move } from "chess.js";
import { preloadModels, getModelSessions } from "./model/modelPreload";
import { predictBestMoveV1Model } from "./model/modelV1Setup";
import { predictBestMoveV6Model } from "./model/modelV6Setup";
import { predictBestMoveStockfish } from "./stockfish/stockfishSetup";

/**
 * Preloads all models and initializes required data for the bots.
 *
 * @async
 * @function preloadBots
 * @returns {Promise<void>} - Resolves when models are preloaded, logs an error otherwise.
 */
export async function preloadBots(): Promise<void> {
  try {
    await preloadModels();
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Failed to preload bots: ", error.message);
    }
  }
}

/**
 * Converts verbose move history from the Chess.js format to SAN notation.
 *
 * @function verboseToMoveHistory
 * @param {Move[]} verboseHistory - Array of moves in Chess.js verbose format.
 * @returns {string[]} - Array of moves in SAN (Standard Algebraic Notation).
 */
function verboseToMoveHistory(verboseHistory: Move[]): string[] {
  return verboseHistory.map((move) => move.san);
}

/**
 * A task queue for managing asynchronous Stockfish operations.
 *
 * @class StockfishTaskQueue
 * @private
 */
class StockfishTaskQueue {
  private queue: (() => Promise<any>)[] = [];
  private isProcessing = false;

  async add(task: () => Promise<any>): Promise<any> {
    console.log("Adding task to queue. Current queue size:", this.queue.length);

    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          console.log("Starting task...");
          resolve(await task());
          console.log("Task completed successfully.");
        } catch (error) {
          console.error("Task failed:", error);
          reject(error);
        }
      });

      console.log("Task added. New queue size:", this.queue.length);

      if (!this.isProcessing) {
        console.log("Queue is idle. Starting to process the queue.");
        this.processQueue();
      }
    });
  }

  /**
   * Processes tasks in the queue sequentially.
   *
   * @private
   * @returns {Promise<void>} - Resolves when the queue is empty.
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      console.log("Queue is empty. Stopping processing.");
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    console.log("Processing queue. Remaining tasks:", this.queue.length);

    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (error) {
        console.error("Error while processing task:", error);
      }
      console.log("Task finished. Remaining queue size:", this.queue.length);
      this.processQueue();
    }
  }
}

const stockfishQueue = new StockfishTaskQueue();

/**
 * Determines the best move for a bot based on difficulty level.
 *
 * @async
 * @function getBotBestMove
 * @param {string} fen - The FEN string representing the current chess board state.
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - Difficulty level of the bot.
 * @param {Move[]} history - Array of past moves in Chess.js verbose format.
 * @returns {Promise<Move>} - Resolves to the best move determined by the bot.
 * @throws {Error} - Throws if a valid move cannot be determined.
 */
export async function getBotBestMove(
  fen: string,
  difficulty: "novice" | "intermediate" | "advanced" | "master",
  history: Move[]
): Promise<Move> {
  return stockfishQueue.add(async () => {
    try {
      const { modelSessions, moveToIdxSession, idxToMoveSession } = getModelSessions();
      const moves: string[] = verboseToMoveHistory(history);

      switch (difficulty) {
        case "novice": {
          const session = modelSessions["less_1000"];
          const moveToIdx = moveToIdxSession["less_1000"];
          const idxToMove = idxToMoveSession["less_1000"];
          if (!session || !moveToIdx || !idxToMove) {
            throw new Error("Model for novice difficulty is not preloaded.");
          }
          return await predictBestMoveV1Model(moves, session, moveToIdx, idxToMove);
        }
        case "intermediate": {
          const openingSession = modelSessions["1000_1500_opening"];
          const openingMoveToIdx = moveToIdxSession["1000_1500_opening"];
          const openingIdxToMove = idxToMoveSession["1000_1500_opening"];

          const middleSession = modelSessions["1000_1500_middle"];
          const middleMoveToIdx = moveToIdxSession["1000_1500_middle"];
          const middleIdxToMove = idxToMoveSession["1000_1500_middle"];

          if (
            !openingSession ||
            !openingMoveToIdx ||
            !openingIdxToMove ||
            !middleSession ||
            !middleMoveToIdx ||
            !middleIdxToMove
          ) {
            throw new Error("Models for intermediate difficulty are not fully preloaded.");
          }

          return await predictBestMoveV6Model(
            fen,
            moves,
            openingSession,
            openingMoveToIdx,
            openingIdxToMove,
            middleSession,
            middleMoveToIdx,
            middleIdxToMove
          );
        }
        case "advanced":
        case "master": {
          return await predictBestMoveStockfish(fen, difficulty);
        }
        default:
          throw new Error("Invalid difficulty level specified.");
      }
    } catch (error) {
      console.log("here",error);
      throw new Error("Failed to determine a valid move.");
    }
  });
}