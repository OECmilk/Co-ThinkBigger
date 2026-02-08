"use client";

import { useState, useEffect } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelCard } from "@/components/ui/PixelCard";
import { toggleEvaluation } from "../actions";
import { cn } from "@/lib/utils";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend
} from 'recharts';

type Desire = {
  id: string;
  type: 'self' | 'target' | 'third-party';
  content: string;
};

type Evaluation = {
  desireId: string;
  score: number;
};

type Solution = {
  id: string;
  name: string;
  evaluations: Evaluation[];
};

export default function Step6Client({
  projectId,
  desires,
  solutions
}: {
  projectId: string;
  desires: Desire[];
  solutions: Solution[];
}) {
  const [selectedSolutionId, setSelectedSolutionId] = useState<string | null>(solutions[0]?.id || null);

  const selectedSolution = solutions.find(s => s.id === selectedSolutionId) || solutions[0] || null;

  // Calculate Scores
  const calculateData = (solution: Solution) => {
    const scores = {
      self: { total: 0, satisfied: 0 },
      target: { total: 0, satisfied: 0 },
      'third-party': { total: 0, satisfied: 0 },
    };

    desires.forEach(d => {
      scores[d.type].total += 1;
      const isSatisfied = solution.evaluations?.some(e => e.desireId === d.id);
      if (isSatisfied) scores[d.type].satisfied += 1;
    });

    return [
      {
        subject: 'あなた',
        A: scores.self.total > 0 ? (scores.self.satisfied / scores.self.total) * 100 : 0,
        fullMark: 100
      },
      {
        subject: '第三者',
        A: scores['third-party'].total > 0 ? (scores['third-party'].satisfied / scores['third-party'].total) * 100 : 0,
        fullMark: 100
      },
      {
        subject: 'ターゲット',
        A: scores.target.total > 0 ? (scores.target.satisfied / scores.target.total) * 100 : 0,
        fullMark: 100
      },
    ];
  };

  const chartData = selectedSolution ? calculateData(selectedSolution) : [];

  const getScore = (type: Desire['type']) => {
    if (!selectedSolution) return "0/0";
    const total = desires.filter(d => d.type === type).length;
    const satisfied = desires.filter(d => d.type === type && selectedSolution.evaluations?.some(e => e.desireId === d.id)).length;
    const percent = total > 0 ? Math.round((satisfied / total) * 100) : 0;
    return `${percent}% (${satisfied}/${total})`;
  }



  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 pixel-border-sm space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">STEP 06</span> 解決策の評価
        </h2>
        <p className="text-stone-600 text-sm">
          解決策が各ステークホルダーの要望をどれだけ満たしているかチェックしましょう。<br />
          三角形が大きいほど、優れた解決策と言えます。
        </p>
      </div>

      {solutions.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-stone-300 rounded pixel-border-sm text-stone-400">
          まだ評価する解決策がありません。STEP 5で解決策を作成してください。
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: Evaluation Form */}
          {/* Left: Solution Selection & Evaluation Form */}
          <div className="space-y-6">
            {/* Solution List */}
            <div className="space-y-2">
              <label className="font-bold text-sm text-stone-500 block">評価する解決策を選択</label>
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                {solutions.map(s => (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSolutionId(s.id)}
                    className={cn(
                      "p-3 rounded pixel-border-sm cursor-pointer transition-all border-l-4",
                      selectedSolutionId === s.id
                        ? "bg-orange-50 border-orange-500 shadow-sm"
                        : "bg-white border-stone-200 hover:bg-stone-50"
                    )}
                  >
                    <div className="font-bold text-sm">{s.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSolution && (
              <PixelCard>
                <div className="space-y-6">
                  {['self', 'target', 'third-party'].map((type) => {
                    const typeDesires = desires.filter(d => d.type === type);
                    const titleMap = { self: "あなた", target: "ターゲット", 'third-party': "第三者" };

                    return (
                      <div key={type}>
                        <div className="flex justify-between items-center mb-2 pb-1 border-b border-stone-100">
                          <h4 className="font-bold text-[#f97316]">{titleMap[type as Desire['type']]}</h4>
                          <span className="text-xs font-bold bg-stone-100 px-2 py-1 rounded">
                            Score: {getScore(type as Desire['type'])}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {typeDesires.map(d => {
                            const isChecked = selectedSolution.evaluations?.some(e => e.desireId === d.id);
                            return (
                              <div
                                key={d.id}
                                onClick={() => toggleEvaluation(selectedSolution.id, d.id, projectId)}
                                className={cn(
                                  "p-3 rounded pixel-border-sm cursor-pointer transition-colors flex items-start gap-3 select-none",
                                  isChecked ? "bg-orange-50 border-orange-200" : "bg-white hover:bg-stone-50"
                                )}
                              >
                                <div className={cn(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                                  isChecked ? "bg-orange-500 border-orange-500 text-white" : "border-stone-300"
                                )}>
                                  {isChecked && "✓"}
                                </div>
                                <span className={cn("text-sm", isChecked ? "font-bold text-stone-800" : "text-stone-500")}>
                                  {d.content}
                                </span>
                              </div>
                            );
                          })}
                          {typeDesires.length === 0 && (
                            <p className="text-xs text-stone-400">要望がリストアップされていません (STEP 3)</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </PixelCard>
            )}
          </div>

          {/* Right: Radar Chart */}
          <div className="bg-white p-4 pixel-border-sm flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="font-bold text-lg mb-4">評価スコアチャート</h3>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                  <PolarGrid gridType="polygon" stroke="#e7e5e4" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#292524', fontSize: 14, fontWeight: 'bold' }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar
                    name={selectedSolution?.name}
                    dataKey="A"
                    stroke="#f97316"
                    strokeWidth={3}
                    fill="#f97316"
                    fillOpacity={0.4}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-xs text-stone-500 mt-4 max-w-sm">
              三角形の面積が大きいほど、3つの視点すべての要望を満たす優れたアイデアです。
            </p>
          </div>
        </div>
      )
      }
    </div >
  );
}
