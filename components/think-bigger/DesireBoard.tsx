'use client';

import { useState } from 'react';
import { useProject, DesireCategory } from '../providers/ProjectProvider';

export function DesireBoard() {
  const { problemStatement, desires, addDesire, removeDesire } = useProject();
  const [inputs, setInputs] = useState<Record<DesireCategory, string>>({
    self: '',
    target: '',
    'third-party': ''
  });

  const getDesiresByCategory = (cat: DesireCategory) => desires.filter(d => d.category === cat);

  const handleAdd = (cat: DesireCategory) => {
    if (!inputs[cat].trim()) return;
    addDesire(inputs[cat], cat);
    setInputs(prev => ({ ...prev, [cat]: '' }));
  };

  const categories: { key: DesireCategory; label: string; desc: string; color: string }[] = [
    { key: 'self', label: '自分 (Self)', desc: 'なぜこの課題を解決したい？心からの動機は？', color: 'bg-blue-50 border-blue-200' },
    { key: 'target', label: 'ターゲット (Target)', desc: 'ユーザーや顧客は何を望んでいる？痛みの裏返しは？', color: 'bg-green-50 border-green-200' },
    { key: 'third-party', label: '第三者 (Third Party)', desc: '社会、地球、その他のステークホルダーへの影響は？', color: 'bg-purple-50 border-purple-200' },
  ];

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
        <h2 className="text-xl font-bold mb-4 text-gray-800">Step 3: 望みの洗い出し (Desire Mapping)</h2>
        <p className="mb-8 text-sm text-gray-600">
          課題解決において重要となる3つの視点から、それぞれの「本質的な望み」を洗い出します。<br />
          ここでの望みが、後のアイデア評価の基準（コンパス）になります。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div key={cat.key} className={`rounded-xl border p-4 ${cat.color}`}>
              <h3 className="font-bold text-lg text-gray-800 mb-2">{cat.label}</h3>
              <p className="text-xs text-gray-500 mb-4 h-10">{cat.desc}</p>

              {/* List */}
              <div className="space-y-2 mb-4 min-h-[200px]">
                {getDesiresByCategory(cat.key).map(idea => (
                  <div key={idea.id} className="relative group bg-white p-2 rounded border border-gray-200 shadow-sm text-sm">
                    {idea.text}
                    <button
                      onClick={() => removeDesire(idea.id)}
                      className="absolute top-1 right-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputs[cat.key]}
                  onChange={e => setInputs(prev => ({ ...prev, [cat.key]: e.target.value }))}
                  placeholder="望みを入力..."
                  className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded focus:border-orange-500 focus:outline-none"
                  onKeyDown={e => e.key === 'Enter' && handleAdd(cat.key)}
                />
                <button
                  onClick={() => handleAdd(cat.key)}
                  disabled={!inputs[cat.key].trim()}
                  className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
