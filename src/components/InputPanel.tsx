"use client";

import { formatDenominator, formatFeatureValue, formatObservedOdds } from "@/lib/format";
import type { BonusObservation, MachineProfile } from "@/types";
import { Play } from "lucide-react";

interface InputPanelProps {
  machine: MachineProfile;
  machines: MachineProfile[];
  games: string;
  big: string;
  reg: string;
  errors: string[];
  observation: BonusObservation | null;
  skipAnimation: boolean;
  skipLocked: boolean;
  playing: boolean;
  onMachine: (id: string) => void;
  onGames: (value: string) => void;
  onBig: (value: string) => void;
  onReg: (value: string) => void;
  onSkipAnimation: (value: boolean) => void;
  onAnalyze: () => void;
}

function Field({
  id,
  label,
  hint,
  value,
  invalid,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: string;
  invalid: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="text-sm text-ink">{label}</span>
      <span className="mt-0.5 block text-xs text-muted">{hint}</span>
      <input
        id={id}
        value={value}
        inputMode="numeric"
        autoComplete="off"
        maxLength={7}
        aria-invalid={invalid}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-line bg-lab px-3 py-3 font-mono text-lg text-ink outline-none"
      />
    </label>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-line bg-lab px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm text-ink">{value}</p>
      {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
    </div>
  );
}

export function InputPanel({
  machine,
  machines,
  games,
  big,
  reg,
  errors,
  observation,
  skipAnimation,
  skipLocked,
  playing,
  onMachine,
  onGames,
  onBig,
  onReg,
  onSkipAnimation,
  onAnalyze,
}: InputPanelProps) {
  const invalid = errors.length > 0;
  return (
    <div className="space-y-5">
      <label className="block text-sm" htmlFor="dataset">
        データセット
        <select
          id="dataset"
          value={machine.id}
          onChange={(event) => onMachine(event.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-lab px-3 py-3 text-ink"
        >
          {machines.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <p className="text-xs leading-5 text-muted">{machine.sourceNote}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="games" label="総回転数 G" hint="1以上の整数" value={games} invalid={invalid} onChange={onGames} />
        <Field id="big" label="BIG回数 B" hint="0以上の整数" value={big} invalid={invalid} onChange={onBig} />
        <Field id="reg" label="REG回数 R" hint="0以上の整数" value={reg} invalid={invalid} onChange={onReg} />
      </div>
      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-sm text-accent" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="BIG確率" value={observation ? formatObservedOdds(observation.big, observation.games) : "—"} note="観測回数 ÷ 総回転数" />
        <Stat label="REG確率" value={observation ? formatObservedOdds(observation.reg, observation.games) : "—"} />
        <Stat
          label="合成ボーナス確率"
          value={observation ? formatObservedOdds(observation.big + observation.reg, observation.games) : "—"}
          note="表示用。推定ではBIGとREGを別々に使います"
        />
        <Stat
          label="BIGの観測頻度"
          value={observation ? formatFeatureValue(observation.big / observation.games, "percent") : "—"}
          note={observation ? `小数 ${formatFeatureValue(observation.big / observation.games, "decimal")}` : undefined}
        />
        <Stat
          label="REGの観測頻度"
          value={observation ? formatFeatureValue(observation.reg / observation.games, "percent") : "—"}
          note={observation ? `小数 ${formatFeatureValue(observation.reg / observation.games, "decimal")}` : undefined}
        />
        <Stat label="合成ボーナス回数" value={observation ? `${observation.big + observation.reg}回` : "—"} note="B + R" />
      </div>
      <p className="text-xs text-muted">
        掲載されている設定の合成確率の例: 設定1は {formatDenominator(machine.settings[0]?.combinedDenominator ?? 0)}。この値は検証用で、分類の計算には足しません。
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onAnalyze}
          disabled={!observation || playing}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-lab disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Play className="size-4" aria-hidden="true" />
          {playing ? "解析の流れを表示中" : "解析する"}
        </button>
        <label className="inline-flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={skipAnimation}
            disabled={skipLocked}
            onChange={(event) => onSkipAnimation(event.target.checked)}
            className="size-4 accent-accent-2"
          />
          アニメーションをスキップ
          {skipLocked ? "（端末の設定で動きを減らす指定があるため固定）" : ""}
        </label>
      </div>
      <p className="text-xs leading-5 text-muted">
        数値を変えると、ベクトルと推定はすぐに計算し直します。「解析する」は、入力がベクトル、特徴量、行列、尤度、グラフ、最有力候補へ進む様子を順に示します。
      </p>
      </div>
  );
}
