"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { saveSolution, deleteSolution, updateSolution } from "../actions";
import { FaDice, FaSave, FaTrash, FaCheckCircle, FaEdit, FaComments, FaEraser } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { AuthorStamp, type Author } from "@/components/project/Authorship";
import { StepHeader, StepFooterNav, EmptyState, BlockerNotice } from "@/components/project/StepScaffold";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";
import type { ProjectProgress, StepProgress } from "@/lib/project";

type Choice = { id: string; title: string; isOutsideDomain: boolean; sourceURL: string | null };
type Row = { id: string; title: string; choices: Choice[] };
type Solution = {
  id: string;
  name: string;
  description: string;
  components: Record<string, string>;
  createdAt: string;
  author: Author;
  isMine: boolean;
};

export default function Step5Client({
  projectId,
  step,
  progress,
  rows,
  solutions,
  choiceTitles,
}: {
  projectId: string;
  step: StepProgress;
  progress: ProjectProgress;
  rows: Row[];
  solutions: Solution[];
  choiceTitles: Record<string, string>;
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({ name: "", description: "" });
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { run, isBusy } = useAction();
  const { toast } = useFeedback();

  const usableRows = rows.filter((r) => r.choices.length > 0);
  const missingRows = rows.filter((r) => r.choices.length === 0);
  const selectedCount = Object.keys(selections).length;
  const isComplete = usableRows.length > 0 && usableRows.every((r) => selections[r.id]);

  const handleRandomize = () => {
    if (usableRows.length === 0) {
      toast("組み合わせられる事例がまだありません。STEP 4 で事例を共有してください。", "error");
      return;
    }
    const next: Record<string, string> = {};
    usableRows.forEach((row) => {
      next[row.id] = row.choices[Math.floor(Math.random() * row.choices.length)].id;
    });
    setSelections(next);
    setName(`アイデア案 ${solutions.length + 1}`);
    setDescription("");
    toast("ランダムに組み合わせました。しっくりこなければ個別に差し替えてください", "info");
  };

  const handleSave = () => {
    run(
      async () => {
        const res = await saveSolution(projectId, name, description, selections);
        if (!res.error) {
          setName("");
          setDescription("");
          res.unlocked?.forEach((b) => toast(`${b.icon} 実績「${b.label}」を獲得しました！`, "success"));
        }
        return res;
      },
      { key: "save-solution", success: "解決策を保存しました。STEP 6 で評価できます" }
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <StepHeader
        step={step}
        description={
          <>
            サブ課題ごとに事例を 1 つずつ選び、つなぎ合わせて 1 つの解決策にします。
            <br />
            うまい組み合わせは考えるより<span className="font-bold">数を出す</span>方が早いので、
            ランダム生成も遠慮なく使ってください。
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* 組み立てパネル */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 pixel-border-sm">
              <div className="text-sm font-bold text-stone-600">
                {selectedCount} / {usableRows.length} 個のサブ課題を選択中
              </div>
              <div className="flex gap-2">
                {selectedCount > 0 && (
                  <PixelButton
                    variant="secondary"
                    onClick={() => setSelections({})}
                    className="flex items-center gap-2 text-sm"
                  >
                    <FaEraser className="text-stone-400" /> 選択を解除
                  </PixelButton>
                )}
                <PixelButton onClick={handleRandomize} variant="secondary" className="flex items-center gap-2 text-sm">
                  <FaDice className="text-[#f97316]" /> ランダム生成
                </PixelButton>
              </div>
            </div>

            {missingRows.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-sm">
                <p className="font-bold text-amber-900">事例がまだ共有されていないサブ課題があります</p>
                <ul className="list-disc list-inside text-amber-800 mt-1">
                  {missingRows.map((r) => (
                    <li key={r.id}>{r.title}</li>
                  ))}
                </ul>
                <p className="text-amber-800 mt-1">
                  STEP 4 で事例を共有すると、この解決策の一部として選べるようになります。
                </p>
              </div>
            )}

            <div className="space-y-6">
              {usableRows.map((row) => (
                <div key={row.id} className="space-y-3">
                  <h4 className="font-bold text-stone-700 border-l-4 border-stone-800 pl-3 break-words">
                    {row.title}
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {row.choices.map((choice) => {
                      const isSelected = selections[row.id] === choice.id;
                      return (
                        <button
                          key={choice.id}
                          onClick={() =>
                            setSelections((prev) =>
                              prev[row.id] === choice.id
                                ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== row.id))
                                : { ...prev, [row.id]: choice.id }
                            )
                          }
                          className={cn(
                            "text-left p-3 pixel-border-sm w-[190px] transition-all relative",
                            isSelected
                              ? "bg-orange-100 -translate-y-1"
                              : "bg-white hover:bg-stone-50",
                            choice.isOutsideDomain && "border-l-4 border-purple-500"
                          )}
                          aria-pressed={isSelected}
                        >
                          <p className="font-bold text-xs leading-snug break-words pr-5">{choice.title}</p>
                          {choice.isOutsideDomain && (
                            <span className="inline-block mt-1 text-[9px] bg-purple-100 text-purple-700 px-1 font-bold">
                              領域外
                            </span>
                          )}
                          {isSelected && (
                            <FaCheckCircle className="absolute top-2 right-2 text-[#f97316]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 保存フォーム */}
            <div className="bg-white p-4 pixel-border-sm space-y-3 sticky bottom-2 z-20 shadow-lg">
              {!isComplete && (
                <p className="text-xs text-stone-500">
                  すべてのサブ課題を 1 つずつ選ぶと保存できます（残り {usableRows.length - selectedCount} 個）。
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                <div className="flex-1 space-y-2 min-w-0">
                  <input
                    className="w-full font-bold p-2 bg-stone-50 pixel-border-sm focus:outline-none focus:bg-orange-50"
                    placeholder="アイデアのタイトル（例: 図書館式サブスク家電）"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <textarea
                    className="w-full text-sm p-2 bg-stone-50 pixel-border-sm focus:outline-none focus:bg-orange-50 h-[60px]"
                    placeholder="どういうアイデアか、ひとことで（後からメンバーが読んで分かるように）"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <PixelButton
                  onClick={handleSave}
                  disabled={!isComplete || !name.trim() || isBusy("save-solution")}
                  className="sm:w-[130px] flex flex-col items-center justify-center gap-2 shrink-0"
                >
                  {isBusy("save-solution") ? <Spinner size={20} /> : <FaSave className="text-xl" />}
                  <span>{isBusy("save-solution") ? "保存中…" : "保存"}</span>
                </PixelButton>
              </div>
            </div>
          </div>

          {/* 保存済み */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24">
            <h3 className="font-bold text-stone-600 flex items-center gap-2">
              <FaCheckCircle className="text-emerald-500" /> チームのアイデア（{solutions.length}）
            </h3>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
              {solutions.length === 0 ? (
                <EmptyState title="まだアイデアがありません" hint="左で組み合わせて保存すると、ここに溜まっていきます。" />
              ) : (
                solutions.map((sol) => {
                  const parts = Object.values(sol.components)
                    .map((choiceId) => choiceTitles[String(choiceId)])
                    .filter(Boolean);

                  return (
                    <div key={sol.id} className="bg-white p-3 pixel-border-sm group relative">
                      {editingId === sol.id ? (
                        <div className="space-y-2">
                          <input
                            className="w-full font-bold border-b border-stone-300 focus:outline-none text-sm"
                            value={editDraft.name}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            autoFocus
                          />
                          <textarea
                            className="w-full text-xs border border-stone-200 p-1 focus:outline-none"
                            value={editDraft.description}
                            onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="text-xs text-stone-400">
                              キャンセル
                            </button>
                            <button
                              onClick={() =>
                                run(
                                  async () => {
                                    const res = await updateSolution(
                                      sol.id,
                                      projectId,
                                      editDraft.name,
                                      editDraft.description
                                    );
                                    if (!res.error) setEditingId(null);
                                    return res;
                                  },
                                  { key: `edit-${sol.id}`, success: "更新しました" }
                                )
                              }
                              className="text-xs bg-[#f97316] text-white px-2 py-1 font-bold inline-flex items-center gap-1.5"
                              disabled={isBusy(`edit-${sol.id}`)}
                            >
                              {isBusy(`edit-${sol.id}`) && <Spinner size={9} />}
                              完了
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="pr-12">
                            <h4 className="font-bold text-sm leading-snug mb-1 break-words">{sol.name}</h4>
                            {sol.description && (
                              <p className="text-xs text-stone-600 leading-relaxed break-words">{sol.description}</p>
                            )}

                            {/* 何を組み合わせたのかを残す（後から読む人のために） */}
                            {parts.length > 0 && (
                              <ul className="mt-2 space-y-0.5">
                                {parts.map((title, i) => (
                                  <li key={i} className="text-[10px] text-stone-500 flex gap-1">
                                    <span className="text-[#f97316]">+</span>
                                    <span className="break-words">{title}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <AuthorStamp
                              author={sol.author}
                              at={sol.createdAt}
                              isMine={sol.isMine}
                              className="mt-2"
                            />
                          </div>

                          <div className="absolute top-2 right-2 flex gap-1">
                            <button
                              onClick={() => {
                                setEditingId(sol.id);
                                setEditDraft({ name: sol.name, description: sol.description });
                              }}
                              className="text-stone-300 hover:text-blue-500 p-1"
                              title="編集"
                            >
                              <FaEdit size={12} />
                            </button>
                            <button
                              onClick={() =>
                                run(() => deleteSolution(sol.id, projectId), {
                                  key: `del-${sol.id}`,
                                  confirm: {
                                    title: "この解決策を削除しますか？",
                                    message: `「${sol.name}」\n\nSTEP 6 で付けた評価も一緒に消えます。`,
                                    confirmLabel: "削除する",
                                    tone: "danger",
                                  },
                                  success: "削除しました",
                                })
                              }
                              className="text-stone-300 hover:text-red-500 p-1"
                              title="削除"
                              disabled={isBusy(`del-${sol.id}`)}
                            >
                              {isBusy(`del-${sol.id}`) ? <Spinner size={10} /> : <FaTrash size={12} />}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      <StepFooterNav progress={progress} current="step5" />

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        step="step5"
        title="STEP 5 組み合わせの議論"
      />
    </div>
  );
}
