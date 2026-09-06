"use client";

import Link from "next/link";
import { cn, timeAgo } from "@/lib/utils";
import { FaUsers, FaLock } from "react-icons/fa";

/**
 * 「誰が・いつ書いたか」を全アイテムに付ける。
 *
 * 対面なら空気で分かることが、非同期だと完全に失われる。
 * 発言の主が見えないと議論も感謝もできないので、
 * 候補・サブ課題・望み・事例・解決策すべてに同じ形で表示する。
 */

export type Author = { id: string; username: string; avatarUrl: string | null } | null | undefined;

export function Avatar({
  author,
  size = 24,
  className,
}: {
  author: Author;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden bg-orange-100 text-stone-700 font-bold pixel-border-sm rounded-full",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(9, size * 0.42) }}
      title={author?.username || "不明なメンバー"}
    >
      {author?.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={author.avatarUrl} alt={author.username} className="w-full h-full object-cover" />
      ) : (
        (author?.username?.[0] || "?").toUpperCase()
      )}
    </span>
  );
}

export function AuthorStamp({
  author,
  at,
  isMine,
  className,
}: {
  author: Author;
  at?: string;
  isMine?: boolean;
  className?: string;
}) {
  const body = (
    <>
      <Avatar author={author} size={18} />
      <span className="font-bold truncate max-w-[10rem]">
        {isMine ? "あなた" : author?.username || "不明なメンバー"}
      </span>
      {at && (
        <span className="text-stone-400 shrink-0" suppressHydrationWarning>
          {timeAgo(at)}
        </span>
      )}
    </>
  );

  const classes = cn("inline-flex items-center gap-1.5 text-[11px] text-stone-500 min-w-0", className);

  return author?.id ? (
    <Link href={`/dashboard/profile/${author.id}`} className={cn(classes, "hover:text-[#f97316] transition-colors")}>
      {body}
    </Link>
  ) : (
    <span className={classes}>{body}</span>
  );
}

/** 個人メモか、チームに出したものかを一目で区別する */
export function ShareBadge({ isShared }: { isShared: boolean }) {
  return isShared ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded shrink-0">
      <FaUsers /> 共有中
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-500 bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded shrink-0">
      <FaLock /> 自分だけ
    </span>
  );
}

/**
 * 個人 / チームの切り替えタブ。
 * THINK BIGGER は「まず一人で発散し、それから持ち寄る」のが要なので、
 * どのステップでも同じ言葉・同じ位置で切り替えられるようにする。
 */
export function PersonalTeamTabs({
  value,
  onChange,
  personalCount,
  teamCount,
}: {
  value: "personal" | "team";
  onChange: (v: "personal" | "team") => void;
  personalCount: number;
  teamCount: number;
}) {
  const tab = (key: "personal" | "team", label: string, count: number, icon: React.ReactNode) => (
    <button
      onClick={() => onChange(key)}
      className={cn(
        "px-5 py-3 font-bold text-sm flex items-center gap-2 transition-colors border-b-2",
        value === key
          ? "border-[#f97316] text-[#f97316] bg-orange-50"
          : "border-transparent text-stone-500 hover:text-stone-800"
      )}
      aria-pressed={value === key}
    >
      {icon}
      {label}
      <span
        className={cn(
          "text-[10px] px-1.5 py-0.5 rounded font-bold",
          value === key ? "bg-orange-200 text-orange-800" : "bg-stone-200 text-stone-600"
        )}
      >
        {count}
      </span>
    </button>
  );

  return (
    <div className="flex border-b border-stone-200">
      {tab("personal", "自分の下書き", personalCount, <FaLock />)}
      {tab("team", "チームの共有", teamCount, <FaUsers />)}
    </div>
  );
}
