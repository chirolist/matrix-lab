import { describe, expect, it } from "vitest";
import { logGamma, logSumExp, normalizeFromLog, softmax } from "@/lib/probability";

describe("対数ガンマと正規化", () => {
  it("logΓ(1) = log(0!) = 0", () => {
    expect(logGamma(1)).toBe(0);
  });

  it("logΓ(6) は log(120) と一致する", () => {
    expect(logGamma(6)).toBeCloseTo(Math.log(120), 12);
  });

  it("100までの階乗対数は log の足し算と一致する", () => {
    let sum = 0;
    for (let n = 1; n <= 100; n += 1) sum += Math.log(n);
    expect(logGamma(101)).toBeCloseTo(sum, 10);
  });

  it("log-sum-exp は最大値付近でも桁落ちしない", () => {
    expect(logSumExp([-1000, -1000])).toBeCloseTo(-1000 + Math.log(2), 10);
    const probs = normalizeFromLog([-1000, -1000, -1000]);
    expect(probs.reduce((total, value) => total + value, 0)).toBeCloseTo(1, 12);
    expect(probs[0]).toBeCloseTo(1 / 3, 12);
  });

  it("softmax の合計は 1", () => {
    const values = softmax([1, 2, 3]);
    expect(values.reduce((total, value) => total + value, 0)).toBeCloseTo(1, 12);
    expect(values[2]).toBeGreaterThan(values[0]);
  });
});
