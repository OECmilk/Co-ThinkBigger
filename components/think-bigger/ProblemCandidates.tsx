'use client';

import { useState } from 'react';
import { useProject, ProblemCandidate } from '../providers/ProjectProvider';

// Debug tools removed.
// In real app, we get current user from context.
const CURRENT_USER_ID = 'current-user';

export function ProblemCandidates({ onNext }: { onNext?: () => void }) {
  const { candidates, addCandidate, removeCandidate, updateReaction, setProblemStatement } = useProject();
  const [inputText, setInputText] = useState('');
  const [perspectiveUser, setPerspectiveUser] = useState(CURRENT_USER_ID);

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

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
            className="px-4 py-2 bg-gray-800 text-white font-bold rounded text-sm hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Compact Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {sortedCandidates.map(candidate => {
            const myPassion = candidate.reactions[perspectiveUser] || 0;
            const scores = Object.values(candidate.reactions);
            const average = scores.length
              ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
              : "0.0";

            return (
              <div key={candidate.id} className="group relative bg-white p-3 rounded border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between h-40">
                {/* Text */}
                <div className="overflow-y-auto mb-2 scrollbar-thin scrollbar-thumb-gray-200">
                  <h3 className="text-sm font-semibold text-gray-800 leading-tight">{candidate.text}</h3>
                </div>

                {/* Footer area */}
                <div className="mt-auto pt-2 border-t border-gray-50">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs text-gray-400 font-mono">Avg: <span className="text-orange-600 font-bold">{average}</span></span>
                    <button
                      onClick={() => handlePromote(candidate)}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 font-medium"
                    >
                      決定
                    </button>
                  </div>

                  {/* Tiny Gauge */}
                  <div className="flex justify-between items-center gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        onClick={() => updateReaction(candidate.id, perspectiveUser, level)}
                        className={`flex-1 h-6 text-[10px] rounded flex items-center justify-center transition-colors ${myPassion === level
                          ? 'bg-orange-500 text-white font-bold'
                          : 'bg-gray-50 text-gray-300 hover:bg-orange-100'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
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
