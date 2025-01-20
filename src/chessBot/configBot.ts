import path from "path";

/**
 * Defines and resolves file paths used throughout the chess bot application.
 *
 * @constant
 * @namespace PATHS
 */
export const PATHS = {
  modelPaths: {
    less_1000: path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v1/model_elo_0_999_optimized_quantized.onnx"
    ),
    "1000_1500_opening": path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v5/optimized_model.onnx"
    ),
    "1000_1500_middle": path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v6/optimized_model.onnx"
    ),
  },
  moveToIdxPaths: {
    less_1000: path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v1/move_to_id.json"
    ),
    "1000_1500_opening": path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v5/move_to_idx.json"
    ),
    "1000_1500_middle": path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v6/move_to_idx.json"
    ),
  },
  idxToMovesPaths: {
    less_1000: path.resolve(
      process.cwd(),
      "src/chessBot/model/onnx_models/transformer_v1/id_to_move.json"
    ),
    "1000_1500_opening": null,
    "1000_1500_middle": null,
  },
  stockfish: {
    windows: "src/chessBot/stockfish/stockfish_windows/stockfish.exe",
    linux: "src/chessBot/stockfish/stockfish_linux/stockfish-ubuntu-x86-64-avx2",
  },
  syzygy: {
    windows: "src/chessBot/stockfish/stockfish_windows/src/syzygy",
    linux: "src/chessBot/stockfish/stockfish_linux/src/syzygy",
  },
};
