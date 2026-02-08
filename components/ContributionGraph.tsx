'use client';

// Contribution Graph Component
// Displays user activity for the last year in a GitHub-style grid (rows=7 days, cols=weeks).

export function ContributionGraph({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const yearAgo = new Date();
  yearAgo.setFullYear(today.getFullYear() - 1);

  // Generate all days for the last 365 days
  const requests: { date: string; score: number }[] = [];
  // Align start date to Sunday for proper grid alignment
  // Start from 52 weeks ago (approx)
  // Let's just create a list of days and let CSS masking/overflow handle usage?
  // GitHub shows exactly 52-53 weeks. 
  // Let's identify the start date: roughly 365 days ago.

  // Calculate start date (Sunday 52 weeks ago)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 365);
  // Adjust to previous Sunday
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  // Generate days until today
  const currentDate = new Date(startDate);
  const days: { date: string; score: number; month: number }[] = [];

  while (currentDate <= today) {
    const dateStr = currentDate.toLocaleDateString('en-CA'); // YYYY-MM-DD
    days.push({
      date: dateStr,
      score: data[dateStr] || 0,
      month: currentDate.getMonth()
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }

  const getColor = (score: number) => {
    if (score >= 5) return 'bg-orange-600 border-orange-700'; // Solution
    if (score === 4) return 'bg-orange-500 border-orange-600'; // Choice
    if (score === 3) return 'bg-orange-400 border-orange-500'; // Desire/SubProblem
    if (score === 2) return 'bg-orange-300 border-orange-400'; // Candidate
    // score 1 would be login
    return 'bg-stone-100 border-stone-200'; // Empty
  };

  // Generate Month Labels
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Create a list of month labels and their approximate column index
  const monthLabels: { label: string; col: number }[] = [];
  let currentMonth = -1;
  days.forEach((day, index) => {
    // Index corresponds to Day Index.
    // Column index = Math.floor(index / 7)
    if (day.month !== currentMonth) {
      const col = Math.floor(index / 7);
      // Avoid duplicate labels for same column or too close?
      // GitHub logic is complex, simple one: if new month detected at row 0 (Sunday)?
      // Let's just push every month change and filter overlaps.
      if (monthLabels.length === 0 || monthLabels[monthLabels.length - 1].col !== col) {
        monthLabels.push({ label: months[day.month], col });
      }
      currentMonth = day.month;
    }
  });

  return (
    <div className="w-full overflow-x-auto pb-2">
      <h3 className="font-bold text-sm text-stone-600 mb-2 flex items-center gap-2">
        <span>CONTRIBUTIONS</span>
        <span className="text-xs text-stone-400 font-normal">Last 1 Year</span>
      </h3>

      <div className="min-w-fit">
        {/* Month Labels */}
        <div className="flex text-[10px] text-stone-400 mb-1 relative h-4 w-full">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              style={{ left: `${m.col * 10}px` }} // 10px approx width of cell + gap (w-2 + gap-0.5 = 8px + 2px = 10px) 
              className="absolute"
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-1">
          {/* Day Labels (Mon, Wed, Fri only usually) */}
          <div className="flex flex-col gap-[2px] text-[8px] text-stone-400 mr-1 pt-[10px]">
            <div className="h-2"></div>
            <div className="h-2 flex items-center">Mon</div>
            <div className="h-2"></div>
            <div className="h-2 flex items-center">Wed</div>
            <div className="h-2"></div>
            <div className="h-2 flex items-center">Fri</div>
            <div className="h-2"></div>
          </div>

          {/* The Grid: grid-rows-7, grid-flow-col */}
          <div className="grid grid-rows-7 grid-flow-col gap-[2px]">
            {days.map(day => (
              <div
                key={day.date}
                title={`${day.date}: Level ${day.score}`}
                className={`w-2 h-2 rounded-[1px] ${getColor(day.score)} transition-colors hover:brightness-110 tooltip`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 items-center text-[10px] text-stone-400 mt-2 justify-end">
        <span>Less</span>
        <div className="flex gap-[2px]">
          <div className="w-2 h-2 bg-stone-100 border border-stone-200"></div>
          <div className="w-2 h-2 bg-orange-300 border border-orange-400"></div>
          <div className="w-2 h-2 bg-orange-400 border border-orange-500"></div>
          <div className="w-2 h-2 bg-orange-500 border border-orange-600"></div>
          <div className="w-2 h-2 bg-orange-600 border border-orange-700"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
