
'use client';

import { useState, useEffect } from 'react';
import { useProject, ProblemCandidate } from '../providers/ProjectProvider';
import { IoChatbubbleEllipsesOutline, IoFlame } from "react-icons/io5";

export function ProblemCandidates({ onNext }: { onNext?: () => void }) {
  const { candidates, addCandidate, removeCandidate, updateReaction, setProblemStatement, openChat } = useProject();
  const [inputText, setInputText] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string }>({ id: '', name: '' });

  useEffect(() => {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleAdd = () => {
    if (!inputText.trim()) return;
    addCandidate(inputText);
    setInputText('');
  };

  const handlePromote = (candidate: ProblemCandidate) => {
    // Set the global problem statement
    setProblemStatement(candidate.text);
    if (onNext) {
      onNext(); // Move to next step automatically
    }
  }

  // Sorting logic: Higher average passion first, then lower variance
  const sortedCandidates = [...candidates].sort((a, b) => {
    const getScore = (c: ProblemCandidate) => {
      const values = Object.values(c.reactions);
      if (values.length === 0) return 0;
      const sum = values.reduce((acc, v) => acc + v, 0);
      return sum / values.length; // Average
    };
    return getScore(b) - getScore(a);
  });

  // Helper for member colors
  const getMemberColor = (id: string) => {
    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const { members } = useProject(); // We need members list to map IDs to Names

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 md:p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Step 1: 課題の定義と選定</h2>
            <p className="text-sm text-gray-600 mt-1">
              質より「量」を意識して、課題候補をたくさん出しましょう。
            </p>
          </div>
        </div>

        {/* Dense Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="課題候補 (例: どうすれば...できるだろうか？)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={!inputText.trim()}
            className="px-4 py-2 bg-gray-800 text-white font-bold rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[40px]"
          >
            <span className="md:hidden text-lg">+</span>
            <span className="hidden md:inline">Add</span>
          </button>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedCandidates.map(candidate => {
            const myPassion = candidate.reactions[currentUser.id] || 0;
            const scores = Object.values(candidate.reactions);
            const average = scores.length
              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
              : "0.0";

            return (
              <div key={candidate.id} className="group relative bg-white p-3 rounded border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between min-h-[180px]">
                {/* Text */}
                <div className="overflow-y-auto mb-2 scrollbar-thin scrollbar-thumb-gray-200 flex-grow max-h-24">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight">{candidate.text}</h3>
                </div>

                {/* Footer area */}
                <div className="mt-auto pt-2 border-t border-gray-50 flex-shrink-0">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-xs text-gray-400 font-mono">Avg: <span className="text-orange-600 font-bold">{average}</span></span>
                    <button
                      onClick={() => openChat('candidate', candidate.id)}
                      className="text-gray-400 hover:text-orange-500 transition-colors p-1"
                      title="Chat about this challenge"
                    >
                      <IoChatbubbleEllipsesOutline size={18} />
                    </button>
                    <button
                      onClick={() => handlePromote(candidate)}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 font-medium"
                    >
                      決定
                    </button>
                  </div>

                  {/* Voting Area */}
                  <div className="relative">
                    {/* Scale Title/Guide for first item maybe? Or just global legend... let's separate guides locally for now as requested */}

                    <div className="flex justify-between items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map(level => {
                        // Who voted this level?
                        const voters = Object.entries(candidate.reactions)
                          .filter(([uid, val]) => val === level)
                          .map(([uid]) => members.find(m => m.id === uid))
                          .filter(Boolean);

                        return (
                          <div key={level} className="flex-1 flex flex-col items-center gap-0.5">
                            {/* Member Dots */}
                            <div className="h-2 flex -space-x-1 justify-center mb-0.5 w-full">
                              {voters.map((m, idx) => (
                                <div
                                  key={m?.id || idx}
                                  className={`w-2 h-2 rounded-full border border-white ${getMemberColor(m?.id || "")}`}
                                  title={m?.name}
                                />
                              ))}
                            </div>

                            <button
                              onClick={() => updateReaction(candidate.id, currentUser.id, level)}
                              className={`w-full h-8 text-[10px] rounded flex items-center justify-center transition-colors ${myPassion === level
                                ? 'bg-orange-500 text-white font-bold shadow-sm'
                                : 'bg-gray-50 text-gray-300 hover:bg-orange-100'
                                }`}
                            >
                              {level}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Visual Guide <--> */}
                    <div className="flex justify-between items-center px-1 opacity-50 text-[10px] text-gray-400">
                      <div className="flex items-center gap-0.5" title="無関心">
                        <span className="text-gray-400"><IoFlame size={10} /></span>
                        <span className="scale-75 origin-left">無</span>
                      </div>
                      <div className="h-[1px] bg-gray-200 flex-1 mx-2"></div>
                      <div className="flex items-center gap-0.5 text-orange-500" title="情熱">
                        <span className="scale-75 origin-right font-bold">情熱</span>
                        <span><IoFlame size={14} /></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeCandidate(candidate.id)}
                  className="absolute -top-1.5 -right-1.5 bg-white rounded-full w-5 h-5 flex items-center justify-center border shadow-sm opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs z-10"
                >
                  ×
                </button>
              </div>
            );
          })}
          {candidates.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded">
              候補がありません。たくさん出しましょう！
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
