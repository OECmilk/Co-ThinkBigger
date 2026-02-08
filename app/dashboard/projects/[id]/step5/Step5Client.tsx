"use client";

import { useState, useEffect } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { saveSolution, deleteSolution, updateSolution } from "../actions";
import { FaDice, FaSave, FaTrash, FaCheckCircle, FaStar, FaEdit } from "react-icons/fa";
import { cn } from "@/lib/utils";

type Choice = {
  id: string;
  title: string;
  isOutsideDomain: boolean;
  sourceURL?: string | null;
};

type SubProblem = {
  id: string;
  title: string;
  choices: Choice[];
};

type Solution = {
  id: string;
  name: string;
  description?: string;
  components: Record<string, string>; // subProblemId -> choiceId
  createdAt: string;
};

export default function Step5Client({
  projectId,
  subProblems,
  solutions
}: {
  projectId: string;
  subProblems: SubProblem[];
  solutions: Solution[];
}) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [solutionName, setSolutionName] = useState("");
  const [solutionDesc, setSolutionDesc] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Editing state for saved solutions
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const handleSelect = (subId: string, choiceId: string) => {
    setSelections(prev => ({ ...prev, [subId]: choiceId }));
  };

  const handleRandomize = () => {
    const newSelections: Record<string, string> = {};
    let hasChoice = false;
    subProblems.forEach(sub => {
      if (sub.choices.length > 0) {
        const randomIndex = Math.floor(Math.random() * sub.choices.length);
        newSelections[sub.id] = sub.choices[randomIndex].id;
        hasChoice = true;
      }
    });
    if (hasChoice) {
      setSelections(newSelections);
      setSolutionName(`アイデア案 ${solutions.length + 1}`);
      setSolutionDesc("");
    } else {
      alert("選択肢がまだありません。STEP 4で事例を追加してください。");
    }
  };

  const handleSave = async () => {
    setErrorMsg("");
    if (!solutionName.trim() || Object.keys(selections).length === 0) return;
    setIsSaving(true);

    try {
      const res = await saveSolution(projectId, solutionName, solutionDesc, selections);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSolutionName("");
        setSolutionDesc("");
        // Optional: clear selection? keep for reference?
        // setSelections({}); 
      }
    } catch (e) {
      setErrorMsg("保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSolution = (sol: Solution) => {
    setSelections(sol.components);
    setSolutionName(""); // Clear current editing name to avoid confusion
    setSolutionDesc("");
  };

  const startEdit = (sol: Solution) => {
    setEditingId(sol.id);
    setEditName(sol.name);
    setEditDesc(sol.description || "");
  };

  const saveEdit = async (id: string) => {
    await updateSolution(id, projectId, editName, editDesc);
    setEditingId(null);
  };

  const isComplete = subProblems.length > 0 && subProblems.every(sub => selections[sub.id]);



  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 pixel-border-sm space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">STEP 05</span> 先行事例を組み合わせる
        </h2>
        <p className="text-stone-600 text-sm">
          サブ課題ごとの事例をひとつずつ選択し、独自の解決策を構成しましょう。<br />
          保存済みのアイデアをクリックすると構成をロードできます。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left: Builder Panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white p-4 pixel-border-sm">
            <div className="text-sm font-bold text-stone-500">
              {Object.keys(selections).length} / {subProblems.length} 選択中
            </div>
            <PixelButton onClick={handleRandomize} variant="secondary" className="flex items-center gap-2 text-sm">
              <FaDice className="text-[#f97316]" /> ランダム生成
            </PixelButton>
          </div>

          {/* Matrix */}
          <div className="space-y-6 pb-10">
            {subProblems.map((sub, idx) => (
              <div key={sub.id} className="space-y-3">
                <h4 className="font-bold text-stone-700 border-l-4 border-stone-800 pl-3">
                  {sub.title}
                </h4>
                <div className="flex flex-wrap gap-3">
                  {sub.choices.length === 0 && <span className="text-xs text-stone-400">事例がありません</span>}
                  {sub.choices.map(choice => {
                    const isSelected = selections[sub.id] === choice.id;
                    return (
                      <div
                        key={choice.id}
                        onClick={() => handleSelect(sub.id, choice.id)}
                        className={cn(
                          "cursor-pointer p-3 pr-4 rounded pixel-border-sm w-[160px] transition-all relative",
                          isSelected
                            ? "bg-orange-100 border-orange-400 shadow-md transform -translate-y-1"
                            : "bg-white border-stone-200 hover:bg-stone-50",
                          choice.isOutsideDomain && !isSelected && "border-l-4 border-purple-500",
                          choice.isOutsideDomain && isSelected && "border-l-4 border-purple-600"
                        )}
                        title={choice.title}
                      >
                        <p className="font-bold text-xs mb-1 leading-tight break-words line-clamp-3">{choice.title}</p>
                        {choice.isOutsideDomain && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-bold">領域外</span>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 text-orange-500">
                            <FaCheckCircle />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Editor Footer (Sticky at bottom of viewport) */}
          <div className="sticky bottom-0 bg-stone-100 p-4 -mx-4 -mb-4 border-t-2 border-stone-200 shadow-lg z-20">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
              {errorMsg && (
                <div className="text-red-500 font-bold text-xs bg-red-50 p-2 rounded pixel-border-sm border-red-200">
                  ⚠ {errorMsg}
                </div>
              )}
              <div className="flex gap-4 items-start">
                <div className="flex-1 space-y-2">
                  <input
                    className="w-full font-bold p-2 bg-white pixel-border-sm focus:outline-none focus:border-orange-500"
                    placeholder="アイデアのタイトル"
                    value={solutionName}
                    onChange={e => setSolutionName(e.target.value)}
                  />
                  <textarea
                    className="w-full text-sm p-2 bg-white pixel-border-sm focus:outline-none focus:border-orange-500 h-[60px]"
                    placeholder="アイデアの説明"
                    value={solutionDesc}
                    onChange={e => setSolutionDesc(e.target.value)}
                  />
                </div>
                <PixelButton
                  onClick={handleSave}
                  disabled={!isComplete || !solutionName.trim() || isSaving}
                  className="h-[100px] w-[120px] flex flex-col items-center justify-center gap-2 shrink-0"
                >
                  <FaSave className="text-xl" />
                  <span>保存</span>
                </PixelButton>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Saved Solutions */}
        <div className="lg:col-span-1 bg-stone-50 border-l-2 border-dashed border-stone-300 p-4 flex flex-col sticky top-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Note: sticky top-4 works if parent is tall. 
              But grid items default to stretch height. 
              Let's use 'items-start' in grid to allow sticky to work properly relative to sibling height.
              Added 'items-start' to grid above.
          */}
          <h3 className="font-bold text-stone-600 flex items-center gap-2 mb-4 shrink-0">
            <FaCheckCircle className="text-green-500" /> 保存済みアイデア ({solutions.length})
          </h3>

          <div className="space-y-4 pr-1">
            {solutions.length === 0 ? (
              <div className="text-center text-stone-400 py-8">
                まだアイデアがありません
              </div>
            ) : (
              solutions.map(sol => (
                <div
                  key={sol.id}
                  onClick={() => handleLoadSolution(sol)}
                  className={cn(
                    "bg-white p-3 pixel-border-sm group relative cursor-pointer hover:shadow-md transition-all border-l-4",
                    // Highlight if currently loaded (matching selections)
                    JSON.stringify(sol.components) === JSON.stringify(selections)  // Simple check
                      ? "border-orange-500 bg-orange-50"
                      : "border-stone-200"
                  )}
                >
                  {editingId === sol.id ? (
                    <div className="space-y-2 p-1 bg-white z-10 relative" onClick={e => e.stopPropagation()}>
                      <input
                        className="w-full font-bold border-b border-stone-300 focus:outline-none text-sm"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        autoFocus
                      />
                      <textarea
                        className="w-full text-xs border border-stone-200 p-1 focus:outline-none"
                        value={editDesc}
                        onChange={e => setEditDesc(e.target.value)}
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingId(null)} className="text-xs text-stone-400">キャンセル</button>
                        <button onClick={() => saveEdit(sol.id)} className="text-xs bg-orange-500 text-white px-2 py-1 rounded">完了</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="pr-6">
                        <h4 className="font-bold text-sm leading-tight mb-1">{sol.name}</h4>
                        {sol.description && (
                          <p className="text-xs text-stone-500 line-clamp-2">{sol.description}</p>
                        )}
                        <div className="mt-2 text-[10px] text-stone-400 flex flex-wrap gap-1">
                          {/* Preview dots of components */}
                          {Object.keys(sol.components).length}パーツ
                        </div>
                      </div>

                      <div className="absolute top-2 right-2 flex gap-1 bg-white/80 rounded" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => startEdit(sol)}
                          className="text-stone-300 hover:text-blue-500 p-1 transition-colors"
                        >
                          <FaEdit size={12} />
                        </button>
                        <button
                          onClick={() => deleteSolution(sol.id, projectId)}
                          className="text-stone-300 hover:text-red-500 p-1 transition-colors"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
