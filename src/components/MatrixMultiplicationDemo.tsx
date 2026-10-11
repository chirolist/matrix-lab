"use client";

import { useState } from "react";
import { featureMatrix } from "@/lib/features";
import { formatCoeff } from "@/lib/format";
import { DimensionError, multiplyMatrixVector } from "@/lib/matrix";
import type { MachineProfile, Matrix, MatrixMultiplyStep, Vector } from "@/types";

const BASIC_ROWS = [
  ["1", "2"],
  ["3", "-1"],
  ["0.5", "4"],
];
const BASIC_VECTOR = ["3", "2"];
const MISMATCH_VECTOR = ["1", "2", "3"];

function equation(step: MatrixMultiplyStep): string {
  const factor = (value: number) => {
    const text = formatCoeff(value);
    return value < 0 ? `(${text})` : text;
  };
  const products = step.terms.map((term) => `${factor(term.a)}×${factor(term.x)}`);
  const values = step.terms.map((term) => factor(term.product));
  return `y${step.row + 1} = ${products.join(" + ")} = ${values.join(" + ")} = ${factor(step.sum)}`;
}

function parseNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function MatrixMultiplicationDemo({ machine }: { machine: MachineProfile }) {
  const [rows, setRows] = useState<string[][]>(BASIC_ROWS);
  const [vector, setVector] = useState<string[]>(BASIC_VECTOR);

  const parsed = (() => {
    const matrix: Matrix = [];
    for (const row of rows) {
      const numbers: number[] = [];
      for (const cell of row) {
        const value = parseNumber(cell);
        if (value === null) return { error: "行列に、空欄または数値として読めないセルがあります。" };
        numbers.push(value);
      }
      matrix.push(numbers);
    }
    const x: Vector = [];
    for (const cell of vector) {
      const value = parseNumber(cell);
      if (value === null) return { error: "ベクトルに、空欄または数値として読めない要素があります。" };
      x.push(value);
    }
    try {
      return { product: multiplyMatrixVector(matrix, x) };
    } catch (error) {
      if (error instanceof DimensionError) return { error: error.message };
      return { error: "行列の積を計算できませんでした。" };
    }
  })();

  function updateCell(row: number, col: number, value: string) {
    setRows((current) => current.map((line, index) => (index === row ? line.map((cell, cellIndex) => (cellIndex === col ? value : cell)) : line)));
  }

  function loadBasic() {
    setRows(BASIC_ROWS.map((row) => [...row]));
    setVector([...BASIC_VECTOR]);
  }

  function loadMismatch() {
    setRows([
      ["1", "0"],
      ["0", "1"],
    ]);
    setVector([...MISMATCH_VECTOR]);
  }

  function loadFeatureMatrix() {
    const matrix = featureMatrix(machine);
    setRows(matrix.map((row) => row.map((value) => value.toFixed(6))));
    setVector(["1", "1"]);
  }

  function addRow() {
    if (rows.length >= 6) return;
    const width = rows[0]?.length ?? 1;
    setRows((current) => [...current, Array.from({ length: width }, () => "0")]);
  }

  function addColumn() {
    if ((rows[0]?.length ?? 0) >= 4) return;
    setRows((current) => current.map((row) => [...row, "0"]));
    setVector((current) => [...current, "0"]);
  }

  function removeRow() {
    if (rows.length <= 1) return;
    setRows((current) => current.slice(0, -1));
  }

  function addVectorOnly() {
    if (vector.length >= 6) return;
    setVector((current) => [...current, "1"]);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        行列 A とベクトル x の積 y = A x は、行ごとの重み付き和です。これは計算の練習で、設定推定そのものではありません。推定結果は、別カードの多項分布モデルを見てください。
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={loadBasic} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          基本の例
        </button>
        <button type="button" onClick={loadMismatch} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          次元が合わない例
        </button>
        <button type="button" onClick={loadFeatureMatrix} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          特徴量行列 W を読み込む
        </button>
        <button type="button" onClick={addRow} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          行を追加
        </button>
        <button type="button" onClick={addColumn} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          列を追加
        </button>
        <button type="button" onClick={removeRow} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          最後の行を削除
        </button>
        <button type="button" onClick={addVectorOnly} className="rounded-full border border-line px-3 py-1.5 text-xs text-ink">
          ベクトルだけ追加
        </button>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[20rem] flex-wrap items-start gap-4">
          <div>
            <p className="mb-2 text-xs text-accent-2">行列 A（{rows.length}行{rows[0]?.length ?? 0}列）</p>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${rows[0]?.length ?? 1}, minmax(4.5rem, 1fr))` }}>
              {rows.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <input
                    key={`${rowIndex}-${colIndex}`}
                    aria-label={`Aの${rowIndex + 1}行${colIndex + 1}列`}
                    value={cell}
                    onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                    className="w-full rounded-lg border border-line bg-lab px-2 py-2 text-center font-mono text-sm"
                  />
                )),
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs text-accent-2">ベクトル x（{vector.length}要素）</p>
            <div className="grid gap-2">
              {vector.map((cell, index) => (
                <input
                  key={index}
                  aria-label={`xの${index + 1}番目`}
                  value={cell}
                  onChange={(event) => setVector((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
                  className="w-24 rounded-lg border border-line bg-lab px-2 py-2 text-center font-mono text-sm"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
      {"error" in parsed ? (
        <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent" role="alert">
          {parsed.error}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-ink">計算結果 y</p>
          <ol className="space-y-2">
            {parsed.product.steps.map((step) => (
              <li key={step.row} className="overflow-x-auto rounded-xl border border-line bg-lab px-3 py-2 font-mono text-xs leading-6 text-ink sm:text-sm">
                {equation(step)}
              </li>
            ))}
          </ol>
          <p className="text-xs leading-5 text-muted">
            たとえば y1 は、1行目の各要素にベクトルの対応する要素を掛け、その積を足した値です。特徴量行列 W に [1, 1] を掛けると、各行は BIG確率 + REG確率、つまり合成確率になります。それは「その設定のボーナスの出やすさ」であって、観測データから求めた設定の推定確率ではありません。
          </p>
        </div>
      )}
    </div>
  );
}
