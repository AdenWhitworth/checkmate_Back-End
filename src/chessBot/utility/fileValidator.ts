import fs from "fs";

/**
 * Validates the existence of files specified in a paths object.
 *
 * @param {Record<string, string | null>} paths - A record where keys are descriptive names and values are file paths.
 * @param {string} type - A descriptive label for the type of files being validated (e.g., "Model", "Config").
 *
 * @example
 * const paths = { modelA: "/path/to/modelA.onnx", modelB: null };
 * validatePaths(paths, "Model");
 *
 * @throws {void} - Logs a warning if a file path does not exist, but does not throw an exception.
 */
export function validatePaths(paths: Record<string, string | null>, type: string): void {
  console.log(`Validating ${type} paths...`);
  for (const [name, path] of Object.entries(paths)) {
    if (!path) continue;
    if (!fs.existsSync(path)) {
      console.warn(`Warning: ${type} file not found for ${name}. Expected path: ${path}`);
    } else {
      console.log(`${type} file found for ${name} at path: ${path}`);
    }
  }
}

/**
 * Loads a JSON file from the specified path and parses its content.
 *
 * @param {string} filePath - The absolute path to the JSON file.
 * @returns {any} - The parsed JSON object.
 *
 * @example
 * const config = loadJSON("/path/to/config.json");
 *
 * @throws {Error} - Throws an error if the file does not exist, cannot be read, or contains invalid JSON.
 */
export function loadJSON(filePath: string): any {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (error) {
    console.error(`Failed to load JSON from ${filePath}:`, error);
    throw error;
  }
}
