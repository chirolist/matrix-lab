"use client";

import { useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip, XAxis, YAxis } from "recharts";
import { ChartFrame, tooltipStyle } from "@/components/ChartFrame";
import { formatPercent } from "@/lib/format";
import { COMPARISON_GAMES, createRng, finalizeMonteCarlo, simulateOne, type MonteCarloReport, type TrialRecord } from "@/lib/monte-carlo";
import { validateSimulationInput } from "@/lib/validation";
import type { MachineProfile } from "@/types";

interface ComparisonRow {
  games: number;
  correctRate: number;
  rates: number[];
}

export function MonteCarloSimulator({ machine }: { machine: MachineProfile }) {
  const [setting, setSetting] = useState(String(machine.settings[machine.settings.length - 1]?.setting ?? 1));
  const [games, setGames] = useState("6000");
  const [trials, setTrials] = useState("300");
  const [errors, setErrors] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [report, setReport] = useState<MonteCarloReport | null>(null);
  const [comparison, setComparison] = useState<ComparisonRow[] | null>(null);
  const [seedUsed, setSeedUsed] = useState<number | null>(null);
  const runId = useRef(0);

  async function collect(assumed: number, gamesValue: number, trialCount: number, rng: () => number, label: string, id: number) {
    const records: TrialRecord[] = [];
    const batch = 20;
    for (let done = 0; done < trialCount; done += batch) {
      if (runId.current !== id) return null;
      const count = Math.min(batch, trialCount - done);
      for (let index = 0; index < count; index += 1) {
        records.push(simulateOne(machine, assumed, gamesValue, rng));
      }
      setProgress(`${label}: ${Math.min(trialCount, done + count).toLocaleString("ja-JP")} / ${trialCount.toLocaleString("ja-JP")}`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    return records;
  }

  async function run(kind: "single" | "compare") {
    const parsed = validateSimulationInput({ games, trials });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }
    const assumed = Number(setting);
    setErrors([]);
    setRunning(true);
    const id = runId.current + 1;
    runId.current = id;
    const seed = (Date.now() ^ (assumed * 1009)) >>> 0;
    setSeedUsed(seed);
    const rng = createRng(seed);
    if (kind === "single") {
      setComparison(null);
      const records = await collect(assumed, parsed.games, parsed.trials, rng, `${parsed.games.toLocaleString("ja-JP")}回転`, id);
      if (records && runId.current === id) setReport(finalizeMonteCarlo(machine, assumed, parsed.games, records));
    } else {
      const rows: ComparisonRow[] = [];
      let focusRecords: TrialRecord[] | null = null;
      let focusGames = 6000;
      const preferredGames = (COMPARISON_GAMES as readonly number[]).includes(parsed.games) ? parsed.games : 6000;
      for (const gamesValue of COMPARISON_GAMES) {
        const records = await collect(assumed, gamesValue, parsed.trials, rng, `${gamesValue.toLocaleString("ja-JP")}回転`, id);
        if (!records || runId.current !== id) {
          setRunning(false);
          return;
        }
        const summary = finalizeMonteCarlo(machine, assumed, gamesValue, records);
        rows.push({ games: gamesValue, correctRate: summary.correctRate, rates: summary.ratesByCategory });
        if (gamesValue === preferredGames) {
          focusRecords = records;
          focusGames = gamesValue;
        }
      }
      setComparison(rows);
      if (focusRecords) setReport(finalizeMonteCarlo(machine, assumed, focusGames, focusRecords));
    }
    if (runId.current === id) {
      setRunning(false);
      setProgress("");
    }
  }

  const classData = report
    ? machine.settings.map((item, index) => ({
        name: `設定${item.setting}`,
        rate: Number((report.ratesByCategory[index] * 100).toFixed(1)),
        assumed: item.setting === report.assumedSetting,
      }))
    : [];

  return (
    <div className="space-y-5">
      <p className="text-sm leading-6 text-muted">
        仮定した設定のBIG・REG確率で仮想の実績を多数作り、同じ推定式にかけます。何回転あれば設定を見分けやすいかを、確率モデルの中で確かめる実験です。実機の判別精度は保証しません。
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="text-sm" htmlFor="assumed-setting">
          仮定する設定
          <select id="assumed-setting" value={setting} onChange={(event) => setSetting(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-lab px-3 py-3">
            {machine.settings.map((item) => (
              <option key={item.setting} value={item.setting}>
                設定{item.setting}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm" htmlFor="sim-games">
          総回転数
          <input id="sim-games" value={games} inputMode="numeric" maxLength={6} onChange={(event) => setGames(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-lab px-3 py-3 font-mono" />
        </label>
        <label className="text-sm" htmlFor="sim-trials">
          シミュレーション回数
          <input id="sim-trials" value={trials} inputMode="numeric" maxLength={4} onChange={(event) => setTrials(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-lab px-3 py-3 font-mono" />
        </label>
      </div>
      {errors.length > 0 ? (
        <ul className="rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-sm text-accent" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={running} onClick={() => void run("single")} className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-lab disabled:opacity-40">
          この回転数で実行
        </button>
        <button type="button" disabled={running} onClick={() => void run("compare")} className="rounded-full border border-line px-5 py-2.5 text-sm disabled:opacity-40">
          1000・3000・6000・10000回転を比較
        </button>
      </div>
      {running ? <p className="text-sm text-accent-2">{progress || "シミュレーションを実行しています。"}</p> : null}
      {seedUsed !== null ? <p className="text-xs text-muted">乱数種 {seedUsed}。同じ種でも、比較実行は単体実行より多く乱数を使うため結果の並びは一致しません。</p> : null}
      {report ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-lab px-4 py-4">
            <p className="text-xs text-muted">仮定した設定{report.assumedSetting} / {report.games.toLocaleString("ja-JP")}回転 / {report.trials.toLocaleString("ja-JP")}回</p>
            <p className="mt-1 text-2xl text-ink">正しく最有力になった割合 {formatPercent(report.correctRate)}</p>
            <p className="mt-2 text-xs leading-5 text-muted">
              最有力の設定が仮定と一致した割合です。推定確率が接戦でも、一番高い設定だけで数えています。真の設定に付いた推定確率の平均は {formatPercent(report.meanTruePosterior)} です。
            </p>
          </div>
          <div>
            <h3 className="mb-2 text-sm">どの設定に分類されたか</h3>
            <ChartFrame>
              <BarChart data={classData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" width={48} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString("ja-JP")}%`, "分類された割合"]} />
                <Bar dataKey="rate" radius={[8, 8, 0, 0]}>
                  {classData.map((item) => (
                    <Cell key={item.name} fill={item.assumed ? "#3ee0a2" : "#ff8a3d"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
            <p className="text-xs text-muted">緑が仮定した設定、オレンジがそれ以外への分類です。</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm">真の設定に付いた推定確率の分布</h3>
            <ChartFrame>
              <BarChart data={report.truePosteriorHistogram} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#93a0bd", fontSize: 11 }} axisLine={false} tickLine={false} interval={0} />
                <YAxis tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${Number(value).toLocaleString("ja-JP")}回`, "件数"]} />
                <Bar dataKey="count" name="件数" fill="#4cc3ff" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">まだ実行していません。回数の上限は2,000です。画面が固まらないよう、少しずつ計算します。</p>
      )}
      {comparison ? (
        <div>
          <h3 className="mb-2 text-sm">総回転数による推定精度</h3>
          <ChartFrame>
            <BarChart
              data={comparison.map((row) => ({
                name: `${row.games.toLocaleString("ja-JP")}回転`,
                正答率: Number((row.correctRate * 100).toFixed(1)),
              }))}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="#2c3c5c" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: "#93a0bd", fontSize: 12 }} axisLine={false} tickLine={false} unit="%" width={48} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: "#93a0bd", fontSize: 12 }} />
              <Bar dataKey="正答率" fill="#3ee0a2" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartFrame>
          <p className="text-xs leading-5 text-muted">
            回転数が増えると、偶然のばらつきより設定ごとの確率の差が目立ちやすくなります。それでも隣り合う設定は似ているため、100%にはなりにくいです。
          </p>
        </div>
      ) : null}
    </div>
  );
}
