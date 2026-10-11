import { describe, expect, it } from "vitest";
import { DimensionError, addVectors, multiplyMatrixVector } from "@/lib/matrix";

describe("行列とベクトルの積", () => {
  it("列数とベクトル長が違うときは計算しない", () => {
    const matrix = [
      [1, 0, 0],
      [0, 1, 0],
    ];
    expect(() => multiplyMatrixVector(matrix, [1, 2])).toThrow(DimensionError);
    expect(() => multiplyMatrixVector(matrix, [1, 2])).toThrow(/列数（3）とベクトルの要素数（2）が一致しない/);
  });

  it("行の長さが揃っていない行列は計算しない", () => {
    expect(() => multiplyMatrixVector([[1, 2], [3]], [1, 2])).toThrow(/列数/);
  });

  it("数値でない要素は計算しない", () => {
    expect(() => multiplyMatrixVector([[1, Number.NaN]], [1, 2])).toThrow(/数値として扱えません/);
  });

  it("各行のかけ算と足し算が手計算と一致する", () => {
    const product = multiplyMatrixVector(
      [
        [1, 2],
        [3, 4],
      ],
      [5, 6],
    );
    expect(product.y).toEqual([17, 39]);
    expect(product.steps[0].terms.map((term) => term.product)).toEqual([5, 12]);
    expect(product.steps[0].sum).toBe(17);
    expect(product.steps[1].sum).toBe(39);
  });

  it("長さの違うベクトルは足せない", () => {
    expect(() => addVectors([1, 2], [1])).toThrow(/足し算できません/);
  });
});
