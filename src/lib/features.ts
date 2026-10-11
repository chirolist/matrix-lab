import type { FeatureVector, MachineProfile, Matrix } from "@/types";
import type { BonusObservation } from "@/types";
import { bonusProbabilities } from "@/lib/likelihood";

export function toFeatureVector(observation: BonusObservation): FeatureVector {
  if (!(observation.games > 0)) {
    throw new Error("総回転数が0以下のため、頻度を計算できません。");
  }
  const bigRate = observation.big / observation.games;
  const regRate = observation.reg / observation.games;
  const combinedRate = (observation.big + observation.reg) / observation.games;
  return {
    bigRate,
    regRate,
    combinedRate,
    independent: [bigRate, regRate],
    display: [bigRate, regRate, combinedRate],
  };
}

/** 設定ごとの [BIG確率, REG確率]。6行2列がジャグラーの基本形。 */
export function featureMatrix(machine: MachineProfile): Matrix {
  return machine.settings.map((setting) => {
    const { pBig, pReg } = bonusProbabilities(setting);
    return [pBig, pReg];
  });
}

/** 1000回転あたりの理論回数。確率の小さな差をグラフで見るための尺度。 */
export function perThousand(probability: number): number {
  return probability * 1000;
}

export function probabilitySpread(machine: MachineProfile): { big: number; reg: number } {
  const bigs = machine.settings.map((setting) => perThousand(1 / setting.bigDenominator));
  const regs = machine.settings.map((setting) => perThousand(1 / setting.regDenominator));
  return {
    big: Math.max(...bigs) - Math.min(...bigs),
    reg: Math.max(...regs) - Math.min(...regs),
  };
}
