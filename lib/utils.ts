import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 「3分前」「昨日」のような相対表記。
 * 非同期で作業していると絶対時刻より「どれくらい前の話か」の方が効く。
 */
export function timeAgo(value: string | Date): string {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";

  const diffSec = Math.floor((Date.now() - then) / 1000);
  if (diffSec < 60) return "たった今";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}分前`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}時間前`;
  if (diffSec < 172800) return "昨日";
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}日前`;

  return new Date(value).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
}
