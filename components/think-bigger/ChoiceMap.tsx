'use client';

import { useState } from 'react';
import { useProject } from '../providers/ProjectProvider';
import { SearchAssistant } from './SearchAssistant';

interface ChoiceForm {
  text: string;
  description: string;
  isOutsideDomain: boolean;
}

export function ChoiceMap() {
  const { subProblems, addChoice, removeChoice } = useProject();

  // Local state
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [searchTarget, setSearchTarget] = useState<string | null>(null); // subProblemId to show assistant for

  const [form, setForm] = useState<ChoiceForm>({ text: '', description: '', isOutsideDomain: false });

  const resetForm = () => setForm({ text: '', description: '', isOutsideDomain: false });

  const openAdd = (subProblemId: string) => {
    setAddingTo(subProblemId);
    resetForm();
  }

  const cancelAdd = () => {
    setAddingTo(null);
    resetForm();
  }

  const handleAddChoice = () => {
    if (!addingTo || !form.text.trim()) return;

    addChoice(addingTo, {
      text: form.text,
      description: form.description,
      isOutsideDomain: form.isOutsideDomain,
      source: 'User Input'
    });
    setAddingTo(null);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {searchTarget && (
        <SearchAssistant
          subProblemId={searchTarget}
          subProblemTitle={subProblems.find(sp => sp.id === searchTarget)?.title || ''}
          onClose={() => setSearchTarget(null)}
        />
      )}

      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Step 4: 選択マップ (Choice Map)</h2>
        <p className="mb-6 text-sm text-gray-600">
          各構成要素に対して、既存の解決策を選択肢として洗い出しましょう。<br />
          <span className="text-green-600 font-bold">「領域外」</span>の事例は、革新的なアイデアの源泉になります。
        </p>

        {/* Matrix View */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {subProblems.map(sp => (
              <div key={sp.id} className="w-80 flex flex-col bg-gray-50 rounded-lg p-4 border border-gray-200">
                {/* Column Header */}
                <div className="mb-4 pb-2 border-b border-gray-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{sp.title}</h3>
                    <button
                      onClick={() => setSearchTarget(sp.id)}
                      className="text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 flex items-center gap-1 whitespace-nowrap"
                      title="問い直しヒント"
                    >
                      🔍 問い直し
                    </button>
                  </div>

                  {/* Search Queries Display */}
                  {sp.searchQueries.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {sp.searchQueries.map((q, idx) => (
                        <div key={idx} className="text-[10px] bg-yellow-50 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-100 truncate max-w-full" title={q.query}>
                          {q.query}
                        </div>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-gray-400">{sp.choices.length} choices</span>
                </div>

                {/* Choices List */}
                <div className="flex-1 space-y-3 mb-4 max-h-[500px] overflow-y-auto pr-2">
                  {sp.choices.map(choice => (
                    <div
                      key={choice.id}
                      className={`group relative bg-white p-3 rounded shadow-sm border-l-4 transition-all hover:shadow-md ${choice.isOutsideDomain
                          ? 'border-green-500 bg-green-50/30'
                          : 'border-blue-400'
                        }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-gray-800 text-sm">{choice.text}</h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${choice.isOutsideDomain ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                          {choice.isOutsideDomain ? 'Outside' : 'Inside'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {choice.description || <span className="text-gray-300 italic">No details...</span>}
                      </p>
                      <button
                        onClick={() => removeChoice(sp.id, choice.id)}
                        className="absolute top-1 right-1 -mt-1 -mr-1 p-1 bg-white rounded-bl shadow-sm text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {sp.choices.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4 italic">No choices yet</p>
                  )}
                </div>

                {/* Add Button & Form */}
                <div className="mt-auto">
                  {addingTo === sp.id ? (
                    <div className="bg-white p-3 rounded border shadow-lg animate-in fade-in zoom-in-95 duration-200">
                      <div className="mb-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Title (一言で)</label>
                        <input
                          autoFocus
                          type="text"
                          value={form.text}
                          onChange={e => setForm({ ...form, text: e.target.value })}
                          className="w-full text-sm border-b border-gray-300 focus:border-orange-500 focus:outline-none py-1"
                          placeholder="例: マクドナルド"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Why? (有効な点)</label>
                        <textarea
                          rows={2}
                          value={form.description}
                          onChange={e => setForm({ ...form, description: e.target.value })}
                          className="w-full text-xs border border-gray-200 rounded p-1 focus:border-orange-500 focus:outline-none resize-none"
                          placeholder="早い、安い、どこでも同じ味..."
                        />
                      </div>
                      <div className="mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.isOutsideDomain}
                            onChange={e => setForm({ ...form, isOutsideDomain: e.target.checked })}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <span className="text-xs font-medium text-gray-600">領域外の事例 (Outside Domain)</span>
                        </label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={cancelAdd} className="text-xs text-gray-500 hover:underline">Cancel</button>
                        <button
                          onClick={handleAddChoice}
                          disabled={!form.text.trim()}
                          className="px-3 py-1 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => openAdd(sp.id)}
                      className="w-full py-2 bg-gray-100 text-gray-500 rounded border border-dashed border-gray-300 hover:bg-white hover:border-orange-400 hover:text-orange-500 transition-colors text-sm font-bold"
                    >
                      + Add Choice
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {subProblems.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              Step 2で構成要素を追加してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
