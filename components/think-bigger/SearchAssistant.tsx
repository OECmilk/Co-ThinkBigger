'use client';

import { useState } from 'react';
import { useProject } from '../providers/ProjectProvider';

interface SearchAssistantProps {
  subProblemId: string;
  subProblemTitle: string;
  onClose: () => void;
}

export function SearchAssistant({ subProblemId, subProblemTitle, onClose }: SearchAssistantProps) {
  const { addSearchQuery } = useProject();
  const [activeTab, setActiveTab] = useState<'general' | 'partial' | 'parallel'>('general');
  const [query, setQuery] = useState('');

  const strategies = {
    general: {
      label: '🌏 汎用検索 (General)',
      desc: '課題を抽象化して、より広い分野から解決策を探します。',
      example: '例: 「算数嫌いの子どもをやる気にさせるには？」→「子供の学習意欲を高めるには？」',
      color: 'bg-blue-50 border-blue-200 text-blue-800'
    },
    partial: {
      label: '🧩 部分検索 (Partial)',
      desc: '課題を構成する特定の「部分」や「要素」にフォーカスします。',
      example: '例: 「算数嫌いの子どもをやる気にさせるには？」→「楽しくないことをやらせるには？」',
      color: 'bg-orange-50 border-orange-200 text-orange-800'
    },
    parallel: {
      label: '👯 並行検索 (Parallel)',
      desc: '似たような構造や課題を持つ、全く別の分野を探します。',
      example: '例: 「算数嫌いの子どもをやる気にさせるには？」→「子供に体によいものを食べさせるには？」',
      color: 'bg-green-50 border-green-200 text-green-800'
    }
  };

  const handleSave = () => {
    if (!query.trim()) return;
    addSearchQuery(subProblemId, activeTab, query);
    setQuery('');
    // Optionally close or stay to add more
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-800">🔍 問い直しアシスタント</h3>
            <p className="text-sm text-gray-500 mt-1">
              課題: <span className="font-bold text-gray-700">{subProblemTitle}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(Object.keys(strategies) as Array<keyof typeof strategies>).map(key => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === key
                ? 'border-gray-800 text-gray-800 bg-white'
                : 'border-transparent text-gray-400 bg-gray-50 hover:bg-gray-100'
                }`}
            >
              {strategies[key].label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          <div className={`p-4 rounded-lg mb-6 border ${strategies[activeTab].color}`}>
            <h4 className="font-bold mb-2">{strategies[activeTab].desc}</h4>
            <p className="text-sm opacity-80">{strategies[activeTab].example}</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              あなたの課題で問い直してみましょう:
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="新しい問いを入力..."
              className="w-full text-lg px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-800 focus:outline-none"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg"
            >
              閉じる
            </button>
            <button
              onClick={handleSave}
              disabled={!query.trim()}
              className="px-6 py-2 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              問いを保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
