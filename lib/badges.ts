
export type BadgeType = 'CANDIDATE' | 'CHOICE' | 'SOLUTION';

export interface Badge {
  id: string; // e.g. CANDIDATE_1
  type: BadgeType;
  level: number;
  label: string;
  description: string;
  icon: string; // Emoji for now, can be replaced with Image URL
  color: string;
}

const LEVELS = [1, 3, 5, 10, 15, 20];

// Define base configurations for each type
const CONFIG: Record<BadgeType, {
  labelBase: string,
  prefix: string,
  iconBase: string
}> = {
  CANDIDATE: { labelBase: '課題ハンター', prefix: 'CANDIDATE', iconBase: '🌱' },
  CHOICE: { labelBase: 'リサーチャー', prefix: 'CHOICE', iconBase: '🔍' },
  SOLUTION: { labelBase: '解決策クリエイター', prefix: 'SOLUTION', iconBase: '🚀' }
};

export const BADGES: Badge[] = [];

// Helper to generate color class based on level
const getColor = (type: BadgeType, level: number) => {
  // Orange for Candidate, Blue for Choice, Green for Solution?
  // User requested "Orange gradation" for the *grass* (contribution graph).
  // For cards, user said "Pixel art...".
  // Let's stick to distinct colors for types for now as per previous design, but maybe align with user preference if specified.
  // User: "Candidate count", "Choice count", "Solution count" -> 3 types.
  // "Orange gradation" was for the *contribution graph*.
  // For cards: "32*32bit dot art".
  // I will use emojis as placeholders for the dot art.

  if (type === 'CANDIDATE') return 'bg-orange-100 text-orange-700 border-orange-300';
  if (type === 'CHOICE') return 'bg-blue-100 text-blue-700 border-blue-300';
  if (type === 'SOLUTION') return 'bg-emerald-100 text-emerald-700 border-emerald-300';
  return 'bg-gray-100';
};

(Object.keys(CONFIG) as BadgeType[]).forEach(type => {
  const conf = CONFIG[type];
  LEVELS.forEach(level => {
    BADGES.push({
      id: `${conf.prefix}_${level}`,
      type: type,
      level: level,
      label: `${conf.labelBase} Lv.${level}`,
      description: `${level}個の${type === 'CANDIDATE' ? '課題' : type === 'CHOICE' ? '先行事例' : '解決策'}を${type === 'CANDIDATE' ? '発見' : type === 'CHOICE' ? '収集' : '提案'}しました`,
      icon: conf.iconBase,
      color: getColor(type, level)
    });
  });
});

export const getBadge = (id: string) => BADGES.find(b => b.id === id);
