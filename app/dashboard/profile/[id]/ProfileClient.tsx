"use client";

import { useState, useRef, useEffect } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { FaEdit, FaSave, FaCamera, FaEnvelope, FaBriefcase, FaUser, FaMedal } from "react-icons/fa";
import { updateProfile } from "../actions"; // Keep locally
import { BADGES, normalizeBadgeId, type BadgeType } from "@/lib/badges";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ContributionGraph } from "@/components/ContributionGraph";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";

type Profile = {
  id: string;
  username: string;
  avatarUrl: string | null;
  jobTitle: string | null; // From DB, but we override display
  // bio removed
};

type Achievement = {
  id: string;
  badgeType: string;
  unlockedAt: string;
};

const BADGE_TYPES: BadgeType[] = ["CANDIDATE", "SUBPROBLEM", "DESIRE", "CHOICE", "SOLUTION"];

export function ProfileClient({
  profile,
  achievements,
  contributionData,
  isOwner,
  email
}: {
  profile: Profile;
  achievements: Achievement[];
  contributionData: Record<string, number>;
  isOwner: boolean;
  email?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(profile.username);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { run, isPending } = useAction();
  const { toast } = useFeedback();

  // 旧 ID（FIRST_CANDIDATE など）で保存された実績も同じバッジとして数える
  const unlockedIds = new Set((achievements || []).map((a) => normalizeBadgeId(a.badgeType)));
  const unlockedAtById = new Map(
    (achievements || []).map((a) => [normalizeBadgeId(a.badgeType), a.unlockedAt])
  );

  // 肩書きは、いちばんレベルの高い獲得済みバッジ
  const jobTitle =
    BADGES.filter((b) => unlockedIds.has(b.id)).sort((a, b) => b.level - a.level)[0]?.label ?? "Newcomer";

  const handleSave = () => {
    run(
      async () => {
        await updateProfile(profile.id, username, avatarUrl || undefined);
        setIsEditing(false);
      },
      { success: "プロフィールを更新しました" }
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `avatars/${profile.id}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadError) {
      toast(`画像のアップロードに失敗しました: ${uploadError.message}`, "error");
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(filePath);

    setAvatarUrl(publicUrl);
    // アップロードしただけで保存されたと誤解しないよう、その場で保存まで済ませる
    run(() => updateProfile(profile.id, username, publicUrl), { success: "アイコンを更新しました" });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header / Info Section */}
      <PixelCard className="relative p-8">
        {isOwner && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 text-stone-400 hover:text-stone-800 transition-colors"
          >
            <FaEdit size={20} />
          </button>
        )}

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar Section */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded bg-stone-200 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-4xl text-stone-400 font-bold relative pixel-border-sm">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile.username[0]?.toUpperCase()
              )}

              {/* Overlay for upload */}
              {isOwner && isEditing && (
                <div
                  className="absolute inset-0 bg-black/50 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCamera size={24} />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          {/* Info Section */}
          <div className="flex-1 space-y-4 text-center md:text-left w-full">
            {isEditing ? (
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="text-xs font-bold text-stone-500 mb-1 block">ユーザー名</label>
                  <PixelInput
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                {/* Job Title is read-only even in edit mode */}
                <div>
                  <label className="text-xs font-bold text-stone-500 mb-1 block">肩書き (実績により自動付与)</label>
                  <div className="text-stone-600 font-bold px-3 py-2 bg-stone-100 rounded border border-stone-200">
                    <FaBriefcase className="inline mr-2 text-stone-400" />
                    {jobTitle}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <PixelButton variant="secondary" onClick={() => setIsEditing(false)}>キャンセル</PixelButton>
                  <PixelButton onClick={handleSave} disabled={isPending} className="inline-flex items-center gap-2">
                    {isPending ? <Spinner size={12} /> : <FaSave />} 保存
                  </PixelButton>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h1 className="text-3xl font-bold text-stone-800 mb-1">{profile.username}</h1>
                  <p className="text-stone-500 font-bold flex items-center justify-center md:justify-start gap-2">
                    <FaMedal className="text-orange-400" />
                    {jobTitle}
                  </p>
                </div>

                {isOwner && email && (
                  <div className="inline-block bg-stone-100 px-3 py-1 rounded text-xs text-stone-600 font-mono pixel-border-sm">
                    <span className="flex items-center gap-2">
                      <FaEnvelope /> {email}
                    </span>
                  </div>
                )}

                {/* Contribution Graph */}
                <div className="mt-6 pt-4 border-t-2 border-dashed border-stone-200 w-full">
                  <ContributionGraph data={contributionData} />
                </div>
              </>
            )}
          </div>
        </div>
      </PixelCard>

      {/* Achievements Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">ACHIEVEMENTS</span> 獲得した実績
        </h2>

        {/*
          全 30 個を並べるとロック済みの灰色タイルばかりになって逆に萎える。
          種類ごとに「今の到達点」と「次に狙えるもの」だけを見せる。
        */}
        <div className="space-y-4">
          {BADGE_TYPES.map((type) => {
            const tiers = BADGES.filter((b) => b.type === type);
            const earned = tiers.filter((b) => unlockedIds.has(b.id));
            const highest = earned[earned.length - 1];
            const next = tiers.find((b) => !unlockedIds.has(b.id));
            const shown = [highest, next].filter(Boolean) as typeof tiers;
            if (shown.length === 0) return null;

            return (
              <div key={type} className="bg-white pixel-border-sm p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="font-bold text-sm">
                    {tiers[0].icon} {tiers[0].label.replace(/ Lv\.\d+$/, "")}
                  </span>
                  <span className="text-[11px] font-bold text-stone-500">
                    {earned.length} / {tiers.length} 段階
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shown.map((badge) => {
                    const isUnlocked = unlockedIds.has(badge.id);
                    const at = unlockedAtById.get(badge.id);
                    const isNew = !!at && Date.now() - new Date(at).getTime() < 60000;

                    return (
                      <div
                        key={badge.id}
                        className={cn(
                          "p-3 flex items-center gap-3 pixel-border-sm relative",
                          isUnlocked ? badge.color : "bg-stone-100 text-stone-400",
                          isNew && "ring-2 ring-yellow-400"
                        )}
                      >
                        <span className={cn("text-2xl", !isUnlocked && "grayscale opacity-60")}>{badge.icon}</span>
                        <span className="min-w-0">
                          <span className="block font-bold text-xs leading-tight">{badge.label}</span>
                          <span className="block text-[10px] opacity-80 leading-tight">{badge.description}</span>
                        </span>
                        {isUnlocked && (
                          <span className="absolute top-1 right-1 text-[8px] font-bold bg-white/80 px-1 text-stone-600">
                            GET
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
