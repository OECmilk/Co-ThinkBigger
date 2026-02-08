import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PixelCard } from "@/components/ui/PixelCard";
import { FaTrophy, FaLightbulb, FaFlagCheckered, FaRocket, FaSearch, FaStar } from "react-icons/fa";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { PixelButton } from "@/components/ui/PixelButton";

const BADGES = [
  { id: 'FIRST_CANDIDATE', title: 'アイデアの種', desc: '初めて課題候補を投稿した', icon: FaLightbulb, color: 'text-yellow-500' },
  { id: 'FIRST_REACTION', title: 'サポーター', desc: '初めてリアクションを送った', icon: FaStar, color: 'text-orange-500' },
  { id: 'FIRST_SOLUTION', title: '創造主', desc: '初めて解決策を作成した', icon: FaRocket, color: 'text-purple-500' },
  { id: 'FIRST_CHOICE', title: '探求者', desc: '初めて先行事例を登録した', icon: FaSearch, color: 'text-blue-500' },
];

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("Profile")
    .select(`
      *,
      achievements:Achievement(badgeType, unlockedAt)
    `)
    .eq("userId", user.id)
    .single();

  if (!profile) return <div>Profile not found</div>;

  const unlockedTypes = profile.achievements.map((a: any) => a.badgeType);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <PixelButton variant="outline" className="text-xs">← GO BACK</PixelButton>
        </Link>
        <h1 className="text-2xl font-bold">MY PROFILE</h1>
      </div>

      <PixelCard className="flex flex-col md:flex-row items-center gap-6 p-8">
        <div className="w-24 h-24 bg-stone-200 pixel-border flex items-center justify-center text-4xl font-bold text-stone-400">
          {profile.avatarUrl ? <img src={profile.avatarUrl} className="w-full h-full object-cover" /> : profile.username[0]}
        </div>
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-bold">{profile.username}</h2>
          <p className="text-stone-500">{profile.email || user.email}</p>
          <p className="font-bold text-[#f97316] flex items-center justify-center md:justify-start gap-2">
            <FaTrophy /> {profile.achievements.length} Achievements
          </p>
        </div>
      </PixelCard>

      <div className="space-y-4">
        <h3 className="font-bold text-stone-800 text-xl border-b-4 border-stone-800 pb-2 inline-block">BADGES</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {BADGES.map(badge => {
            const isUnlocked = unlockedTypes.includes(badge.id);
            return (
              <div key={badge.id} className={cn(
                "flex flex-col items-center text-center p-4 min-h-[160px] transition-all",
                isUnlocked ? "bg-white pixel-border-sm" : "bg-stone-100 opacity-60 grayscale pixel-border-sm border-dashed"
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 pixel-border-sm",
                  isUnlocked ? "bg-white " + badge.color : "bg-stone-300 text-stone-500"
                )}>
                  {isUnlocked ? <badge.icon /> : "?"}
                </div>
                <h4 className="font-bold text-sm mb-1">{badge.title}</h4>
                <p className="text-xs text-stone-500 leading-tight">
                  {isUnlocked ? badge.desc : "Locked"}
                </p>
                {isUnlocked && (
                  <span className="text-[10px] text-stone-400 mt-auto pt-2">
                    UNLOCKED
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
