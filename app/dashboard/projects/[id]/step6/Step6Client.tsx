"use client";

import { useState } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { toggleEvaluation } from "../actions";
import { cn } from "@/lib/utils";
import { FaComments, FaTrophy, FaCheck } from "react-icons/fa";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, BlockerNotice } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import type { DesireType, ProjectProgress, StepProgress } from "@/lib/project";

type Desire = { id: string; type: DesireType; content: string; author: Author };
type Solution = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  author: Author;
  isMine: boolean;
  satisfiedDesireIds: string[];
};

const TITLES: Record<DesireType, string> = {
  self: "あなた",
  target: "ターゲット",
  "third-party": "第三者",
};

const ORDER: DesireType[] = ["self", "target", "third-party"];

export default function Step6Client({
  projectId,
  step,
  progress,
  desires,
  solutions,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  desires: Desire[];
  solutions: Solution[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(solutions[0]?.id ?? null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { run } = useAction();

  /**
   * チェックはサーバー往復を待たずに切り替える。
   * `${solutionId}:${desireId}` → チェック状態、という上書き表だけ持ち、
   * 失敗したらそのキーを取り下げてサーバーの状態に戻す。
   */
  const [checkDrafts, setCheckDrafts] = useState<Record<string, boolean>>({});
  const draftKey = (solutionId: string, desireId: string) => `${solutionId}:${desireId}`;

  const isSatisfied = (solution: Solution, desireId: string) =>
    checkDrafts[draftKey(solution.id, desireId)] ?? solution.satisfiedDesireIds.includes(desireId);

  const toggleCheck = (solution: Solution, desireId: string) => {
    const key = draftKey(solution.id, desireId);
    const next = !isSatisfied(solution, desireId);
    setCheckDrafts((d) => ({ ...d, [key]: next }));

    run(() => toggleEvaluation(solution.id, desireId, projectId), {
      key: `eval-${key}`,
      error: "評価の更新に失敗しました",
      onError: () =>
        setCheckDrafts((d) => {
          const rest = { ...d };
          delete rest[key];
          return rest;
        }),
    });
  };

  const selected = solutions.find((s) => s.id === selectedId) ?? solutions[0] ?? null;

  const scoreByType = (solution: Solution, type: DesireType) => {
    const total = desires.filter((d) => d.type === type).length;
    const satisfied = desires.filter((d) => d.type === type && isSatisfied(solution, d.id)).length;
    return { total, satisfied, percent: total > 0 ? Math.round((satisfied / total) * 100) : 0 };
  };

  /**
   * 総合点は「3視点の充足率の平均」。
   * 一つの視点だけ突出した案より、三角形が大きい案を選ぶのが THINK BIGGER の考え方。
   */
  const overall = (solution: Solution) => {
    const parts = ORDER.map((t) => scoreByType(solution, t)).filter((s) => s.total > 0);
    if (parts.length === 0) return 0;
    return Math.round(parts.reduce((sum, s) => sum + s.percent, 0) / parts.length);
  };

  const ranked = [...solutions].sort((a, b) => overall(b) - overall(a));
  const best = ranked[0] && overall(ranked[0]) > 0 ? ranked[0] : null;

  const chartData = selected
    ? ORDER.map((t) => ({ subject: TITLES[t], value: scoreByType(selected, t).percent }))
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <StepHeader
        step={step}
        description={
          <>
            それぞれの解決策が、STEP 3 で挙げた望みをどれだけ満たすかをチェックします。
            <br />
            3 つの視点をバランスよく満たす＝三角形の大きい案が、実現する価値のあるアイデアです。
          </>
        }
        actions={
          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white pixel-border-sm text-stone-600 hover:text-[#f97316] font-bold text-sm transition-colors shrink-0"
          >
            <FaComments /> このステップの議論
          </button>
        }
      />

      {step.blocker ? (
        <BlockerNotice blocker={step.blocker} steps={progress.steps} />
      ) : (
        <>
          {/* 今のところの本命 — 「決められない」で止まらないように結論を出す */}
          {best && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 flex items-start gap-3">
              <FaTrophy className="text-emerald-600 mt-1 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-emerald-700">現時点でいちばんバランスの良い案</div>
                <div className="font-bold break-words">
                  {best.name}（総合 {overall(best)}%）
                </div>
                {best.description && (
                  <p className="text-sm text-stone-700 mt-1 break-words">{best.description}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* 解決策の一覧（スコア順） */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-stone-500">評価する解決策を選ぶ</h3>
              {ranked.map((s, i) => {
                const score = overall(s);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "w-full text-left p-3 pixel-border-sm transition-all border-l-4",
                      selected?.id === s.id
                        ? "bg-orange-50 border-[#f97316]"
                        : "bg-white border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm break-words">
                          <span className="text-stone-400 mr-1">{i + 1}.</span>
                          {s.name}
                        </div>
                        <AuthorStamp author={s.author} at={s.createdAt} isMine={s.isMine} className="mt-1" />
                      </div>
                      <span
                        className={cn(
                          "text-xs font-bold px-2 py-1 shrink-0",
                          score >= 67 ? "bg-emerald-100 text-emerald-800" : score > 0 ? "bg-orange-100 text-orange-800" : "bg-stone-100 text-stone-500"
                        )}
                      >
                        {score}%
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 bg-stone-200 overflow-hidden">
                      <div className="h-full bg-[#f97316] transition-all" style={{ width: `${score}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* チェックリストとレーダー */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-white p-4 pixel-border-sm">
                <h3 className="font-bold mb-3">
                  「{selected?.name}」は誰の望みを満たすか
                </h3>
                <div className="w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
                      <PolarGrid gridType="polygon" stroke="#e7e5e4" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "#292524", fontSize: 13, fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name={selected?.name}
                        dataKey="value"
                        stroke="#f97316"
                        strokeWidth={3}
                        fill="#f97316"
                        fillOpacity={0.4}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {selected && (
                <PixelCard className="space-y-6">
                  {ORDER.map((type) => {
                    const typeDesires = desires.filter((d) => d.type === type);
                    const s = scoreByType(selected, type);

                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-stone-100">
                          <h4 className="font-bold text-[#f97316]">{TITLES[type]}</h4>
                          <span className="text-xs font-bold bg-stone-100 px-2 py-1">
                            {s.percent}%（{s.satisfied}/{s.total}）
                          </span>
                        </div>

                        <div className="space-y-2">
                          {typeDesires.map((d) => {
                            const checked = isSatisfied(selected, d.id);
                            return (
                              <button
                                key={d.id}
                                onClick={() => toggleCheck(selected, d.id)}
                                className={cn(
                                  "w-full text-left p-3 pixel-border-sm transition-colors flex items-start gap-3",
                                  checked ? "bg-orange-50" : "bg-white hover:bg-stone-50"
                                )}
                                aria-pressed={checked}
                              >
                                <span
                                  className={cn(
                                    "w-5 h-5 border-2 flex items-center justify-center shrink-0 mt-0.5 text-[10px]",
                                    checked ? "bg-[#f97316] border-[#f97316] text-white" : "border-stone-300"
                                  )}
                                >
                                  {checked && <FaCheck />}
                                </span>
                                <span className="min-w-0">
                                  <span
                                    className={cn(
                                      "block text-sm break-words",
                                      checked ? "font-bold text-stone-800" : "text-stone-600"
                                    )}
                                  >
                                    {d.content}
                                  </span>
                                  <AuthorStamp author={d.author} className="mt-1" />
                                </span>
                              </button>
                            );
                          })}

                          {typeDesires.length === 0 && (
                            <p className="text-xs text-stone-400 py-2">
                              {TITLES[type]}の望みがまだ共有されていません（STEP 3）。
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </PixelCard>
              )}
            </div>
          </div>
        </>
      )}

      <StepFooterNav progress={progress} current="step6" />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        step="step6"
        title="STEP 6 評価の議論"
      />
    </div>
  );
}
