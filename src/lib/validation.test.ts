import { describe, expect, it } from "vitest";
import { validateObservation, validateSimulationInput } from "@/lib/validation";

describe("入力バリデーション", () => {
  it("初期値の例は受け付ける", () => {
    const result = validateObservation({ games: "6000", big: "20", reg: "15" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toEqual({ games: 6000, big: 20, reg: 15 });
  });

  it("総回転数 0 はエラー", () => {
    const result = validateObservation({ games: "0", big: "0", reg: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.includes("1以上"))).toBe(true);
  });

  it("空欄はエラー", () => {
    const result = validateObservation({ games: "", big: "1", reg: "1" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.includes("入力してください"))).toBe(true);
  });

  it("負数はエラー", () => {
    const result = validateObservation({ games: "100", big: "-1", reg: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.includes("0以上"))).toBe(true);
  });

  it("小数はエラー", () => {
    const result = validateObservation({ games: "100.5", big: "1", reg: "0" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.includes("小数"))).toBe(true);
  });

  it("BIGとREGの合計が総回転数を超えるとエラー", () => {
    const result = validateObservation({ games: "10", big: "8", reg: "3" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.some((error) => error.includes("超えて"))).toBe(true);
  });

  it("異常に大きな総回転数はエラー", () => {
    const result = validateObservation({ games: "100000000", big: "0", reg: "0" });
    expect(result.ok).toBe(false);
  });

  it("BIGとREGが0でも観測データとして成立する", () => {
    const result = validateObservation({ games: "100", big: "0", reg: "0" });
    expect(result.ok).toBe(true);
  });

  it("シミュレーション回数の上限を超えるとエラー", () => {
    const result = validateSimulationInput({ games: "6000", trials: "5000" });
    expect(result.ok).toBe(false);
  });
});
