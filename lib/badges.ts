/**
 * 実績バッジ。
 *
 * 手数の多い手法を最後まで続けるための小さな報酬。
 * 以前は「actions が発行する ID」「プロフィール画面が表示する ID」
 * 「lib/badges.ts の定義」が三者三様で、実際には何も解除されなかった。
 * ここを唯一の定義とし、旧 ID も同じバッジに寄せる。
 */

export type BadgeType = "CANDIDATE" | "SUBPROBLEM" | "DESIRE" | "CHOICE" | "SOLUTION";

export interface Badge {
  id: string; // 例: CANDIDATE_3
  type: BadgeType;
  level: number;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const BADGE_LEVELS = [1, 3, 5, 10, 15, 20];

const CONFIG: Record<
  BadgeType,
  { labelBase: string; icon: string; noun: string; verb: string; color: string }
> = {
  CANDIDATE: {
    labelBase: "課題ハンター",
    icon: "🌱",
    noun: "課題候補",
    verb: "発見",
    color: "bg-orange-50 text-orange-700 border-orange-300",
  },
  SUBPROBLEM: {
    labelBase: "分解職人",
    icon: "🧩",
    noun: "サブ課題",
    verb: "分解",
    color: "bg-amber-50 text-amber-700 border-amber-300",
  },
  DESIRE: {
    labelBase: "共感リサーチャー",
    icon: "💛",
    noun: "望み",
    verb: "言語化",
    color: "bg-rose-50 text-rose-700 border-rose-300",
  },
  CHOICE: {
    labelBase: "事例コレクター",
    icon: "🔍",
    noun: "先行事例",
    verb: "収集",
    color: "bg-blue-50 text-blue-700 border-blue-300",
  },
  SOLUTION: {
    labelBase: "解決策クリエイター",
    icon: "🚀",
    noun: "解決策",
    verb: "提案",
    color: "bg-emerald-50 text-emerald-700 border-emerald-300",
  },
};

export const BADGES: Badge[] = (Object.keys(CONFIG) as BadgeType[]).flatMap((type) => {
  const conf = CONFIG[type];
  return BADGE_LEVELS.map((level) => ({
    id: `${type}_${level}`,
    type,
    level,
    label: `${conf.labelBase} Lv.${level}`,
    description: `${conf.noun}を${level}個${conf.verb}しました`,
    icon: conf.icon,
    color: conf.color,
  }));
});

/**
 * 旧バージョンが保存した実績 ID。
 * 既存ユーザーの獲得済みバッジが消えないよう、Lv.1 に読み替える。
 */
const LEGACY_ALIASES: Record<string, string> = {
  FIRST_CANDIDATE: "CANDIDATE_1",
  FIRST_CHOICE: "CHOICE_1",
  FIRST_SOLUTION: "SOLUTION_1",
  FIRST_REACTION: "CANDIDATE_1",
};

export const normalizeBadgeId = (id: string) => LEGACY_ALIASES[id] ?? id;

export const getBadge = (id: string) => BADGES.find((b) => b.id === normalizeBadgeId(id));
