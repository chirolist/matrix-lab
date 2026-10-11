"use client";

import { useState } from "react";
import { featureMatrix } from "@/lib/features";
import { formatCoeff, formatOneOver } from "@/lib/format";
import type { MachineProfile } from "@/types";

const FEATURES = ["BIG確率", "REG確率"];

export function MatrixViewer({ machine, highlightIndex }: { machine: MachineProfile; highlightIndex: number }) {
  const matrix = featureMatrix(machine);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const setting = selected ? machine.settings[selected.row] : null;
  const featureName = selected ? FEATURES[selected.col] : null;
  const value = selected ? matrix[selected.row]?.[selected.col] : undefined;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        行列 W は、設定1〜6のBIG確率とREG確率を縦横に並べた表です。行が設定、列が特徴量です。この表をベクトルに掛けること自体は、設定の判定ではありません。判定に使うのは、この後の尤度です。
      </p>
      <div className="overflow-x-auto">
        <div className="inline-grid min-w-full grid-cols-[4.5rem_repeat(2,minmax(7rem,1fr))] gap-2" aria-label="設定ごとの特徴量行列">
          <div />
          {FEATURES.map((feature) => (
            <div key={feature} className="px-2 text-center text-xs text-accent-2">
              {feature}
            </div>
          ))}
          {matrix.map((row, rowIndex) => (
            <div key={machine.settings[rowIndex].setting} className="contents">
              <div className="flex items-center text-xs text-muted">
                設定{machine.settings[rowIndex].setting}
              </div>
              {row.map((cell, colIndex) => {
                const index = rowIndex * 2 + colIndex;
                const isSelected = selected?.row === rowIndex && selected?.col === colIndex;
                const highlighted = highlightIndex === index;
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelected({ row: rowIndex, col: colIndex })}
                    className={`rounded-xl border px-2 py-3 text-center font-mono text-sm ${
                      highlighted || isSelected ? "border-accent bg-accent/15 text-ink" : "border-line bg-lab text-ink"
                    }`}
                  >
                    {formatCoeff(cell)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-line bg-lab px-4 py-3 text-sm leading-6" aria-live="polite">
        {setting && featureName && value !== undefined ? (
          <p>
            設定{setting.setting}の{featureName}は {formatCoeff(value)}、つまり {formatOneOver(value)} です。行列 W の {selected ? selected.row + 1 : 0}行{selected ? selected.col + 1 : 0}列です。
          </p>
        ) : (
          <p className="text-muted">セルを選ぶと、設定番号、特徴量名、値を表示します。</p>
        )}
      </div>
    </div>
  );
}
