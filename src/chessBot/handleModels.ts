import * as ort from "onnxruntime-node";
import fs from "fs";

const modelPaths: Record<string, string> = {
    "less_1000": "./onnx_models/less_1000_model.onnx",
    "1000_1500": "./onnx_models/1000_1500_model.onnx",
    "1500_2000": "./onnx_models/1500_2000_model.onnx",
    "greater_2000": "./onnx_models/greater_2000_model.onnx",
};

const modelSessions: Record<string, ort.InferenceSession> = {};

function validateModelPaths() {
    for (const [name, path] of Object.entries(modelPaths)) {
      if (!fs.existsSync(path)) {
        console.warn(`Warning: Model file not found at path: ${path} (model: ${name})`);
      }
    }
}

export async function preloadModels(): Promise<void> {
    validateModelPaths();
    try {
      modelSessions["less_1000"] = await ort.InferenceSession.create(modelPaths.less_1000);
      modelSessions["1000_1500"] = await ort.InferenceSession.create(modelPaths["1000_1500"]);
      modelSessions["1500_2000"] = await ort.InferenceSession.create(modelPaths["1500_2000"]);
      modelSessions["greater_2000"] = await ort.InferenceSession.create(modelPaths.greater_2000);
      console.log("All models preloaded successfully.");
    } catch (error) {
      throw new Error("Failed to preload models.");
    }
  }

export function getModelSession(difficulty: "novice" | "intermediate" | "advanced" | "master"): ort.InferenceSession {
    if (difficulty === "novice") return modelSessions["less_1000"]
    if (difficulty === "intermediate") return modelSessions["1000_1500"];
    if (difficulty === "advanced") return modelSessions["1500_2000"];
    return modelSessions["greater_2000"];
}