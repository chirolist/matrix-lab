import type { MachineProfile, MachineSetting } from "@/types";

/**
 * 現行6号機ジャグラーの設定別確率。
 * 推定に使うのは BIG確率と REG確率だけ。合成確率と機械割は表示・検証用。
 * 出典の図表: https://juggrap.jp/juggler-chart/
 * マイジャグラーVの単独ボーナス・チェリー重複・子役・レア役は、この推定式では使わない。
 */

const SOURCE_URL = "https://juggrap.jp/juggler-chart/";

const sourceNote = `BIG・REG・合算・機械割は ${SOURCE_URL} の確率表から読み取った値です。合成確率と機械割は表示と照合用で、推定には使いません。公式の公表値と違う場合は公式を優先してください。`;

function settings(rows: readonly (readonly [number, number, number, number])[]): MachineSetting[] {
  return rows.map(([bigDenominator, regDenominator, combinedDenominator, payoutPercent], index) => ({
    setting: index + 1,
    bigDenominator,
    regDenominator,
    combinedDenominator,
    payoutRate: Math.round(payoutPercent * 10) / 1000,
  }));
}

function machine(
  id: string,
  name: string,
  description: string,
  rows: readonly (readonly [number, number, number, number])[],
  note = sourceNote,
): MachineProfile {
  return { id, name, description, sourceNote: note, settings: settings(rows) };
}

export const imJugglerEx = machine(
  "im-juggler-ex",
  "アイムジャグラーEX / ネオアイムジャグラーEX",
  "このページではアイムジャグラーEXとネオアイムジャグラーEXが同じ確率表です。表題はネオアイムジャグラーEXです。",
  [
    [273.1, 439.8, 168.5, 97.0],
    [269.7, 399.6, 161.0, 98.0],
    [269.7, 331.0, 148.6, 99.5],
    [259.0, 315.1, 142.2, 101.1],
    [259.0, 255.0, 128.5, 103.3],
    [255.0, 255.0, 127.5, 105.5],
  ],
);

export const funkyJuggler2 = machine(
  "funky-juggler-2",
  "ファンキージャグラー2",
  "ファンキージャグラー2の設定1〜6です。BIGとREGの出やすさが、設定ごとにどちらも動きます。",
  [
    [266.4, 439.8, 165.9, 97.0],
    [259.0, 407.1, 158.3, 98.5],
    [256.0, 366.1, 150.7, 99.8],
    [249.2, 322.8, 140.6, 102.0],
    [240.1, 299.3, 133.2, 104.3],
    [219.9, 262.1, 119.6, 109.0],
  ],
);

export const myJuggler5 = machine(
  "my-juggler-5",
  "マイジャグラーV",
  "マイジャグラーVの設定別BIG・REG確率です。同じページにある単独ボーナス、チェリー重複、子役、レア役は、この推定では使いません。",
  [
    [273.1, 409.6, 163.8, 97.0],
    [270.8, 385.5, 159.1, 98.0],
    [266.4, 336.1, 148.6, 99.9],
    [254.0, 290.0, 135.4, 102.8],
    [240.1, 268.6, 126.8, 105.3],
    [229.1, 229.1, 114.6, 109.4],
  ],
  `${sourceNote} 単独ボーナス、チェリー重複、子役、レア役の表は同じページにありますが、分類の入力には入れていません。`,
);

export const happyJuggler8 = machine(
  "happy-juggler-8",
  "ハッピージャグラーⅧ",
  "ハッピージャグラーⅧの設定1〜6です。",
  [
    [273.1, 397.2, 161.8, 97.0],
    [270.8, 362.1, 154.9, 98.1],
    [263.2, 332.7, 146.9, 99.9],
    [254.0, 300.6, 137.7, 102.9],
    [239.2, 273.1, 127.5, 105.8],
    [226.0, 256.0, 120.0, 108.4],
  ],
);

export const gogoJuggler3 = machine(
  "gogo-juggler-3",
  "ゴーゴージャグラー3",
  "ゴーゴージャグラー3の設定1〜6です。掲載の合算は、BIGとREGから計算した合算と小数第1位でずれる行があります。",
  [
    [259.0, 354.2, 149.6, 97.2],
    [258.0, 332.7, 145.8, 98.2],
    [257.0, 306.2, 139.7, 99.4],
    [254.0, 268.6, 130.5, 101.6],
    [247.3, 247.3, 123.7, 103.8],
    [234.9, 234.9, 117.4, 106.5],
  ],
);

export const jugglerGirlsSs = machine(
  "juggler-girls-ss",
  "ジャグラーガールズSS",
  "ジャグラーガールズSSの設定1〜6です。",
  [
    [273.1, 381.0, 159.1, 97.0],
    [270.8, 350.5, 152.8, 97.9],
    [260.1, 316.6, 142.8, 99.9],
    [250.1, 281.3, 132.4, 102.1],
    [243.6, 270.8, 128.3, 104.0],
    [226.0, 252.1, 119.2, 107.5],
  ],
);

export const misterJuggler = machine(
  "mister-juggler",
  "ミスタージャグラー",
  "ミスタージャグラーの設定1〜6です。",
  [
    [268.6, 374.5, 156.4, 97.0],
    [267.5, 354.2, 152.4, 98.0],
    [260.1, 331.0, 145.6, 99.8],
    [249.2, 291.3, 134.3, 102.7],
    [240.9, 257.0, 124.4, 105.5],
    [237.4, 237.4, 118.7, 107.3],
  ],
);

export const ultraMiracleJuggler = machine(
  "ultra-miracle-juggler",
  "ウルトラミラクルジャグラー",
  "ウルトラミラクルジャグラーの設定1〜6です。",
  [
    [267.5, 425.6, 164.3, 97.0],
    [261.1, 402.1, 158.3, 98.1],
    [256.0, 350.5, 147.9, 99.8],
    [242.7, 322.8, 138.6, 102.1],
    [233.2, 297.9, 130.8, 104.5],
    [216.3, 277.7, 121.6, 108.1],
  ],
);

/** 既存テストが参照する既定機種。アイム / ネオアイムの確率表。 */
export const juglerMachine = imJugglerEx;

export const machines: MachineProfile[] = [
  imJugglerEx,
  funkyJuggler2,
  myJuggler5,
  happyJuggler8,
  gogoJuggler3,
  jugglerGirlsSs,
  misterJuggler,
  ultraMiracleJuggler,
];

export const defaultMachineId = imJugglerEx.id;

export function getMachine(id: string): MachineProfile {
  const found = machines.find((item) => item.id === id);
  if (!found) {
    throw new Error(`データセット「${id}」が見つかりません。`);
  }
  return found;
}
