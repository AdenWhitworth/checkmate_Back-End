import * as ort from "onnxruntime-node";
import fs from "fs";
import path from "path";

/**
 * Paths to the ONNX model files based on ELO ranges.
 * Adjusted to correctly locate the files in the `src` directory.
 * 
 * @type {Record<string, string>}
 */
const modelPaths: Record<string, string> = {
  "less_1000": path.resolve(process.cwd(), "src/chessBot/onnx_models/model_elo_0_999_optimized_quantized.onnx"),
  "1000_1500": path.resolve(process.cwd(), "src/chessBot/onnx_models/model_elo_1000_1500_optimized_quantized.onnx"),
  "1500_2000": path.resolve(process.cwd(), "src/chessBot/onnx_models/model_elo_1500_2000_optimized_quantized.onnx"),
  "greater_2000": path.resolve(process.cwd(), "src/chessBot/onnx_models/model_elo_2000_plus_optimized_quantized.onnx"),
};

const modelSessions: Record<string, ort.InferenceSession> = {};

/**
 * Validates the existence of ONNX model files in the specified paths.
 *
 * @function validateModelPaths
 * @description Logs warnings for any missing model files and confirms paths for existing files.
 * @returns {void}
 */
function validateModelPaths(): void {
  console.log("Current working directory:", process.cwd());
  for (const [name, path] of Object.entries(modelPaths)) {
    if (!fs.existsSync(path)) {
      console.warn(`Warning: Model file not found for ${name}. Expected path: ${path}`);
    } else {
      console.log(`Model file found for ${name} at path: ${path}`);
    }
  }
}

/**
 * Preloads ONNX model files into inference sessions for efficient access during runtime.
 *
 * @async
 * @function preloadModels
 * @description This function validates model paths and creates inference sessions for all available models.
 * @returns {Promise<void>} Resolves when all models have been preloaded or errors have been logged.
 */
export async function preloadModels(): Promise<void> {
  validateModelPaths();
  for (const [name, path] of Object.entries(modelPaths)) {
    try {
      modelSessions[name] = await ort.InferenceSession.create(path);
      console.log(`Model ${name} successfully preloaded.`);
    } catch (error) {
      console.error(`Failed to load model ${name} from path ${path}:`, error);
    }
  }
}

/**
 * Retrieves the preloaded ONNX inference session based on the bot's difficulty level.
 *
 * @function getModelSession
 * @param {"novice" | "intermediate" | "advanced" | "master"} difficulty - The difficulty level of the bot.
 * @returns {ort.InferenceSession} The preloaded ONNX inference session corresponding to the given difficulty.
 * @throws {Error} Throws an error if the model for the requested difficulty has not been preloaded.
 */
export function getModelSession(difficulty: "novice" | "intermediate" | "advanced" | "master"): ort.InferenceSession {
  if (difficulty === "novice") return modelSessions["less_1000"]
  if (difficulty === "intermediate") return modelSessions["1000_1500"];
  if (difficulty === "advanced") return modelSessions["1500_2000"];
  return modelSessions["greater_2000"];
}