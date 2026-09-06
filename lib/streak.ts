import { cache } from "react";
import { getSupabase } from "@/lib/auth";

/**
 * 「毎日ひらく」を支える連続日数。
 *
 * 進捗バーは長期の指標なので、1日の作業では体感的に動かない。
 * 1日1マス確実に伸びるものが別にあると、短い作業でも手応えが出る。
 *
 * 集計は ActivityDay（1人1日1行）に寄せてあるので、
 * ホームを開くたびに全テーブルを走査しなくて済む。
 */

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST での YYYY-MM-DD */
export function jstDayKey(date: Date = new Date()): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function shiftDay(key: string, days: number): string {
  const d = new Date(key + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 何か作った時に呼ぶ。失敗しても本体の操作は止めない。 */
export async function bumpActivity(profileId: string) {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.rpc("bump_activity", { p_profile: profileId });
    if (error) {
      // migration_v3 未適用の環境ではここに来る。機能全体は動かす。
      console.warn("[activity] bump skipped:", error.message);
    }
  } catch (e) {
    console.warn("[activity] bump failed", e);
  }
}

export type StreakInfo = {
  /** 今日を含む連続日数 */
  current: number;
  /** 過去最長 */
  best: number;
  /** 今日すでに手を動かしたか */
  activeToday: boolean;
  /** 直近 N 日ぶんの活動量（古い→新しい） */
  recent: { day: string; count: number }[];
  /** 総活動日数 */
  totalDays: number;
};

export const getStreak = cache(async (profileId: string, days = 28): Promise<StreakInfo> => {
  const empty: StreakInfo = { current: 0, best: 0, activeToday: false, recent: [], totalDays: 0 };

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("ActivityDay")
      .select("day, count")
      .eq("profileId", profileId)
      .order("day", { ascending: false })
      .limit(400);

    if (error || !data) return empty;

    const byDay = new Map<string, number>();
    data.forEach((row: any) => byDay.set(String(row.day).slice(0, 10), row.count ?? 1));

    const today = jstDayKey();
    const activeToday = byDay.has(today);

    // 今日（無ければ昨日）から遡って連続日数を数える
    let cursor = activeToday ? today : shiftDay(today, -1);
    let current = 0;
    while (byDay.has(cursor)) {
      current++;
      cursor = shiftDay(cursor, -1);
    }
    // 昨日で途切れている＝今日まだなら継続中扱い、一昨日以前で切れていたら 0
    if (!activeToday && current > 0 && !byDay.has(shiftDay(today, -1))) current = 0;

    // 最長連続
    const sorted = [...byDay.keys()].sort();
    let best = 0;
    let run = 0;
    let prev: string | null = null;
    for (const day of sorted) {
      run = prev && shiftDay(prev, 1) === day ? run + 1 : 1;
      best = Math.max(best, run);
      prev = day;
    }

    const recent: { day: string; count: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = shiftDay(today, -i);
      recent.push({ day, count: byDay.get(day) ?? 0 });
    }

    return { current, best: Math.max(best, current), activeToday, recent, totalDays: byDay.size };
  } catch {
    return empty;
  }
});
