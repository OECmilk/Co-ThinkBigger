'use client';

import { useProject, SavedIdea, DesireCategory } from '../providers/ProjectProvider';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export function IdeaEvaluation({ ideaId }: { ideaId: string }) {
  const { savedIdeas, desires, rateIdea } = useProject();
  const idea = savedIdeas.find(i => i.id === ideaId);

  if (!idea) return <div className="text-red-500">Idea not found</div>;

  // Prepare data for Radar Chart
  // We want to aggregate scores by category? Or show all individual desires?
  // The book suggests satisfying desires from all 3 categories.
  // Let's create an aggregate score for each category.

  const categories: DesireCategory[] = ['self', 'target', 'third-party'];

  const chartData = categories.map(cat => {
    const catDesires = desires.filter(d => d.category === cat);
    if (catDesires.length === 0) return { subject: cat, A: 0, fullMark: 10 };

    // Sum of ratings for this category
    const currentSum = catDesires.reduce((acc, d) => acc + (idea.ratings[d.id] || 0), 0);
    // Max possible score = 5 * number of desires
    const maxScore = catDesires.length * 5;

    // Normalize to 0-10 scale for chart? Or just use raw percentage?
    // Let's use 0-100 scale
    const score = maxScore > 0 ? (currentSum / maxScore) * 100 : 0;

    // Label mapping
    const labels = { self: '自分', target: '相手', 'third-party': '第三者' };

    return {
      subject: labels[cat],
      A: score,
      fullMark: 100
    };
  });

  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Rating List */}
        <div className="flex-1 space-y-4">
          <h4 className="font-bold text-gray-700 border-b pb-2">このアイデアは「望み」を叶えていますか？</h4>
          {categories.map(cat => {
            const catDesires = desires.filter(d => d.category === cat);
            if (catDesires.length === 0) return null;

            return (
              <div key={cat} className="mb-4">
                <h5 className="text-xs font-bold uppercase text-gray-500 mb-2">{cat} Needs</h5>
                <div className="space-y-2">
                  {catDesires.map(desire => (
                    <div key={desire.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-100">
                      <span className="flex-1 mr-2">{desire.text}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            onClick={() => rateIdea(idea.id, desire.id, val)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] transition-colors ${(idea.ratings[desire.id] || 0) >= val
                                ? 'bg-orange-400 text-white'
                                : 'bg-gray-100 text-gray-300'
                              }`}
                          >
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Radar Chart */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm p-4">
          <h4 className="font-bold text-gray-800 mb-2">Desire Balance</h4>
          <div className="w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Idea Score"
                  dataKey="A"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-400 mt-2">
            3つの頂点が大きくバランス良く広がっているほど、<br />優れた「Think Bigger」なアイデアです。
          </p>
        </div>
      </div>
    </div>
  );
}
