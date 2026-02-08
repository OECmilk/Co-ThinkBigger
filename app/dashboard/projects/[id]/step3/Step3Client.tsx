"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelCard } from "@/components/ui/PixelCard";
import { addDesire, deleteDesire, shareItem } from "../actions";
import { FaPlus, FaTrash, FaUser, FaUsers, FaShare } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { TriangleThreeWay } from "./TriangleChart";

type Desire = {
  id: string;
  type: 'self' | 'target' | 'third-party';
  content: string;
  authorId?: string;
  isShared?: boolean;
};

export default function Step3Client({
  projectId,
  desires,
  currentProfileId
}: {
  projectId: string;
  desires: Desire[];
  currentProfileId: string;
}) {
  const [selectedType, setSelectedType] = useState<Desire['type'] | null>('self');
  const [newDesire, setNewDesire] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');

  // Filter Desires based on Active Tab
  const tabDesires = desires.filter(d => {
    if (activeTab === 'personal') {
      return d.authorId === currentProfileId;
    } else {
      return d.isShared;
    }
  });

  const counts = {
    self: tabDesires.filter(d => d.type === 'self').length,
    target: tabDesires.filter(d => d.type === 'target').length,
    'third-party': tabDesires.filter(d => d.type === 'third-party').length,
  };

  const filteredDesires = tabDesires.filter(d => d.type === selectedType);

  const displayTitle = {
    self: "あなた",
    target: "ターゲット",
    'third-party': "第三者",
  };

  const displayDesc = {
    self: "この課題が解決されたら、あなたはどう感じますか？望みは何ですか？",
    target: "ターゲットはこの解決策に何を望んでいますか？逆に何を嫌がりますか？",
    'third-party': "直接の当事者以外（社会、同僚、家族など）はどう影響を受けますか？",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesire.trim() || !selectedType) return;
    setIsSubmitting(true);
    await addDesire(projectId, selectedType, newDesire);
    setNewDesire("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-6 pixel-border-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-[#f97316]">STEP 03</span> 要望分析
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            3つの視点から「望み」を洗い出しましょう。<br />
            三角形の各領域をクリックして切り替えてください。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => { setActiveTab('personal'); setSelectedType('self'); }} // Reset selection or keep? Keeping is fine usually
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Triangle Visualization */}
        <div className="flex justify-center py-8">
          <TriangleThreeWay
            onSelect={setSelectedType}
            selectedType={selectedType}
            counts={counts}
          />
        </div>

        {/* Right: List & Input */}
        <div>
          {selectedType ? (
            <PixelCard className="min-h-[400px] flex flex-col">
              <div className="mb-4 pb-4 border-b-2 border-stone-100">
                <h3 className="text-xl font-bold text-[#f97316] mb-1">{displayTitle[selectedType]}</h3>
                <p className="text-stone-500 text-sm">{displayDesc[selectedType]}</p>
                <div className="text-xs font-bold text-stone-400 mt-1">
                  {activeTab === 'personal' ? '自分のリスト' : 'チーム共有リスト'}
                </div>
              </div>

              <div className="flex-1 space-y-3 mb-6 overflow-y-auto max-h-[400px] pr-2">
                {filteredDesires.length === 0 ? (
                  <div className="text-center text-stone-300 py-10 font-bold">
                    NO DESIRES LISTED
                  </div>
                ) : (
                  filteredDesires.map(desire => (
                    <div key={desire.id} className="bg-stone-50 p-3 pixel-border-sm flex justify-between items-start group">
                      <span className="text-xs font-bold leading-relaxed">{desire.content}</span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {/* Share Button */}
                        {activeTab === 'personal' && !desire.isShared && (
                          <button
                            onClick={() => shareItem('desire', desire.id, projectId)}
                            className="text-blue-400 hover:text-blue-600 transition-colors"
                            title="チームに共有"
                          >
                            <FaShare size={12} />
                          </button>
                        )}
                        {/* Shared Indicator */}
                        {activeTab === 'personal' && desire.isShared && (
                          <span className="text-[10px] text-green-500 font-bold border border-green-200 px-1 rounded">Shared</span>
                        )}

                        <button
                          onClick={() => deleteDesire(desire.id, projectId)}
                          className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {activeTab === 'personal' && (
                <form onSubmit={handleSubmit} className="mt-auto flex gap-2">
                  <input
                    className="flex-1 bg-stone-50 pixel-border-sm px-3 py-2 focus:outline-none focus:bg-orange-50"
                    placeholder="望みや懸念を入力"
                    value={newDesire}
                    onChange={(e) => setNewDesire(e.target.value)}
                    autoFocus
                  />
                  <PixelButton type="submit" disabled={isSubmitting}>
                    <FaPlus />
                  </PixelButton>
                </form>
              )}
            </PixelCard>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 font-bold">
              SELECT A SECTION
            </div>
          )}
        </div>
      </div>
    </div >
  );
}
