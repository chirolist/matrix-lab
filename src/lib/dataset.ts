import type { Dataset, MachineProfile, ModelInfo } from "@/types";

export function machineToDataset(machine: MachineProfile): Dataset {
  return {
    id: machine.id,
    name: machine.name,
    description: machine.description,
    features: [
      {
        id: "big-rate",
        name: "BIG頻度",
        description: "BIG回数を総回転数で割った値です。",
        usedInClassification: true,
      },
      {
        id: "reg-rate",
        name: "REG頻度",
        description: "REG回数を総回転数で割った値です。",
        usedInClassification: true,
      },
      {
        id: "combined-rate",
        name: "合成ボーナス頻度",
        description: "BIG頻度とREG頻度の合計です。独立した情報ではないため、分類の入力には使いません。",
        usedInClassification: false,
      },
    ],
    categories: machine.settings.map((setting, index) => ({
      id: `${machine.id}-setting-${setting.setting}`,
      name: `設定${setting.setting}`,
      index,
    })),
  };
}

export const classificationModels: ModelInfo[] = [
  {
    id: "multinomial-bonus",
    name: "多項分布による確率モデル",
    kind: "multinomial-bonus",
    trained: false,
    description:
      "各設定のBIG・REG・ボーナスなしの確率から、観測された回数の起こりやすさを計算します。重みを学習するモデルではありません。",
  },
  {
    id: "neural-demo",
    name: "ニューラルネットワーク風の変換デモ",
    kind: "neural-network",
    trained: false,
    description:
      "特徴量、重み行列、バイアス、活性化関数、softmax の流れを見るための初期値です。設定推定には使いません。",
  },
];
