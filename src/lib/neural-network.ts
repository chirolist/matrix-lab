import { addVectors, multiplyMatrixVector } from "@/lib/matrix";
import { softmax } from "@/lib/probability";
import type { FeatureVector, Matrix, Vector } from "@/types";

export interface DenseLayer {
  id: "hidden" | "output";
  name: string;
  rowLabels: string[];
  colLabels: string[];
  weights: Matrix;
  bias: Vector;
  activation: "relu" | "linear";
}

export interface NeuralNetworkModel {
  id: string;
  name: string;
  trained: false;
  inputLabels: string[];
  outputLabels: string[];
  layers: DenseLayer[];
}

export interface UnitCalculation {
  index: number;
  label: string;
  terms: { weight: number; input: number; product: number }[];
  bias: number;
  sum: number;
  activated: number;
}

export interface ForwardResult {
  input: Vector;
  hiddenUnits: UnitCalculation[];
  hidden: Vector;
  outputUnits: UnitCalculation[];
  scores: Vector;
  probabilities: Vector;
}

export const LEARNING_STATUS = {
  implemented: false,
  message:
    "教師データを使った学習（損失関数、誤差逆伝播、勾配降下）は未実装です。表示中の重みは学習前の初期値であり、設定推定の結果ではありません。",
} as const;

export function relu(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value > 0 ? value : 0;
}

/**
 * デモ用の初期重み。高いREG頻度が上位設定側のスコアを押し上げるよう、
 * 説明しやすい形で手置きしている。データから学習した値ではない。
 */
export function createDemoNetwork(): NeuralNetworkModel {
  return {
    id: "neural-demo",
    name: "2層の変換デモ",
    trained: false,
    inputLabels: ["1000回転あたりBIG", "1000回転あたりREG"],
    outputLabels: ["設定1", "設定2", "設定3", "設定4", "設定5", "設定6"],
    layers: [
      {
        id: "hidden",
        name: "第1層",
        rowLabels: ["BIG寄り", "REG寄り", "低頻度", "差"],
        colLabels: ["BIG", "REG"],
        weights: [
          [1.2, 0.2],
          [0.15, 1.3],
          [-0.8, -0.5],
          [0.4, -0.6],
        ],
        bias: [-4.2, -3.6, 4.5, 0.2],
        activation: "relu",
      },
      {
        id: "output",
        name: "出力層",
        rowLabels: ["設定1", "設定2", "設定3", "設定4", "設定5", "設定6"],
        colLabels: ["BIG寄り", "REG寄り", "低頻度", "差"],
        weights: [
          [0.4, -1.2, 1.0, 0.2],
          [0.5, -0.6, 0.6, 0.1],
          [0.3, 0.2, 0.2, -0.4],
          [0.2, 0.7, -0.2, -0.2],
          [-0.2, 1.1, -0.5, 0.3],
          [-0.4, 1.4, -0.8, 0.4],
        ],
        bias: [0.2, 0.1, 0, 0, 0.1, 0.2],
        activation: "linear",
      },
    ],
  };
}

export function cloneNetwork(model: NeuralNetworkModel): NeuralNetworkModel {
  return {
    ...model,
    inputLabels: [...model.inputLabels],
    outputLabels: [...model.outputLabels],
    layers: model.layers.map((layer) => ({
      ...layer,
      rowLabels: [...layer.rowLabels],
      colLabels: [...layer.colLabels],
      weights: layer.weights.map((row) => [...row]),
      bias: [...layer.bias],
    })),
  };
}

/** 生の頻度は 0.00x と小さいので、デモでは1000回転あたりの回数に換算する。 */
export function toNetworkInput(features: FeatureVector): Vector {
  return [features.bigRate * 1000, features.regRate * 1000];
}

function activate(value: number, activation: DenseLayer["activation"]): number {
  return activation === "relu" ? relu(value) : value;
}

function layerUnits(layer: DenseLayer, input: Vector): UnitCalculation[] {
  const product = multiplyMatrixVector(layer.weights, input);
  return product.steps.map((step, index) => {
    const bias = layer.bias[index] ?? 0;
    const sum = step.sum + bias;
    return {
      index,
      label: layer.rowLabels[index] ?? `出力${index + 1}`,
      terms: step.terms.map((term) => ({
        weight: term.a,
        input: term.x,
        product: term.product,
      })),
      bias,
      sum,
      activated: activate(sum, layer.activation),
    };
  });
}

export function forward(model: NeuralNetworkModel, input: Vector): ForwardResult {
  const hiddenLayer = model.layers[0];
  const outputLayer = model.layers[1];
  if (!hiddenLayer || !outputLayer) {
    throw new Error("デモ用ネットワークには、中間層と出力層の2つが必要です。");
  }
  if (input.length !== hiddenLayer.weights[0]?.length) {
    throw new Error(
      `入力の長さ（${input.length}）と第1層の列数（${hiddenLayer.weights[0]?.length ?? 0}）が一致しません。`,
    );
  }
  const hiddenUnits = layerUnits(hiddenLayer, input);
  const hidden = hiddenUnits.map((unit) => unit.activated);
  const outputUnits = layerUnits(outputLayer, hidden);
  const scores = outputUnits.map((unit) => unit.activated);
  return {
    input,
    hiddenUnits,
    hidden,
    outputUnits,
    scores,
    probabilities: softmax(scores),
  };
}

/** バイアス加算までを行列演算の部品で確認するための補助。 */
export function preActivation(weights: Matrix, bias: Vector, input: Vector): Vector {
  const product = multiplyMatrixVector(weights, input);
  return addVectors(product.y, bias);
}

/**
 * 学習を足すときの入り口。
 * 交差エントロピー損失、誤差逆伝播、勾配降下で重みを更新する処理は、まだ置いていない。
 */
export function trainNetwork(): { implemented: false; message: string } {
  return LEARNING_STATUS;
}
