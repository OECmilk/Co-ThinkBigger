'use client';

import { useState } from 'react';
import { useProject } from '../providers/ProjectProvider';
import { IdeaEvaluation } from './IdeaEvaluation';

export function CombinationTable() {
  const { subProblems, selectedCombination, selectChoice, saveIdea, savedIdeas } = useProject();
  const [ideaName, setIdeaName] = useState('');
  // Show evaluation for specific saved idea ID
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  const isComplete = subProblems.length > 0 && subProblems.every(sp => selectedCombination[sp.id]);

  const handleRandomize = () => {
    subProblems.forEach(sp => {
      if (sp.choices.length > 0) {
        const randomChoice = sp.choices[Math.floor(Math.random() * sp.choices.length)];
        selectChoice(sp.id, randomChoice.id);
      }
    });
  };

  const handleSave = () => {
    if (!ideaName.trim() || !isComplete) return;
    saveIdea(ideaName, { ...selectedCombination });
    setIdeaName('');
    alert('アイデアを保存しました！下にスクロールして評価してください。');
    // Scroll or expand logic could go here
  };

  return (
    <div className="space-y-8">
      {/* Creation Area */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-end mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Step 5: 結合 (Combination)</h2>
            <p className="text-sm text-gray-600 mt-1">
              各列から1つずつ選択肢を選び、それらを組み合わせて新しいアイデアを創出します。
            </p>
          </div>
          <button
            onClick={handleRandomize}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all font-bold text-sm"
          >
            <span>🔮</span> ランダム選択
          </button>
        </div>

        {/* Slot Machine / Selection View */}
        <div className="overflow-x-auto pb-8">
          <div className="flex gap-4 min-w-max">
            {subProblems.map(sp => {
              const selectedId = selectedCombination[sp.id];
              return (
                <div key={sp.id} className="w-64 min-h-[300px] flex flex-col bg-gray-50 rounded-lg border-2 border-gray-200">
                  <div className="p-3 bg-gray-200 border-b border-gray-300 font-bold text-center text-gray-700 rounded-t-lg">
                    {sp.title}
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 max-h-[400px]">
                    {sp.choices.map(choice => (
                      <button
                        key={choice.id}
                        onClick={() => selectChoice(sp.id, choice.id)}
                        className={`w-full text-left p-3 rounded transition-all duration-200 border text-sm ${selectedId === choice.id
                          ? 'bg-orange-500 text-white shadow-md transform scale-100 ring-2 ring-orange-300 border-orange-600'
                          : `bg-white text-gray-600 hover:bg-gray-100 ${choice.isOutsideDomain ? 'border-l-4 border-l-green-500' : 'border-gray-200'}`
                          }`}
                      >
                        <div className="font-bold mb-0.5">{choice.text}</div>
                        {choice.isOutsideDomain && selectedId !== choice.id && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1 rounded">Outside</span>
                        )}
                      </button>
                    ))}
                    {sp.choices.length === 0 && (
                      <div className="text-center text-gray-400 text-xs py-10 italic">No choices</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Result & Save Area */}
        <div className={`mt-8 transition-all duration-500 ${isComplete ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4'}`}>
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-xl border border-orange-100 shadow-inner">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">
              💡 Your Big Idea Combination
            </h3>

            {isComplete ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {subProblems.map(sp => {
                    const choice = sp.choices.find(c => c.id === selectedCombination[sp.id]);
                    return (
                      <div key={sp.id} className={`flex flex-col p-2 rounded border ${choice?.isOutsideDomain ? 'bg-green-50 border-green-200' : 'bg-white border-orange-200'}`}>
                        <span className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">{sp.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-800">{choice?.text}</span>
                          {choice?.isOutsideDomain && <span className="text-[10px] bg-green-500 text-white px-1 rounded">Out</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-4 bg-white/50 rounded-lg flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      命名: この組み合わせに名前をつけましょう
                    </label>
                    <input
                      type="text"
                      value={ideaName}
                      onChange={(e) => setIdeaName(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:border-orange-500 focus:outline-none placeholder-gray-300"
                      placeholder="例: スマート・エコロジー・ハブ"
                    />
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={!ideaName.trim()}
                    className="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-400 disabled:opacity-50 hover:shadow-md transition-all"
                  >
                    インベントリに保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 italic text-sm">
                すべての構成要素からそれぞれ1つずつ選択して、アイデアを完成させてください。
                <br />
                迷ったら<span className="font-bold text-purple-600">ランダム選択</span>ボタンを押してみましょう！
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Evaluation List (Saved Ideas) */}
      {savedIdeas.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800 ml-2">🗂 アイデア・インベントリ</h3>
          {savedIdeas.map(idea => (
            <div key={idea.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 flex justify-between items-center"
                onClick={() => setExpandedIdeaId(expandedIdeaId === idea.id ? null : idea.id)}
              >
                <div>
                  <h4 className="text-lg font-bold text-gray-800">{idea.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">Click to evaluate</p>
                </div>
                <div className={`transform transition-transform ${expandedIdeaId === idea.id ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </div>

              {expandedIdeaId === idea.id && (
                <div className="border-t border-gray-100 p-6 pt-2 animation-in slide-in-from-top-2">
                  <IdeaEvaluation ideaId={idea.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
