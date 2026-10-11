import { classificationModels, machineToDataset } from "@/lib/dataset";
import { formatCoeff, formatFixed, formatOneOver, formatPercent } from "@/lib/format";
import { logLikelihood } from "@/lib/likelihood";
import type { BonusObservation, InferenceResult, MachineProfile, SettingEstimate } from "@/types";

const GLOSSARY = [
  { term: "ベクトル", description: "複数の数値を順番つきで並べたものです。このアプリの入力ベクトルは、総回転数・BIG回数・REG回数の3つです。" },
  { term: "行列", description: "数値を縦横の表にしたものです。行が設定、列がBIG確率とREG確率、という並べ方をしています。" },
  { term: "特徴量", description: "分類に使うために加工した数値です。回数を回転数で割った頻度は、設定の確率と直接比べられます。" },
  { term: "重み", description: "入力された数値をどの程度重視するかを表す係数です。ニューラルネットのデモで、行列の中身として出てきます。" },
  { term: "活性化関数", description: "ニューラルネットワークで、足し算の結果を変換する関数です。ReLU は負の数を0にし、正の数はそのまま通します。" },
  { term: "尤度", description: "ある設定を仮定したとき、今回の観測データがどの程度起こりやすいかを表す値です。大きいほど、その設定とデータがよく合います。" },
  { term: "事後確率", description: "観測データを踏まえた、各設定の推定確率です。最初は設定1〜6を同じ確からしさとみなし、尤度に応じて分配します。" },
  { term: "softmax", description: "6つのスコアを、合計が100%になる割合へ変換する関数です。デモの出力表示に使います。" },
];

function TermList() {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {GLOSSARY.map((item) => (
        <div key={item.term} className="rounded-xl border border-line bg-lab px-3 py-3">
          <dt className="text-sm text-accent-2">{item.term}</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkedLikelihood({ observation, estimate }: { observation: BonusObservation; estimate: SettingEstimate }) {
  const other = observation.games - observation.big - observation.reg;
  return (
    <div className="space-y-2 rounded-xl border border-line bg-lab px-4 py-4 text-sm leading-7">
      <p>
        いま最も推定確率が高い設定{estimate.setting}を例にします。1ゲームでBIGになる確率は {formatOneOver(estimate.bigProbability)}、REGは {formatOneOver(estimate.regProbability)}、どちらでもない確率は {formatCoeff(estimate.noneProbability)} です。
      </p>
      <p>
        期待回数は、総回転数にその確率を掛けます。BIGは {observation.games.toLocaleString("ja-JP")} × {formatCoeff(estimate.bigProbability)} = {formatFixed(estimate.expectedBig)} 回。実績は {observation.big} 回なので、差は {formatFixed(estimate.bigDiff)} 回です。
      </p>
      <p className="font-mono text-xs leading-6 text-accent-2 sm:text-sm">
        log L = logΓ({observation.games + 1}) − logΓ({observation.big + 1}) − logΓ({observation.reg + 1}) − logΓ({other + 1})
        <br />
        + {observation.big}×log(pB) + {observation.reg}×log(pR) + {other}×log(pN)
      </p>
      <p>
        組み合わせの項は {formatFixed(estimate.logCoefficient)}、BIGの項は {formatFixed(estimate.logBigTerm)}、REGの項は {formatFixed(estimate.logRegTerm)}、それ以外の項は {formatFixed(estimate.logNoneTerm)} です。合計した対数尤度は {formatFixed(estimate.logLikelihood)} です。
      </p>
      <p className="text-xs text-muted">
        回数が0の項は、0に何を掛けても0なので、対数を計算せず0として扱います。階乗をそのまま掛けると数値が桁あふれするため、対数にしてから足しています。
      </p>
    </div>
  );
}

export function ExplanationPanel({
  machine,
  observation,
  inference,
}: {
  machine: MachineProfile;
  observation: BonusObservation | null;
  inference: InferenceResult | null;
}) {
  const dataset = machineToDataset(machine);
  const demoLikelihood = Math.exp(logLikelihood(10, 2, 1, 0.2, 0.1));
  return (
    <div className="space-y-6 text-sm leading-7">
      <p>
        {machine.name}の設定推定は、汎用の分類の型に当てはめた最初の例です。データセット「{dataset.name}」には特徴量が {dataset.features.length} 個、分類先が {dataset.categories.length} 個あります。
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {dataset.features.map((feature) => (
          <li key={feature.id} className="rounded-xl border border-line px-3 py-2 text-xs leading-5 text-muted">
            <span className="block text-sm text-ink">{feature.name}</span>
            {feature.description}
            <span className="mt-1 block text-accent-2">{feature.usedInClassification ? "分類に使用" : "分類には不使用"}</span>
          </li>
        ))}
      </ul>
      {observation && inference ? <WorkedLikelihood observation={observation} estimate={inference.top} /> : <p className="text-muted">有効な入力があると、その数値を使った計算例を表示します。</p>}
      <div className="rounded-xl border border-line bg-lab px-4 py-4">
        <h3 className="text-base text-ink">小さい数での手計算</h3>
        <p className="mt-2">
          総回転数10、BIG 2回、REG 1回で、BIG確率0.2、REG確率0.1、それ以外0.7だとします。組み合わせの数は 10! / (2! × 1! × 7!) = 360 です。尤度は 360 × 0.2² × 0.1 × 0.7⁷ = {formatFixed(demoLikelihood, 4)} です。対数尤度は、この値の自然対数です。アプリ本体も同じ式を、大きな回転数でも桁あふれしない形で計算しています。
        </p>
      </div>
      <div>
        <h3 className="text-base text-ink">行列の積と、設定推定の違い</h3>
        <p className="mt-2">
          行列の積は、行ごとの重み付き和を一度に計算する操作です。設定の特徴量を並べた行列 W は「各設定の確率表」です。W に何かを掛けると別の数は出ますが、その数が推定確率になるわけではありません。推定確率は、各設定を仮定した尤度を比べ、合計が100%になるように分配した事後確率です。いまの事前確率は設定1〜6ですべて同じです。
        </p>
      </div>
      <div>
        <h3 className="text-base text-ink">使っている分類手法</h3>
        <ul className="mt-2 space-y-2">
          {classificationModels.map((model) => (
            <li key={model.id} className="rounded-xl border border-line px-3 py-2 text-xs leading-5 text-muted">
              <span className="text-sm text-ink">{model.name}</span>
              <span className="mt-1 block">{model.description}</span>
            </li>
          ))}
        </ul>
      </div>
      <TermList />
      <p className="text-xs leading-5 text-muted">
        推定確率が近い設定は、一方に決め打ちしません。表示上の合計が {inference ? formatPercent(inference.posteriorSum, 2) : "100%"} 付近になるのは、全設定へ分配しているためです。別の機種や別分野にするときは、データセットのカテゴリと特徴量を差し替え、回数の確率モデルと数値特徴のニューラルネットを用途に応じて切り替えます。
      </p>
    </div>
  );
}
