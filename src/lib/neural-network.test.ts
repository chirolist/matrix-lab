import { describe, expect, it } from "vitest";
import { toFeatureVector } from "@/lib/features";
import { LEARNING_STATUS, createDemoNetwork, forward, relu, trainNetwork } from "@/lib/neural-network";

describe("ニューラルネットの変換デモ", () => {
  it("ReLU は負の値を0にする", () => {
    expect(relu(-2)).toBe(0);
    expect(relu(1.5)).toBe(1.5);
  });

  it("softmax 出力の合計は1で、入力が変わると出力も変わる", () => {
    const model = createDemoNetwork();
    expect(model.trained).toBe(false);
    const low = forward(model, toFeatureVector({ games: 6000, big: 12, reg: 8 }).independent.map((rate) => rate * 1000));
    const high = forward(model, toFeatureVector({ games: 6000, big: 22, reg: 22 }).independent.map((rate) => rate * 1000));
    expect(low.probabilities.reduce((total, value) => total + value, 0)).toBeCloseTo(1, 10);
    expect(high.probabilities.reduce((total, value) => total + value, 0)).toBeCloseTo(1, 10);
    expect(high.probabilities[5]).not.toBeCloseTo(low.probabilities[5], 4);
  });

  it("学習機能は未実装である", () => {
    expect(LEARNING_STATUS.implemented).toBe(false);
    expect(trainNetwork().implemented).toBe(false);
  });
});
