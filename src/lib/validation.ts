import type { BonusObservation } from "@/types";

export const MAX_GAMES = 1_000_000;
export const MAX_SIMULATION_TRIALS = 2_000;
export const MAX_SIMULATION_GAMES = 100_000;

export interface ObservationInput {
  games: string;
  big: string;
  reg: string;
}

export type ValidationResult =
  | { ok: true; value: BonusObservation }
  | { ok: false; errors: string[] };

function normalizeDigits(raw: string): string {
  return raw
    .trim()
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/[ー－―−]/g, "-")
    .replace(/．/g, ".");
}

function parseInteger(raw: string, label: string, min: number): { value?: number; error?: string } {
  const text = normalizeDigits(raw);
  if (text === "") return { error: `${label}を入力してください。` };
  if (/^-?\d+\.\d+$/.test(text)) {
    return { error: `${label}は整数で入力してください。小数は使えません。` };
  }
  if (!/^-?\d+$/.test(text)) {
    return { error: `${label}は整数で入力してください。` };
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value > MAX_GAMES) {
    return { error: `${label}は${MAX_GAMES.toLocaleString("ja-JP")}以下の整数にしてください。` };
  }
  if (value < min) {
    return {
      error:
        min === 0
          ? `${label}は0以上の整数にしてください。`
          : `${label}は${min}以上の整数にしてください。`,
    };
  }
  return { value };
}

export function validateObservation(input: ObservationInput): ValidationResult {
  const errors: string[] = [];
  const games = parseInteger(input.games, "総回転数", 1);
  const big = parseInteger(input.big, "BIG回数", 0);
  const reg = parseInteger(input.reg, "REG回数", 0);
  if (games.error) errors.push(games.error);
  if (big.error) errors.push(big.error);
  if (reg.error) errors.push(reg.error);
  if (games.value !== undefined && big.value !== undefined && reg.value !== undefined && big.value + reg.value > games.value) {
    errors.push("BIG回数とREG回数の合計が総回転数を超えています。ボーナス回数は総回転数以下にしてください。");
  }
  if (errors.length > 0 || games.value === undefined || big.value === undefined || reg.value === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, value: { games: games.value, big: big.value, reg: reg.value } };
}

export function validateSimulationInput(input: { games: string; trials: string }): { ok: true; games: number; trials: number } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  const games = parseInteger(input.games, "シミュレーションの総回転数", 1);
  const trialsText = normalizeDigits(input.trials);
  let trials: number | undefined;
  if (trialsText === "") errors.push("シミュレーション回数を入力してください。");
  else if (!/^\d+$/.test(trialsText)) errors.push("シミュレーション回数は1以上の整数にしてください。");
  else {
    trials = Number(trialsText);
    if (!Number.isSafeInteger(trials) || trials < 1) {
      errors.push("シミュレーション回数は1以上の整数にしてください。");
    } else if (trials > MAX_SIMULATION_TRIALS) {
      errors.push(`シミュレーション回数は${MAX_SIMULATION_TRIALS.toLocaleString("ja-JP")}以下にしてください。ブラウザが固まるのを防ぐ上限です。`);
    }
  }
  if (games.error) errors.push(games.error);
  if (games.value !== undefined && games.value > MAX_SIMULATION_GAMES) {
    errors.push(`シミュレーションの総回転数は${MAX_SIMULATION_GAMES.toLocaleString("ja-JP")}以下にしてください。`);
  }
  if (errors.length > 0 || games.value === undefined || trials === undefined) {
    return { ok: false, errors };
  }
  return { ok: true, games: games.value, trials };
}
