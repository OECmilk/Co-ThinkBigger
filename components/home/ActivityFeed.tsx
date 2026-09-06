"use client";

import Link from "next/link";
import { FaRegClock } from "react-icons/fa";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/project/Authorship";
import type { FeedEntry } from "@/lib/home";

const KIND_COLOR: Record<FeedEntry["kind"], string> = {
  candidate: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
  subProblem: "bg-[#fef3c7] text-[#92400e]",
  desire: "bg-[#ffe4e6] text-[#9f1239]",
  choice: "bg-[#dbeafe] text-[#1e40af]",
  solution: "bg-[var(--ok-soft)] text-[var(--ok)]",
  message: "bg-[var(--surface-3)] text-[var(--ink-2)]",
};

/**
 * チームの動き。
 *
 * 非同期だと、自分が寝ている間に進んだことが全く見えない。
 * 「昨日◯◯さんが3件書いた」が見えると、こちらも書こうという気になる。
 */
export function ActivityFeed({ entries }: { entries: FeedEntry[] }) {
  if (entries.length === 0) {
    return (
      <section className="card p-5">
        <h3 className="font-bold text-sm mb-2">チームの動き</h3>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          まだ動きがありません。誰かが最初の1件を書くとここに流れます。
        </p>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <FaRegClock className="text-[var(--ink-3)]" /> チームの動き
      </h3>

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link href={entry.href} className="flex gap-3 group items-start">
              <Avatar author={entry.author} size={26} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[var(--ink-2)]">
                  <span className="font-bold text-[var(--ink)]">{entry.author?.username ?? "メンバー"}</span>
                  <span className={"px-1.5 py-0.5 rounded font-bold " + KIND_COLOR[entry.kind]}>
                    {entry.label}
                  </span>
                  <span className="text-[var(--ink-3)]" suppressHydrationWarning>
                    {timeAgo(entry.createdAt)}
                  </span>
                </div>
                <p className="text-[13px] leading-snug mt-0.5 break-words line-clamp-2 group-hover:text-[var(--accent-ink)] transition-colors">
                  {entry.text}
                </p>
                <p className="text-[10px] text-[var(--ink-3)] mt-0.5 truncate">{entry.projectName}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
