"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { addChoice, deleteChoice, shareItem } from "../actions";
import { FaPlus, FaTrash, FaGlobe, FaStar, FaUser, FaUsers, FaShare } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { SearchGuide } from "./SearchGuide";
import { PixelCard } from "@/components/ui/PixelCard";

type Choice = {
  id: string;
  subProblemId: string;
  title: string;
  sourceURL?: string | null;
  isOutsideDomain: boolean;
  authorId?: string;
  isShared?: boolean;
};

type SubProblem = {
  id: string;
  title: string;
  choices: Choice[];
};

export default function Step4Client({
  projectId,
  subProblems,
  currentProfileId
}: {
  projectId: string;
  subProblems: SubProblem[];
  currentProfileId: string;
}) {
  const [addingTo, setAddingTo] = useState<string | null>(null); // subProblemId
  const [newTitle, setNewTitle] = useState("");
  const [isOutside, setIsOutside] = useState(false);
  const [newURL, setNewURL] = useState("");
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('personal');

  const handleAdd = async (e: React.FormEvent, subProblemId: string) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    await addChoice(subProblemId, projectId, newTitle, isOutside, newURL);
    setNewTitle("");
    setNewURL("");
    setIsOutside(false);
    setAddingTo(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 pixel-border-sm space-y-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="text-[#f97316]">STEP 04</span> 選択マップ
          </h2>
          <p className="text-stone-600 text-sm mt-2">
            分解したサブ課題それぞれに対し、解決策となる「先行事例」を集めましょう。<br />
            特に「<span className="text-purple-600 font-bold">領域外</span>」の事例を集めることが重要です。
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
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
      </div>

      <SearchGuide />

      {/* Choice Map Table */}
      <div className="overflow-x-auto pb-4">
        <table className="w-full border-collapse min-w-[800px]">
          <thead className="bg-stone-800 text-white">
            <tr>
              <th className="p-4 text-left w-[200px] border-r-2 border-stone-600 pixel-border-sm sticky left-0 z-10 bg-stone-800">
                サブ課題
              </th>
              <th className="p-4 text-left">
                先行事例 - {activeTab === 'personal' ? '自分のリスト' : '共有リスト'}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {subProblems.map((sub, idx) => {
              // Filter Choices
              const filteredChoices = sub.choices.filter(c => {
                if (activeTab === 'personal') return c.authorId === currentProfileId;
                return c.isShared;
              });

              return (
                <tr key={sub.id} className={idx % 2 === 0 ? "bg-white" : "bg-stone-50"}>
                  <td className="p-4 font-bold border-r-2 border-stone-200 align-top sticky left-0 bg-inherit z-10 pixel-border-sm">
                    {sub.title}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-4 items-start">
                      {filteredChoices.map(choice => (
                        <div
                          key={choice.id}
                          className={cn(
                            "relative group p-3 pr-6 rounded pixel-border-sm w-[160px] bg-white",
                            choice.isOutsideDomain ? "border-l-4 border-purple-500" : ""
                          )}
                        >
                          <p className="font-bold text-xs mb-1 break-words leading-tight">{choice.title}</p>
                          {choice.sourceURL && (
                            <a
                              href={choice.sourceURL}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
                            >
                              <FaGlobe /> リンク
                            </a>
                          )}

                          <div className="absolute top-1 right-1 flex flex-col gap-1 items-end">
                            <button
                              onClick={() => deleteChoice(choice.id, projectId)}
                              className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTrash size={12} />
                            </button>

                            {/* Share Button */}
                            {activeTab === 'personal' && !choice.isShared && (
                              <button
                                onClick={() => shareItem('choice', choice.id, projectId)}
                                className="text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="チームに共有"
                              >
                                <FaShare size={12} />
                              </button>
                            )}
                          </div>

                          {/* Shared Indicator */}
                          {activeTab === 'personal' && choice.isShared && (
                            <div className="mt-1">
                              <span className="text-[9px] text-green-600 font-bold bg-green-50 px-1 border border-green-200 rounded">Shared</span>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Add Button - Only in Personal Tab */}
                      {activeTab === 'personal' && (
                        addingTo === sub.id ? (
                          <div className="w-[160px] p-2 bg-white pixel-border-sm z-20">
                            <form onSubmit={(e) => handleAdd(e, sub.id)} className="space-y-1">
                              <input
                                className="w-full text-xs font-bold border-b border-stone-300 focus:outline-none focus:border-orange-500 py-1"
                                placeholder="事例タイトル"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                autoFocus
                              />
                              <input
                                className="w-full text-xs text-stone-500 border-b border-stone-300 focus:outline-none py-1"
                                placeholder="URL (optional)"
                                value={newURL}
                                onChange={e => setNewURL(e.target.value)}
                              />
                              <div className="flex justify-between items-center pt-1">
                                <label className="flex items-center gap-1 text-[10px] cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isOutside}
                                    onChange={e => setIsOutside(e.target.checked)}
                                  />
                                  <span className={isOutside ? "text-purple-600 font-bold" : "text-stone-500"}>領域外</span>
                                </label>
                                <div className="flex gap-1">
                                  <button type="button" onClick={() => setAddingTo(null)} className="text-[10px] text-stone-400 hover:text-stone-600">✕</button>
                                  <button type="submit" disabled={!newTitle} className="text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded font-bold">追加</button>
                                </div>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingTo(sub.id)}
                            className="min-h-[64px] w-[160px] flex flex-col items-center justify-center border-2 border-dashed border-stone-300 text-stone-400 hover:text-orange-500 hover:border-orange-500 hover:bg-orange-50 transition-colors rounded pixel-border-sm p-2"
                          >
                            <FaPlus />
                            <span className="text-xs font-bold mt-1">追加</span>
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {subProblems.length === 0 && (
              <tr>
                <td colSpan={2} className="p-8 text-center text-stone-400">
                  まだサブ課題がありません。<br />STEP 2に戻って課題を分解してください。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
