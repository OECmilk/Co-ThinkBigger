"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { addDesire, deleteDesire, setShared } from "../actions";
import { FaPlus, FaTrash, FaShare, FaUndo, FaComments, FaCheckCircle } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { TriangleThreeWay } from "./TriangleChart";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, PersonalTeamTabs, ShareBadge, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, EmptyState, BlockerNotice } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import { useFeedback } from "@/components/ui/Feedback";
import type { DesireType, ProjectProgress, StepProgress } from "@/lib/project";

type Desire = {
  id: string;
  type: DesireType;
  content: string;
  isShared: boolean;
  createdAt: string;
  author: Author;
  isMine: boolean;
};

const TITLES: Record<DesireType, string> = {
  self: "あなた",
  target: "ターゲット",
  "third-party": "第三者",
};

const PROMPTS: Record<DesireType, string> = {
  self: "この課題が解決したら、あなた自身は何が嬉しいですか？ 逆に譲れないことは？",
  target: "課題を抱えている当事者は何を望んでいますか？ 何を嫌がりますか？",
  "third-party": "周囲（社会・同僚・家族・取引先など）はどう影響を受けますか？",
};

export default function Step3Client({
  projectId,
  step,
  progress,
  mainProblem,
  desires,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  mainProblem: string;
  desires: Desire[];
}) {
  const [selectedType, setSelectedType] = useState<DesireType>("self");
  const [newDesire, setNewDesire] = useState("");
  const [activeTab, setActiveTab] = useState<"personal" | "team">("personal");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { run, isPending } = useAction();
  const { toast } = useFeedback();

  const mine = desires.filter((d) => d.isMine);
  const shared = desires.filter((d) => d.isShared);
  const tabDesires = activeTab === "personal" ? mine : shared;

  const counts = {
    self: tabDesires.filter((d) => d.type === "self").length,
    target: tabDesires.filter((d) => d.type === "target").length,
    "third-party": tabDesires.filter((d) => d.type === "third-party").length,
  };

  const list = tabDesires.filter((d) => d.type === selectedType);

  // 「チームとして、どの視点がまだ空か」は完了条件そのものなので常に見せる
  const teamCoverage = (["self", "target", "third-party"] as DesireType[]).map((t) => ({
    type: t,
    covered: shared.some((d) => d.type === t),
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesire.trim()) return;
    const value = newDesire;
    run(
      async () => {
        const res = await addDesire(projectId, selectedType, value);
        if (!res.error) {
          setNewDesire("");
          res.unlocked?.forEach((b) => toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success"));
        }
        return res;
      },
      { success: "望みを追加しました" }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <StepHeader
        step={step}
        description={
          <>
            解決策を評価する「ものさし」を先に作ります。3 つの立場それぞれの望みを言葉にしてください。
            <br />
            ここで挙げた望みが、そのまま STEP 6 の評価軸になります。
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

      {step.blocker && <BlockerNotice blocker={step.blocker} steps={progress.steps} />}

      {mainProblem && (
        <div className="bg-white pixel-border-sm p-4 text-sm">
          <span className="text-[11px] font-bold text-stone-400 block mb-1">メイン課題</span>
          <span className="font-bold break-words">{mainProblem}</span>
        </div>
      )}

      {/* チームとしてのカバー状況 */}
      <div className="flex flex-wrap gap-3">
        {teamCoverage.map(({ type, covered }) => (
          <div
            key={type}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-xs font-bold pixel-border-sm",
              covered ? "bg-emerald-50 text-emerald-800" : "bg-white text-stone-500"
            )}
          >
            {covered ? <FaCheckCircle className="text-emerald-600" /> : <FaPlus className="text-stone-300" />}
            {TITLES[type]}の望み{covered ? "：共有済み" : "：未共有"}
          </div>
        ))}
      </div>

      <div className="bg-white pixel-border-sm">
        <PersonalTeamTabs
          value={activeTab}
          onChange={setActiveTab}
          personalCount={mine.length}
          teamCount={shared.length}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start p-5">
          <div className="flex flex-col items-center gap-4 py-4">
            <TriangleThreeWay onSelect={(t) => t && setSelectedType(t)} selectedType={selectedType} counts={counts} />
            <p className="text-xs text-stone-500 text-center">三角形の各領域をクリックすると視点を切り替えられます</p>
          </div>

          <div>
            <PixelCard className="min-h-[420px] flex flex-col">
              <div className="mb-4 pb-4 border-b-2 border-stone-100">
                <h3 className="text-xl font-bold text-[#f97316] mb-1">{TITLES[selectedType]}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{PROMPTS[selectedType]}</p>
                <div className="text-[11px] font-bold text-stone-400 mt-2">
                  {activeTab === "personal" ? "自分の下書き（共有するまで非公開）" : "チームで共有された望み"}
                </div>
              </div>

              <div className="flex-1 space-y-3 mb-4 overflow-y-auto max-h-[380px] pr-1">
                {list.length === 0 ? (
                  <EmptyState
                    title={activeTab === "personal" ? "この視点はまだ空です" : "まだ共有されていません"}
                    hint={
                      activeTab === "personal"
                        ? "1 行でかまいません。思いつくまま書いてみましょう。"
                        : "「自分の下書き」で書いたものを共有すると、ここに並びます。"
                    }
                  />
                ) : (
                  list.map((desire) => (
                    <div key={desire.id} className="bg-stone-50 p-3 pixel-border-sm group">
                      <p className="text-sm font-bold leading-relaxed break-words">{desire.content}</p>
                      <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <AuthorStamp author={desire.author} at={desire.createdAt} isMine={desire.isMine} />
                          <ShareBadge isShared={desire.isShared} />
                        </div>

                        {desire.isMine && (
                          <div className="flex items-center gap-2 shrink-0">
                            {desire.isShared ? (
                              <button
                                onClick={() =>
                                  run(() => setShared("desire", desire.id, projectId, false), {
                                    success: "共有を取り消しました",
                                  })
                                }
                                className="text-[11px] font-bold text-stone-400 hover:text-stone-700 flex items-center gap-1"
                              >
                                <FaUndo /> 取消
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  run(() => setShared("desire", desire.id, projectId, true), {
                                    success: "チームに共有しました",
                                  })
                                }
                                className="text-[11px] font-bold text-white bg-[#f97316] hover:bg-orange-600 px-2 py-1 flex items-center gap-1 pixel-border-sm"
                              >
                                <FaShare /> 共有
                              </button>
                            )}
                            <button
                              onClick={() =>
                                run(() => deleteDesire(desire.id, projectId), {
                                  confirm: {
                                    title: "この望みを削除しますか？",
                                    message: `「${desire.content}」\n\nSTEP 6 でこの望みに対して付けた評価も消えます。`,
                                    confirmLabel: "削除する",
                                    tone: "danger",
                                  },
                                  success: "削除しました",
                                })
                              }
                              className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                              title="削除"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activeTab === "personal" && (
                <form onSubmit={handleSubmit} className="mt-auto flex gap-2">
                  <input
                    className="flex-1 bg-stone-50 pixel-border-sm px-3 py-2 focus:outline-none focus:bg-orange-50 min-w-0"
                    placeholder={`${TITLES[selectedType]}の望み・懸念を入力`}
                    value={newDesire}
                    onChange={(e) => setNewDesire(e.target.value)}
                  />
                  <PixelButton type="submit" disabled={isPending || !newDesire.trim()} className="shrink-0">
                    <FaPlus />
                  </PixelButton>
                </form>
              )}
            </PixelCard>
          </div>
        </div>
      </div>

      <StepFooterNav progress={progress} current="step3" />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        step="step3"
        title="STEP 3 要望分析の議論"
      />
    </div>
  );
}
