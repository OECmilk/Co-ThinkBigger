"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelCard } from "@/components/ui/PixelCard";
import { addSubProblem, deleteSubProblem, updateProjectDescription, shareItem } from "../actions";
import { FaPlus, FaTrash, FaComments, FaSave, FaEdit, FaSitemap, FaUser, FaUsers, FaShare } from "react-icons/fa";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { cn } from "@/lib/utils";

type SubProblem = {
  id: string;
  title: string;
  authorId?: string;
  isShared?: boolean;
};

export default function Step2Client({
  projectId,
  initialDescription,
  subProblems,
  currentProfileId
}: {
  projectId: string;
  initialDescription: string;
  subProblems: SubProblem[];
  currentProfileId: string;
}) {
  const [description, setDescription] = useState(initialDescription || "");
  const [isEditingDesc, setIsEditingDesc] = useState(!initialDescription);
  const [newSubProblem, setNewSubProblem] = useState("");
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');

  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleUpdateDescription = async () => {
    await updateProjectDescription(projectId, description);
    setIsEditingDesc(false);
  };

  const handleAddSubProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubProblem.trim()) return;
    await addSubProblem(projectId, newSubProblem);
    setNewSubProblem("");
  };

  const filteredSubProblems = subProblems.filter(sub => {
    if (activeTab === 'personal') {
      return sub.authorId === currentProfileId;
    } else {
      return sub.isShared;
    }
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 pixel-border-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-[#f97316]">STEP 02</span> 課題の分解
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            解決すべき「メイン課題」を定義し、それを具体的な「サブ課題」に分解しましょう。<br />
            「個人」タブで自分の考えを整理し、「チーム」タブで共有・議論しましょう。
          </p>
        </div>

        {/* Tabs & Actions */}
        <div className="flex border-b border-stone-200 justify-between items-end">
          <div className="flex">
            <button
              onClick={() => setActiveTab('personal')}
              className={cn(
                "px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors border-b-2",
                activeTab === 'personal'
                  ? "border-[#f97316] text-[#f97316] bg-orange-50"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              <FaUser /> 個人
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={cn(
                "px-6 py-3 font-bold text-sm flex items-center gap-2 transition-colors border-b-2",
                activeTab === 'team'
                  ? "border-[#f97316] text-[#f97316] bg-orange-50"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              )}
            >
              <FaUsers /> チーム
            </button>
          </div>

          <button
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-stone-500 hover:text-[#f97316] font-bold text-sm mb-1 transition-colors"
          >
            <FaComments /> 議論を表示
          </button>
        </div>
      </div>

      {/* content based on tabs */}
      <div className="space-y-8">
        {activeTab === 'team' && (
          /* Main Problem Definition - Usually shared */
          <PixelCard className="bg-orange-50/50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <FaSitemap className="text-[#f97316]" /> メイン課題の定義
              </h3>
              {!isEditingDesc && (
                <button onClick={() => setIsEditingDesc(true)} className="text-stone-400 hover:text-stone-800">
                  <FaEdit />
                </button>
              )}
            </div>

            {isEditingDesc ? (
              <div className="space-y-4">
                <textarea
                  className="w-full p-4 pixel-border-sm focus:outline-none min-h-[100px]"
                  placeholder="例: 高齢者が使いやすいスマートフォンを作る"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <PixelButton onClick={handleUpdateDescription} disabled={!description.trim()}>
                    <FaSave /> 保存
                  </PixelButton>
                </div>
              </div>
            ) : (
              <p className="text-xl font-bold text-center py-6 px-4 bg-white pixel-border-sm">
                {description}
              </p>
            )}
          </PixelCard>
        )}

        {/* Sub Problems List */}
        <div className="space-y-4">
          <h3 className="font-bold text-stone-600">
            {activeTab === 'personal' ? '自分のサブ課題案' : '共有されたサブ課題'} ({filteredSubProblems.length})
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {filteredSubProblems.map(sub => (
              <div key={sub.id} className="bg-white p-4 pixel-border-sm flex justify-between items-center group">
                <span className="font-bold">{sub.title}</span>
                <div className="flex items-center gap-2">
                  {/* Share Button (Only in Personal tab and not yet shared) */}
                  {activeTab === 'personal' && !sub.isShared && (
                    <button
                      onClick={() => shareItem('subProblem', sub.id, projectId)}
                      className="text-white bg-blue-500 hover:bg-blue-600 px-3 py-1 text-xs rounded font-bold flex items-center gap-1 transition-colors"
                      title="チームに共有する"
                    >
                      <FaShare /> 共有
                    </button>
                  )}
                  {/* Already Shared Indicator */}
                  {activeTab === 'personal' && sub.isShared && (
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-200">
                      共有済み
                    </span>
                  )}

                  <button
                    onClick={() => deleteSubProblem(sub.id, projectId)}
                    className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}

            {filteredSubProblems.length === 0 && (
              <div className="text-center py-8 text-stone-400 border-2 border-dashed border-stone-200 bg-stone-50">
                {activeTab === 'personal'
                  ? "まだ案がありません。自分の考えを追加しましょう。"
                  : "まだ共有されたサブ課題はありません。"}
              </div>
            )}

            {/* Add New Card - Available in both tabs? Usually in Personal to encourage "Think Individually" */}
            {activeTab === 'personal' && (
              <form onSubmit={handleAddSubProblem} className="bg-white/50 border-2 border-dashed border-stone-300 p-4 flex gap-2 items-center">
                <FaPlus className="text-stone-400" />
                <input
                  className="flex-1 bg-transparent focus:outline-none"
                  placeholder="新しいサブ課題案を追加"
                  value={newSubProblem}
                  onChange={(e) => setNewSubProblem(e.target.value)}
                />
                <button type="submit" disabled={!newSubProblem.trim()} className="text-[#f97316] font-bold hover:underline text-sm">
                  追加
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        projectId={projectId}
        candidateId={null}
        title="課題分解の議論"
      />
    </div>
  );
}
