import { describe, expect, it } from "vitest";
import { juglerMachine, machines } from "@/data/jugler-settings";
import { featureMatrix, toFeatureVector } from "@/lib/features";
import { inferBonusSettings } from "@/lib/inference";
import { bonusProbabilities, logLikelihood } from "@/lib/likelihood";
import type { MachineProfile } from "@/types";

function factorial(n: number): number {
  let value = 1;
  for (let i = 2; i <= n; i += 1) value *= i;
  return value;
}

describe("確率・期待回数・事後確率", () => {
  it("BIG確率とREG確率は分母の逆数", () => {
    const probabilities = bonusProbabilities(juglerMachine.settings[0]);
    expect(probabilities.pBig).toBeCloseTo(1 / 273.1, 12);
    expect(probabilities.pReg).toBeCloseTo(1 / 439.8, 12);
    expect(probabilities.pNone).toBeCloseTo(1 - probabilities.pBig - probabilities.pReg, 12);
  });

  it("期待回数は総回転数 × 確率", () => {
    const result = inferBonusSettings({ games: 6000, big: 20, reg: 15 }, juglerMachine);
    const setting1 = result.estimates.find((estimate) => estimate.setting === 1);
    expect(setting1?.expectedBig).toBeCloseTo(6000 / 273.1, 10);
    expect(setting1?.expectedReg).toBeCloseTo(6000 / 439.8, 10);
    expect(setting1?.bigDiff).toBeCloseTo(20 - 6000 / 273.1, 10);
    expect(setting1?.regDiff).toBeCloseTo(15 - 6000 / 439.8, 10);
  });

  it("小さい入力の対数尤度は、階乗を直接計算した尤度と一致する", () => {
    const games = 10;
    const big = 2;
    const reg = 1;
    const pBig = 0.2;
    const pReg = 0.1;
    const pNone = 0.7;
    const coefficient = factorial(games) / (factorial(big) * factorial(reg) * factorial(games - big - reg));
    const likelihood = coefficient * pBig ** big * pReg ** reg * pNone ** (games - big - reg);
    expect(Math.exp(logLikelihood(games, big, reg, pBig, pReg))).toBeCloseTo(likelihood, 10);
  });

  it("BIGとREGが0でも対数尤度は有限で、事後確率の合計は1", () => {
    const result = inferBonusSettings({ games: 1000, big: 0, reg: 0 }, juglerMachine);
    expect(result.estimates.every((estimate) => Number.isFinite(estimate.logLikelihood))).toBe(true);
    expect(result.posteriorSum).toBeCloseTo(1, 10);
    expect(result.top.setting).toBe(1);
  });

  it("事後確率の合計は約100%", () => {
    const result = inferBonusSettings({ games: 6000, big: 20, reg: 15 }, juglerMachine);
    expect(result.posteriorSum).toBeCloseTo(1, 10);
    expect(result.ranked[0].posterior).toBeGreaterThan(result.ranked[1]?.posterior ?? 0);
  });

  it("ボーナスが多いと、低設定より高設定の推定確率が上がる", () => {
    const result = inferBonusSettings({ games: 6000, big: 30, reg: 30 }, juglerMachine);
    const setting1 = result.estimates.find((estimate) => estimate.setting === 1);
    const setting6 = result.estimates.find((estimate) => estimate.setting === 6);
    expect(setting6 && setting1 && setting6.posterior > setting1.posterior).toBe(true);
  });

  it("特徴量ベクトルは頻度になり、合成頻度は独立成分に含めない", () => {
    const features = toFeatureVector({ games: 6000, big: 20, reg: 15 });
    expect(features.bigRate).toBeCloseTo(20 / 6000, 12);
    expect(features.regRate).toBeCloseTo(15 / 6000, 12);
    expect(features.combinedRate).toBeCloseTo(35 / 6000, 12);
    expect(features.independent).toEqual([features.bigRate, features.regRate]);
    expect(features.display).toHaveLength(3);
  });

  it("特徴量行列は6行2列で、合成確率は列に入らない", () => {
    const matrix = featureMatrix(juglerMachine);
    expect(matrix).toHaveLength(6);
    expect(matrix.every((row) => row.length === 2)).toBe(true);
    expect(matrix[0][0]).toBeCloseTo(1 / 273.1, 12);
    expect(matrix[0][1]).toBeCloseTo(1 / 439.8, 12);
  });

  it("合成確率の掲載値だけを変えても推定結果は変わらない", () => {
    const observation = { games: 6000, big: 20, reg: 15 };
    const before = inferBonusSettings(observation, juglerMachine);
    const modified: MachineProfile = {
      ...juglerMachine,
      settings: juglerMachine.settings.map((setting) => ({ ...setting, combinedDenominator: 10 })),
    };
    const after = inferBonusSettings(observation, modified);
    before.estimates.forEach((estimate, index) => {
      expect(after.estimates[index].posterior).toBeCloseTo(estimate.posterior, 12);
      expect(after.estimates[index].logLikelihood).toBeCloseTo(estimate.logLikelihood, 12);
    });
  });

  it("掲載した全機種は設定1〜6を持ち、確率の合計は1未満", () => {
    expect(machines).toHaveLength(8);
    expect(new Set(machines.map((item) => item.id)).size).toBe(machines.length);
    for (const machine of machines) {
      expect(machine.settings.map((setting) => setting.setting)).toEqual([1, 2, 3, 4, 5, 6]);
      for (const setting of machine.settings) {
        const probabilities = bonusProbabilities(setting);
        expect(probabilities.pNone).toBeGreaterThan(0);
        expect(probabilities.pBig).toBeGreaterThan(0);
        expect(probabilities.pReg).toBeGreaterThan(0);
      }
    }
  });

  it("設定のBIG・REG確率を変えると推定結果が変わる", () => {
    const observation = { games: 3000, big: 30, reg: 30 };
    const before = inferBonusSettings(observation, juglerMachine);
    const modified: MachineProfile = {
      ...juglerMachine,
      settings: juglerMachine.settings.map((setting) =>
        setting.setting === 1 ? { ...setting, bigDenominator: 100, regDenominator: 100 } : setting,
      ),
    };
    const after = inferBonusSettings(observation, modified);
    const beforeSetting1 = before.estimates.find((estimate) => estimate.setting === 1);
    const afterSetting1 = after.estimates.find((estimate) => estimate.setting === 1);
    expect(afterSetting1 && beforeSetting1 && afterSetting1.posterior > beforeSetting1.posterior).toBe(true);
    expect(after.top.setting).toBe(1);
  });
});
