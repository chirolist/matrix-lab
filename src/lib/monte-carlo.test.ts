import { describe, expect, it } from "vitest";
import { juglerMachine } from "@/data/jugler-settings";
import { createRng, finalizeMonteCarlo, sampleBinomial, simulateOne } from "@/lib/monte-carlo";

describe("モンテカルロシミュレーション", () => {
  it("確率0と1の端では回数が端に寄る", () => {
    const rng = createRng(1);
    expect(sampleBinomial(8, 0, rng)).toBe(0);
    expect(sampleBinomial(8, 1, rng)).toBe(8);
  });

  it("標本平均が二項分布の期待値に近い", () => {
    const rng = createRng(42);
    const n = 20;
    const p = 0.3;
    const samples = 3000;
    let total = 0;
    for (let i = 0; i < samples; i += 1) total += sampleBinomial(n, p, rng);
    expect(total / samples).toBeCloseTo(n * p, 0);
  });

  it("同じ乱数種なら同じ判定列になる", () => {
    const first = [1, 2, 3].map(() => simulateOne(juglerMachine, 4, 500, createRng(7)).predictedSetting);
    const second = [1, 2, 3].map(() => simulateOne(juglerMachine, 4, 500, createRng(7)).predictedSetting);
    expect(first).toEqual(second);
  });

  it("判定された設定の割合は合計1になり、設定番号の範囲に収まる", () => {
    const rng = createRng(99);
    const trials = Array.from({ length: 20 }, () => simulateOne(juglerMachine, 6, 800, rng));
    const report = finalizeMonteCarlo(juglerMachine, 6, 800, trials);
    expect(report.trials).toBe(20);
    expect(report.ratesByCategory.reduce((total, rate) => total + rate, 0)).toBeCloseTo(1, 10);
    expect(report.correctRate).toBeGreaterThanOrEqual(0);
    expect(report.correctRate).toBeLessThanOrEqual(1);
    expect(trials.every((trial) => trial.predictedSetting >= 1 && trial.predictedSetting <= 6)).toBe(true);
    expect(trials.every((trial) => trial.big >= 0 && trial.reg >= 0 && trial.big + trial.reg <= 800)).toBe(true);
  });
});
