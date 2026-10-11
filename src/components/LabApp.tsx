"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { ExpectedValuesChart } from "@/components/ExpectedValuesChart";
import { FeatureVector } from "@/components/FeatureVector";
import { InputPanel } from "@/components/InputPanel";
import { MatrixMultiplicationDemo } from "@/components/MatrixMultiplicationDemo";
import { MatrixViewer } from "@/components/MatrixViewer";
import { MonteCarloSimulator } from "@/components/MonteCarloSimulator";
import { NeuralNetworkDemo } from "@/components/NeuralNetworkDemo";
import { ProbabilityChart } from "@/components/ProbabilityChart";
import { ResultHero, ScoreTable } from "@/components/EstimatePanel";
import { SectionCard } from "@/components/SectionCard";
import { SettingsTable } from "@/components/SettingsTable";
import { TheoryProbabilityChart } from "@/components/TheoryProbabilityChart";
import { defaultMachineId, getMachine, machines } from "@/data/jugler-settings";
import { toFeatureVector } from "@/lib/features";
import { formatPercent } from "@/lib/format";
import { inferBonusSettings } from "@/lib/inference";
import { validateObservation } from "@/lib/validation";
import { BookOpen, ChartColumn, Dices, Grid3x3, Sigma, Sparkles, TableProperties } from "lucide-react";

const ANALYSIS_STEPS = ["vector", "features", "matrix", "likelihood", "chart", "result"] as const;
type AnalysisStep = (typeof ANALYSIS_STEPS)[number] | "done";

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

const STEP_LABELS = ["ベクトル化", "特徴量", "行列", "尤度", "グラフ", "推定"];

export function LabApp() {
  const [machineId, setMachineId] = useState(defaultMachineId);
  const [games, setGames] = useState("6000");
  const [big, setBig] = useState("20");
  const [reg, setReg] = useState("15");
  const [mode, setMode] = useState<"decimal" | "percent">("decimal");
  const [skipAnimation, setSkipAnimation] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const animationOff = skipAnimation || reduceMotion;
  const [step, setStep] = useState<AnalysisStep>("done");
  const [matrixCursor, setMatrixCursor] = useState(-1);

  const machine = getMachine(machineId);
  const validation = useMemo(() => validateObservation({ games, big, reg }), [games, big, reg]);
  const observation = validation.ok ? validation.value : null;
  const features = useMemo(() => (observation ? toFeatureVector(observation) : null), [observation]);
  const inference = useMemo(() => (observation ? inferBonusSettings(observation, machine) : null), [observation, machine]);

  useEffect(() => {
    if (step === "done" || animationOff) return;
    const cellCount = machine.settings.length * 2;
    if (step === "matrix") {
      const wait = matrixCursor < cellCount - 1 ? 110 : 420;
      const timer = window.setTimeout(() => {
        if (matrixCursor < cellCount - 1) setMatrixCursor((value) => value + 1);
        else {
          setMatrixCursor(-1);
          setStep("likelihood");
        }
      }, wait);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      const index = ANALYSIS_STEPS.indexOf(step);
      const next = ANALYSIS_STEPS[index + 1];
      if (!next) {
        setStep("done");
        return;
      }
      if (next === "matrix") setMatrixCursor(0);
      setStep(next);
    }, 760);
    return () => window.clearTimeout(timer);
  }, [step, matrixCursor, animationOff, machine.settings.length]);

  useEffect(() => {
    if (step === "done") return;
    document.getElementById(step)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [step]);

  function reached(target: AnalysisStep): boolean {
    if (step === "done") return true;
    const order: AnalysisStep[] = [...ANALYSIS_STEPS, "done"];
    return order.indexOf(step) >= order.indexOf(target);
  }

  function finishNow() {
    setStep("done");
    setMatrixCursor(-1);
  }

  function analyze() {
    if (!validation.ok) return;
    if (animationOff) {
      finishNow();
      return;
    }
    setMatrixCursor(-1);
    setStep("vector");
  }

  function changeSkip(value: boolean) {
    setSkipAnimation(value);
    if (value) finishNow();
  }

  const playing = step !== "done";

  return (
    <div className="min-h-full">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-accent focus:px-4 focus:py-2 focus:text-lab">
        本文へ移動
      </a>
      <header className="border-b border-line/80 bg-lab/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-accent-2">MATRIX LAB</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Matrix Lab</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              観測した数をベクトルにし、行列と確率の計算をたどって、どのカテゴリに近いかを見る実験室です。最初の題材はパチスロ「ジャグラー」のボーナス実績で、設定1〜6の推定確率を計算します。
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="解析の段階">
            {STEP_LABELS.map((label, index) => {
              const id = ANALYSIS_STEPS[index];
              const current = step === id;
              const complete = reached(id) && !current;
              return (
                <span key={label} className={`rounded-full px-3 py-1 text-xs ${current ? "bg-accent text-lab" : complete ? "bg-panel-2 text-accent-2" : "border border-line text-muted"}`}>
                  {index + 1}. {label}
                </span>
              );
            })}
          </div>
          <p className="text-sm text-ink" aria-live="polite">
            {playing
              ? "入力から推定までの流れを表示しています。"
              : inference
                ? `現在の最有力は設定${inference.top.setting}（${formatPercent(inference.top.posterior)}）${inference.ambiguous ? "。上位は接戦です。" : "。"}`
                : "入力を確認すると推定を表示します。"}
          </p>
        </div>
      </header>
      <main id="main" className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6">
        <SectionCard id="input" kicker="01  SAMPLE" title="サンプルデータ入力" description="総回転数、BIG回数、REG回数から、観測された確率と頻度を作ります。" icon={<TableProperties className="size-5" aria-hidden="true" />}>
          <InputPanel
            machine={machine}
            machines={machines}
            games={games}
            big={big}
            reg={reg}
            errors={validation.ok ? [] : validation.errors}
            observation={observation}
            skipAnimation={animationOff}
            skipLocked={reduceMotion}
            playing={playing}
            onMachine={setMachineId}
            onGames={setGames}
            onBig={setBig}
            onReg={setReg}
            onSkipAnimation={changeSkip}
            onAnalyze={analyze}
          />
        </SectionCard>

        <SectionCard kicker="02  VECTOR" title="入力値のベクトル化と特徴量" description="観測データを縦に並べ、分類しやすい頻度へ変換します。" icon={<Sigma className="size-5" aria-hidden="true" />} active={step === "vector" || step === "features"} dimmed={!reached("vector")}>
          <FeatureVector observation={observation} features={features} mode={mode} onMode={setMode} vectorActive={step === "vector"} featureActive={step === "features"} />
        </SectionCard>

        <SectionCard kicker="03  THEORY" title="設定別の理論値" description="設定表の確率と、入力した総回転数から計算した期待回数です。" icon={<TableProperties className="size-5" aria-hidden="true" />}>
          <SettingsTable machine={machine} inference={inference} />
        </SectionCard>

        <SectionCard id="matrix" kicker="04  MATRIX" title="特徴量行列" description="設定ごとのBIG確率とREG確率を、6行2列の行列として見ます。" icon={<Grid3x3 className="size-5" aria-hidden="true" />} active={step === "matrix"} dimmed={!reached("matrix")}>
          <MatrixViewer machine={machine} highlightIndex={step === "matrix" ? matrixCursor : -1} />
        </SectionCard>

        <SectionCard id="likelihood" kicker="05  SCORE" title="設定別の確率・スコア" description="多項分布の対数尤度から、設定ごとの推定確率を出します。" icon={<Sparkles className="size-5" aria-hidden="true" />} active={step === "likelihood"} dimmed={!reached("likelihood")}>
          <ScoreTable inference={reached("likelihood") ? inference : null} />
        </SectionCard>

        <SectionCard id="chart" kicker="06  CHART" title="グラフ" description="推定確率、実績と期待回数、設定ごとの理論確率です。" icon={<ChartColumn className="size-5" aria-hidden="true" />} active={step === "chart"} dimmed={!reached("chart")}>
          {!observation ? (
            <p className="text-sm text-muted">入力が有効になると、グラフを表示します。</p>
          ) : reached("chart") && inference ? (
            <div className="space-y-8">
              <div>
                <h3 className="mb-2 text-sm">設定別の推定確率</h3>
                <ProbabilityChart inference={inference} />
                <p className="text-xs text-muted">オレンジが最有力候補です。縦軸は0%から100%です。</p>
              </div>
              <div>
                <h3 className="mb-2 text-sm">BIG・REGの実績と期待回数</h3>
                <ExpectedValuesChart observation={observation} inference={inference} />
              </div>
              <div>
                <h3 className="mb-2 text-sm">設定別の理論確率</h3>
                <TheoryProbabilityChart machine={machine} />
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted">尤度を計算したあと、グラフを表示します。</p>
          )}
        </SectionCard>

        <SectionCard id="result" kicker="07  RESULT" title="推定結果" description="推定確率が最も高い設定を、接戦かどうかと一緒に示します。" icon={<Sparkles className="size-5" aria-hidden="true" />} active={step === "result"} dimmed={!reached("result")}>
          <ResultHero inference={reached("result") ? inference : null} emphasized={step === "result" || step === "done"} />
        </SectionCard>

        <SectionCard kicker="08  TRACE" title="計算過程の解説" description="今回の数値で、式が何を比べているのかを追います。" icon={<BookOpen className="size-5" aria-hidden="true" />}>
          <ExplanationPanel machine={machine} observation={observation} inference={inference} />
        </SectionCard>

        <SectionCard kicker="09  PRODUCT" title="行列とベクトルの積" description="y = A x の途中計算です。設定推定の本体とは分けてあります。" icon={<Grid3x3 className="size-5" aria-hidden="true" />}>
          <MatrixMultiplicationDemo machine={machine} />
        </SectionCard>

        <SectionCard kicker="10  NETWORK" title="ディープラーニング風の変換デモ" description="重み、バイアス、活性化関数、softmax の役割を、未学習の初期値で見ます。" icon={<Sparkles className="size-5" aria-hidden="true" />}>
          <NeuralNetworkDemo features={features} />
        </SectionCard>

        <SectionCard kicker="11  SIMULATION" title="モンテカルロシミュレーション" description="仮想データを同じ推定式に通し、回転数と誤分類の関係を見ます。" icon={<Dices className="size-5" aria-hidden="true" />}>
          <MonteCarloSimulator machine={machine} />
        </SectionCard>

        <footer className="pb-8 text-xs leading-5 text-muted">
          計算結果は、採用した設定表と確率モデルの上での推定です。遊技機の設定を断定するものではなく、実機の挙動や抽選を再現してもいません。設定値はデータファイルで更新できます。
        </footer>
      </main>
    </div>
  );
}
