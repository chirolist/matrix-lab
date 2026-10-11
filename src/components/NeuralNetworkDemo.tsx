"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, tooltipStyle } from "@/components/ChartFrame";
import { formatCoeff, formatPercent } from "@/lib/format";
import {
  LEARNING_STATUS,
  cloneNetwork,
  createDemoNetwork,
  forward,
  toNetworkInput,
  type NeuralNetworkModel,
  type UnitCalculation,
} from "@/lib/neural-network";
import type { FeatureVector } from "@/types";

const STEPS = ["入力", "重み付き和", "バイアス", "ReLU", "出力スコア", "softmax"] as const;

function heatColor(value: number, maxAbs: number): string {
  if (!Number.isFinite(value) || maxAbs === 0) return "rgba(24, 35, 56, 1)";
  const amount = Math.min(1, Math.abs(value) / maxAbs);
  const alpha = 0.18 + amount * 0.82;
  return value >= 0 ? `rgba(255, 138, 61, ${alpha})` : `rgba(76, 195, 255, ${alpha})`;
}

function unitLine(unit: UnitCalculation, showActivation: boolean): string {
  const terms = unit.terms.map((term) => `${formatCoeff(term.weight)}×${formatCoeff(term.input)}`);
  const base = `${unit.label}: ${terms.join(" + ")} + ${formatCoeff(unit.bias)} = ${formatCoeff(unit.sum)}`;
  return showActivation ? `${base} → ${formatCoeff(unit.activated)}` : base;
}

export function NeuralNetworkDemo({ features }: { features: FeatureVector | null }) {
  const [model, setModel] = useState<NeuralNetworkModel>(() => createDemoNetwork());
  const [layerIndex, setLayerIndex] = useState(0);
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [draft, setDraft] = useState("0");
  const [step, setStep] = useState(STEPS.length - 1);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step >= STEPS.length - 1) {
        setPlaying(false);
        return;
      }
      setStep(step + 1);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [playing, step]);

  const input = useMemo(() => (features ? toNetworkInput(features) : [0, 0]), [features]);
  const result = useMemo(() => forward(model, input), [model, input]);
  const layer = model.layers[layerIndex];
  const maxAbs = Math.max(...layer.weights.flat().map((value) => Math.abs(value)), ...layer.bias.map((value) => Math.abs(value)), 1);

  function selectWeight(row: number, col: number) {
    setSelected({ row, col });
    setDraft(String(layer.weights[row][col]));
  }

  function selectBias(row: number) {
    setDraft(String(layer.bias[row]));
    setSelected({ row, col: -1 });
  }

  function applyDraft() {
    if (!selected) return;
    const value = Number(draft);
    if (!Number.isFinite(value)) return;
    setModel((current) => {
      const next = cloneNetwork(current);
      const target = next.layers[layerIndex];
      if (selected.col < 0) target.bias[selected.row] = value;
      else target.weights[selected.row][selected.col] = value;
      return next;
    });
  }

  const showing = step;
  const chartData = result.probabilities.map((probability, index) => ({
    name: model.outputLabels[index],
    probability: Number((probability * 100).toFixed(2)),
  }));

  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm leading-6 text-accent" role="note">
        {LEARNING_STATUS.message}
      </p>
      <p className="text-sm leading-6 text-muted">
        入力は分類に使う2つの頻度を、1000回転あたりの回数に換算したものです。合成頻度は入れていません。流れは、入力 → 重み行列との積 → バイアス加算 → ReLU → 出力スコア → softmax です。
      </p>
      <div className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full px-3 py-1.5 text-xs ${showing === index ? "bg-accent text-lab" : "border border-line text-muted"}`}
          >
            {index + 1}. {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            setStep(0);
            setPlaying(true);
          }}
          className="rounded-full border border-accent-2 px-3 py-1.5 text-xs text-accent-2"
        >
          {playing ? "変換を再生中" : "変換を再生"}
        </button>
        <button
          type="button"
          onClick={() => {
            setModel(createDemoNetwork());
            setSelected(null);
          }}
          className="rounded-full border border-line px-3 py-1.5 text-xs text-ink"
        >
          初期値に戻す
        </button>
      </div>
      <div className={`rounded-xl border px-4 py-3 text-sm leading-6 ${showing === 0 ? "border-accent" : "border-line"}`}>
        <p className="text-xs text-accent-2">入力 z</p>
        <p className="font-mono">
          {model.inputLabels.map((label, index) => `${label} ${formatCoeff(input[index])}`).join(" / ")}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {model.layers.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setLayerIndex(index);
              setSelected(null);
            }}
            className={`rounded-full px-3 py-1.5 text-xs ${layerIndex === index ? "bg-accent-2 text-lab" : "border border-line text-muted"}`}
          >
            {item.name}の{index === 0 ? "重み W1 とバイアス b1" : "重み W2 とバイアス b2"}
          </button>
        ))}
      </div>
      <div className={`overflow-x-auto rounded-xl p-2 ${showing >= 1 && showing <= 3 && layerIndex === 0 ? "ring-1 ring-accent" : ""} ${showing >= 4 && layerIndex === 1 ? "ring-1 ring-accent" : ""}`}>
        <div className="inline-grid gap-2" style={{ gridTemplateColumns: `5rem repeat(${layer.colLabels.length}, minmax(4.5rem, 1fr)) 5.5rem` }}>
          <div />
          {layer.colLabels.map((label) => (
            <div key={label} className="text-center text-[11px] text-muted">
              {label}
            </div>
          ))}
          <div className="text-center text-[11px] text-muted">バイアス</div>
          {layer.weights.map((row, rowIndex) => (
            <div key={layer.rowLabels[rowIndex]} className="contents">
              <div className="flex items-center text-xs text-muted">{layer.rowLabels[rowIndex]}</div>
              {row.map((value, colIndex) => {
                const active = selected?.row === rowIndex && selected.col === colIndex;
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => selectWeight(rowIndex, colIndex)}
                    className={`rounded-lg border px-2 py-3 font-mono text-xs ${active ? "border-ink" : "border-transparent"}`}
                    style={{ background: heatColor(value, maxAbs), color: "#e7eefc" }}
                  >
                    {formatCoeff(value)}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => selectBias(rowIndex)}
                className="rounded-lg border border-line bg-lab px-2 py-3 font-mono text-xs"
                style={{ background: heatColor(layer.bias[rowIndex], maxAbs) }}
              >
                {formatCoeff(layer.bias[rowIndex])}
              </button>
            </div>
          ))}
        </div>
      </div>
      <p className="text-xs text-muted">オレンジが正の重み、青が負の重みです。色が濃いほど絶対値が大きいです。セルを選んで値を変えると、出力を計算し直します。</p>
      {selected ? (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyDraft();
          }}
        >
          <label className="text-xs text-muted">
            {selected.col < 0 ? `${layer.rowLabels[selected.row]}のバイアス` : `${layer.rowLabels[selected.row]} × ${layer.colLabels[selected.col]}`}
            <input value={draft} onChange={(event) => setDraft(event.target.value)} className="mt-1 block w-32 rounded-lg border border-line bg-lab px-2 py-2 font-mono text-sm text-ink" />
          </label>
          <button type="submit" className="rounded-full bg-accent px-4 py-2 text-xs font-medium text-lab">
            重みを更新
          </button>
        </form>
      ) : (
        <p className="text-xs text-muted">セルを選ぶと、その重みを編集できます。</p>
      )}
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={`rounded-xl border px-3 py-3 text-xs leading-6 ${showing >= 1 && showing <= 3 ? "border-accent" : "border-line"}`}>
          <p className="mb-1 text-sm text-ink">中間層 h = ReLU(W1 z + b1)</p>
          {result.hiddenUnits.map((unit) => (
            <p key={unit.label} className="font-mono text-muted">
              {unitLine(unit, showing >= 3)}
            </p>
          ))}
        </div>
        <div className={`rounded-xl border px-3 py-3 text-xs leading-6 ${showing >= 4 ? "border-accent" : "border-line"}`}>
          <p className="mb-1 text-sm text-ink">出力 o = W2 h + b2</p>
          {result.outputUnits.map((unit) => (
            <p key={unit.label} className="font-mono text-muted">
              {unit.label}: スコア {formatCoeff(unit.sum)} / softmax {formatPercent(result.probabilities[unit.index])}
            </p>
          ))}
        </div>
      </div>
      {showing >= 5 ? (
        <ChartFrame heightClass="h-64">
          <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" width={48} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString("ja-JP")}%`, "デモ出力"]} />
            <Bar dataKey="probability" radius={[8, 8, 0, 0]}>
              {chartData.map((item) => (
                <Cell key={item.name} fill="#ff8a3d" />
              ))}
            </Bar>
          </BarChart>
        </ChartFrame>
      ) : (
        <p className="text-sm text-muted">softmax の段階まで進むと、6つの設定へのデモ出力をグラフにします。これは学習済みの推定ではありません。</p>
      )}
    </div>
  );
}
