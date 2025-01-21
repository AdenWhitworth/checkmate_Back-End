import { spawn, ChildProcessWithoutNullStreams } from "child_process";
import { PATHS } from "../configBot";
import { validatePaths } from "../utility/fileValidator";
import * as fs from "fs";

/**
 * Creates a new Stockfish instance and determines the appropriate Syzygy path.
 *
 * @returns {{ stockfishInstance: ChildProcessWithoutNullStreams; syzygyPath: string }} - 
 * An object containing the spawned Stockfish instance and the Syzygy tablebase path.
 * 
 * @throws {Error} - Throws an error if the Stockfish binary or Syzygy path is invalid, 
 * or if the Stockfish binary is not executable on Linux.
 */
export function createStockfishInstance(): { stockfishInstance: ChildProcessWithoutNullStreams; syzygyPath: string } {
  try {
    validatePaths(PATHS.stockfish, "Stockfish");
    validatePaths(PATHS.syzygy, "Syzygy");

    const stockfishPath = process.platform === "win32" ? PATHS.stockfish.windows : PATHS.stockfish.linux;
    const syzygyPath = process.platform === "win32" ? PATHS.syzygy.windows : PATHS.syzygy.linux;

    if (process.platform === "linux") {
      fs.accessSync(stockfishPath, fs.constants.X_OK);
    }

    const stockfishInstance = spawn(stockfishPath);
    return { stockfishInstance, syzygyPath };
  } catch (error) {
    throw new Error(`Failed to create Stockfish instance: ${error}`);
  }
}