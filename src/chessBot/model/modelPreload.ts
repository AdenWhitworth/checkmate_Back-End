import * as ort from "onnxruntime-node";
import { loadJSON, validatePaths } from "../utility/fileValidator";
import { PATHS } from "../configBot";

const modelSessions: Record<string, ort.InferenceSession> = {};
const moveToIdxSession: Record<string, Record<string, number>> = {};
const idxToMoveSession: Record<string, Record<number, string>> = {};

/**
 * Preloads ONNX inference sessions for given model paths.
 * 
 * @param {Record<string, ort.InferenceSession>} sessions - Object to store the preloaded sessions.
 * @param {Record<string, string>} paths - Mapping of model names to their file paths.
 * @returns {Promise<void>} - Resolves when all sessions are preloaded.
 */
async function preloadInferenceSessions(
  sessions: Record<string, ort.InferenceSession>,
  paths: Record<string, string>
): Promise<void> {
  for (const [name, path] of Object.entries(paths)) {
    try {
      sessions[name] = await ort.InferenceSession.create(path);
      console.log(`Model ${name} successfully preloaded.`);
    } catch (error) {
      console.error(`Failed to preload model ${name} from ${path}:`, error);
    }
  }
}

/**
 * Loads move-to-index mappings from JSON files.
 * 
 * @param {Record<string, string>} paths - Mapping of names to their JSON file paths.
 * @param {Record<string, Record<string, number>>} session - Session object to store the mappings.
 */
function loadMoveToIdx(
  paths: Record<string, string>,
  session: Record<string, Record<string, number>>
): void {
  for (const [name, path] of Object.entries(paths)) {
    try {
      // Load the JSON file
      const moveToIdx: Record<string, number> = loadJSON(path);

      session[name] = moveToIdx;

      console.log(`Successfully loaded moveToIdx for ${name}`);
    } catch (error) {
      console.error(`Failed to load moveToIdx from ${path} for ${name}:`, error);
      throw error;
    }
  }
}

/**
 * Generates index-to-move mappings from move-to-index mappings.
 * 
 * @param {string} name - Name of the mapping to generate.
 * @param {Record<string, Record<string, number>>} moveToIdxSession - Session object containing move-to-index mappings.
 * @param {Record<string, Record<number, string>>} idxToMoveSession - Session object to store the generated index-to-move mappings.
 */
function generateIdxToMove(
  name: string,
  moveToIdxSession: Record<string, Record<string, number>>,
  idxToMoveSession: Record<string, Record<number, string>>
): void {
  const moveToIdx = moveToIdxSession[name];

  if (!moveToIdx) {
    console.error(`No moveToIdx mapping available to generate idxToMove for ${name}.`);
    return;
  }

  // Invert the moveToIdx mapping to create idxToMove
  idxToMoveSession[name] = Object.fromEntries(
    Object.entries(moveToIdx).map(([move, idx]) => [Number(idx), move])
  );

  console.log(`Successfully generated idxToMove for ${name} from moveToIdx.`);
}

/**
 * Loads index-to-move mappings from JSON files or generates them from move-to-index mappings.
 * 
 * @param {Record<string, string | null>} paths - Mapping of names to their JSON file paths (or null if unavailable).
 * @param {Record<string, Record<number, string>>} session - Session object to store the mappings.
 * @param {Record<string, Record<string, number>>} moveToIdxSession - Session object containing move-to-index mappings for fallback generation.
 */
function loadIdxToMove(
  paths: Record<string, string | null>,
  session: Record<string, Record<number, string>>,
  moveToIdxSession: Record<string, Record<string, number>>
): void {
  for (const [name, path] of Object.entries(paths)) {
    if (!path) {
      console.log(`Path is null for ${name}. Attempting to generate idxToMove from moveToIdx.`);
      generateIdxToMove(name, moveToIdxSession, session);
      continue;
    }

    try {
      const idxToMove: Record<string, string> = loadJSON(path);

      // Convert keys to numbers for the session
      session[name] = Object.fromEntries(
        Object.entries(idxToMove).map(([key, value]) => [Number(key), value])
      );

      console.log(`Successfully loaded idxToMove for ${name}`);
    } catch (error) {
      console.error(`Failed to load idxToMove from ${path} for ${name}:`, error);
      throw error;
    }
  }
}

/**
 * Preloads all models, move-to-index, and index-to-move mappings.
 * 
 * @returns {Promise<void>} - Resolves when all models and mappings are preloaded.
 */
export async function preloadModels(): Promise<void> {
  validatePaths(PATHS.modelPaths, "Model");
  validatePaths(PATHS.moveToIdxPaths, "MoveToIdx");
  validatePaths(PATHS.idxToMovesPaths, "IdxToMoves");

  await preloadInferenceSessions(modelSessions, PATHS.modelPaths);

  loadMoveToIdx(PATHS.moveToIdxPaths, moveToIdxSession);
  loadIdxToMove(PATHS.idxToMovesPaths, idxToMoveSession, moveToIdxSession);
}

/**
 * Retrieves the loaded model sessions and mappings.
 * 
 * @returns {{
 *   modelSessions: Record<string, ort.InferenceSession>,
 *   moveToIdxSession: Record<string, Record<string, number>>,
 *   idxToMoveSession: Record<string, Record<number, string>>
 * }} - The loaded sessions and mappings.
*/
export function getModelSessions(): {
  modelSessions: Record<string, ort.InferenceSession>;
  moveToIdxSession: Record<string, Record<string, number>>;
  idxToMoveSession: Record<string, Record<number, string>>;
} {
  return { modelSessions, moveToIdxSession, idxToMoveSession };
}

