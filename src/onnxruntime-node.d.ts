declare module "onnxruntime-node" {
    export class InferenceSession {
      static create(path: string): Promise<InferenceSession>;
      inputNames: string[];
      outputNames: string[];
      run(feeds: Record<string, Tensor>): Promise<Record<string, Tensor>>;
    }
  
    export class Tensor<T = number> {
      constructor(type: "float32" | "int32" | "int64", data: T[] | Float32Array | Int32Array | Int64Array, dims: number[]);
      data: T[] | Float32Array | Int32Array | Int64Array;
      dims: number[];
    }
}
  
  