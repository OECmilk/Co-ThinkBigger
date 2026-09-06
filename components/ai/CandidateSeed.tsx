"use client";

import { useState } from "react";
import { TOPIC_PRESETS } from "@/lib/news";
import { cn } from "@/lib/utils";
import { AiSuggest } from "./AiSuggest";

/**
 * STEP 1 用の AI 提案。
 *
 * ただ「案を出して」と頼むより、
 *  ・気になっていること（自由記述）
 *  ・世の中のどの領域から着想するか
 * を先に指定できた方が、自分ごとの課題が出てくる。
 */
export function CandidateSeed({
  projectId,
  aiReady,
  hint,
  onHintChange,
  autoOpenKey,
}: {
  projectId: string;
  aiReady: boolean;
  hint: string;
  onHintChange: (value: string) => void;
  autoOpenKey?: number;
}) {
  const [topicPreset, setTopicPreset] = useState<string>("");

  return (
    <AiSuggest
      projectId={projectId}
      aiReady={aiReady}
      title="課題候補の提案"
      triggerLabel="AIに課題候補を出してもらう"
      autoOpenKey={autoOpenKey}
      buildRequest={() => ({
        kind: "candidates",
        hint: hint.trim() || undefined,
        topicPreset: topicPreset || undefined,
      })}
      buildAdopt={(selected) => ({ kind: "candidates", texts: selected.map((s) => s.text) })}
      header={
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-[var(--ink-2)] mb-1.5">
              気になっていること・自分の状況（任意）
            </label>
            <textarea
              value={hint}
              onChange={(e) => onHintChange(e.target.value)}
              rows={2}
              placeholder="例: 地方の商店街に人が戻らない。うちの祖母が買い物に困っている。"
              className="w-full text-[13px] bg-white border-2 border-[var(--line)] focus:border-[var(--accent)] rounded-[4px] px-3 py-2 focus:outline-none resize-none"
            />
          </div>

          <div>
            <span className="block text-[11px] font-bold text-[var(--ink-2)] mb-1.5">
              世の中の話題から着想する（任意）
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setTopicPreset("")}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold rounded-full border-2 transition-colors",
                  topicPreset === ""
                    ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                    : "bg-white border-[var(--line)] text-[var(--ink-2)]"
                )}
              >
                使わない
              </button>
              {TOPIC_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTopicPreset(p.id)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold rounded-full border-2 transition-colors",
                    topicPreset === p.id
                      ? "bg-[var(--ink)] text-white border-[var(--ink)]"
                      : "bg-white border-[var(--line)] text-[var(--ink-2)] hover:border-[var(--ink-3)]"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    />
  );
}
