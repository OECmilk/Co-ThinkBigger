'use client';

import { useState } from 'react';
import { useProject } from '../providers/ProjectProvider';

export function DeconstructionBoard() {
  const { problemStatement, subProblems, addSubProblem, updateSubProblem, removeSubProblem } = useProject();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addSubProblem(newTitle);
    setNewTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Selected Problem Context */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg shadow-sm">
        <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wide mb-1">Main Challenge</h4>
        <p className="text-lg font-bold text-gray-800">
          {problemStatement || <span className="text-gray-400 italic">メイン課題が未設定です。Step 1に戻って選定してください。</span>}
        </p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Step 2: 課題を分解する</h2>
            <p className="text-gray-600 mt-2 text-sm">
              メイン課題を解決するための構成要素を分解します。<br />
              <span className="text-orange-600 font-bold">重要:</span> 単語ではなく、「〜するには？ (How might we?)」という形式で書いてください。
            </p>
          </div>
          <div className="bg-gray-100 px-3 py-1 rounded text-xs text-gray-600">
            要素数: <span className="font-bold text-orange-600">{subProblems.length}</span>/6
          </div>
        </div>

        {/* Input Area */}
        <form onSubmit={handleAdd} className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="サブ課題を入力... (例: どのようにすればコストを削減できるか？)"
              className="w-full pl-4 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={subProblems.length >= 6}
            />
          </div>
          <button
            type="submit"
            disabled={!newTitle.trim() || subProblems.length >= 6}
            className="px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            追加
          </button>
        </form>

        {/* List of Sub-problems */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subProblems.map((sp) => (
            <div key={sp.id} className="group relative bg-gray-50 border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              <textarea
                value={sp.title}
                onChange={(e) => updateSubProblem(sp.id, e.target.value)}
                className="w-full bg-transparent font-semibold text-lg border-b border-transparent focus:border-orange-500 focus:outline-none mb-2 resize-none h-20"
                placeholder="〜するには？"
              />
              <p className="text-xs text-gray-400">
                現在の選択肢: {sp.choices.length}個
              </p>

              <button
                onClick={() => removeSubProblem(sp.id)}
                className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                title="削除"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}

          {subProblems.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
              「どのようにすれば...できるか？」という形式で<br />分解した要素を追加してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
