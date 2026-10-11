import type { Matrix, MatrixMultiplyStep, MatrixVectorProduct, Vector } from "@/types";

export class DimensionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DimensionError";
  }
}

export function assertFiniteVector(vector: Vector, label: string): void {
  if (vector.length === 0) {
    throw new DimensionError(`${label}に要素がありません。`);
  }
  for (let i = 0; i < vector.length; i += 1) {
    if (!Number.isFinite(vector[i])) {
      throw new DimensionError(`${label}の${i + 1}番目が数値として扱えません。`);
    }
  }
}

export function matrixSize(matrix: Matrix): { rows: number; cols: number } {
  if (matrix.length === 0) {
    throw new DimensionError("行列に行がありません。");
  }
  const cols = matrix[0].length;
  if (cols === 0) {
    throw new DimensionError("行列に列がありません。");
  }
  for (let row = 0; row < matrix.length; row += 1) {
    if (matrix[row].length !== cols) {
      throw new DimensionError(
        `行列の${row + 1}行目の列数（${matrix[row].length}）が1行目の列数（${cols}）と違うため、計算できません。`,
      );
    }
    for (let col = 0; col < cols; col += 1) {
      if (!Number.isFinite(matrix[row][col])) {
        throw new DimensionError(
          `行列の${row + 1}行${col + 1}列が数値として扱えません。空欄や無限大は計算できません。`,
        );
      }
    }
  }
  return { rows: matrix.length, cols };
}

/**
 * y = A x
 * 行の要素とベクトルの要素を掛けて、行ごとに足す。
 */
export function multiplyMatrixVector(matrix: Matrix, vector: Vector): MatrixVectorProduct {
  const { cols } = matrixSize(matrix);
  assertFiniteVector(vector, "ベクトル");
  if (vector.length !== cols) {
    throw new DimensionError(
      `行列の列数（${cols}）とベクトルの要素数（${vector.length}）が一致しないため、行列とベクトルの積は計算できません。A×x を計算するには、A の列数と x の長さを同じにしてください。`,
    );
  }

  const steps: MatrixMultiplyStep[] = matrix.map((row, rowIndex) => {
    const terms = row.map((a, col) => ({
      col,
      a,
      x: vector[col],
      product: a * vector[col],
    }));
    const sum = terms.reduce((total, term) => total + term.product, 0);
    return { row: rowIndex, terms, sum };
  });

  return { y: steps.map((step) => step.sum), steps };
}

export function addVectors(left: Vector, right: Vector): Vector {
  assertFiniteVector(left, "1つ目のベクトル");
  assertFiniteVector(right, "2つ目のベクトル");
  if (left.length !== right.length) {
    throw new DimensionError(
      `ベクトルの長さ（${left.length} と ${right.length}）が違うため、足し算できません。`,
    );
  }
  return left.map((value, index) => value + right[index]);
}

export function scaleVector(vector: Vector, factor: number): Vector {
  if (!Number.isFinite(factor)) {
    throw new DimensionError("倍率は有限な数値である必要があります。");
  }
  assertFiniteVector(vector, "ベクトル");
  return vector.map((value) => value * factor);
}
