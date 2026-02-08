"use client";

import { useState, useRef, useEffect } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { FaEdit, FaSave, FaCamera, FaEnvelope, FaBriefcase, FaUser, FaMedal } from "react-icons/fa";
import { updateProfile } from "../actions"; // Keep locally
import { BADGES, Badge } from "@/lib/badges";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ContributionGraph } from "@/components/ContributionGraph";
import Image from "next/image";

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
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive Job Title from Achievements
  const getJobTitle = () => {
    if (!achievements || achievements.length === 0) return "Newcomer";

    // Sort badges by level (priority)
    const unlockedBadges = BADGES.filter(b =>
      achievements.some(a => a.badgeType === b.id)
    ).sort((a, b) => b.level - a.level);

    if (unlockedBadges.length > 0) {
      return unlockedBadges[0].label; // Highest level badge as title
    }
    return "Newcomer";
  };

  const jobTitle = getJobTitle();

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile(profile.id, username, avatarUrl || undefined);
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    // Upload to Supabase
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${profile.id}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars') // Bucket name
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError);
      alert('Upload failed: ' + uploadError.message); // Simple feedback
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    setAvatarUrl(publicUrl);
    // Auto-save avatar when uploaded? Or wait for save button?
    // User expects interaction. Let's force save or just update state.
    // If we update state, user must click Save.
    // But preview updates.
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
                  <PixelButton onClick={handleSave} disabled={isSaving}>
                    <FaSave /> 保存
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {BADGES.map(badge => {
            const achievement = achievements.find(a => a.badgeType === badge.id);
            const isUnlocked = !!achievement;

            // Animation logic: if newly unlocked (e.g. within 1 minute of render), adding logic relies on persistent state or time check.
            // Client side time check:
            const isNew = isUnlocked && (new Date().getTime() - new Date(achievement.unlockedAt).getTime() < 60000);

            return (
              <div
                key={badge.id}
                className={cn(
                  "p-2 flex flex-col items-center justify-center text-center gap-2 pixel-border-sm transition-all h-[140px] relative overflow-hidden",
                  isUnlocked
                    ? `bg-white ${badge.color} border-b-4` // unlocked
                    : "bg-stone-100 text-stone-400 grayscale opacity-70", // locked
                  isNew && "animate-pulse ring-2 ring-yellow-400"
                )}
              >
                <div className="text-3xl mb-1">{badge.icon}</div>
                <h3 className="font-bold text-xs leading-tight min-h-[2.5em] flex items-center justify-center">{badge.label}</h3>
                <p className="text-[9px] opacity-80 leading-tight">{badge.description}</p>
                {isUnlocked && (
                  <span className="absolute top-1 right-1 text-[8px] font-bold bg-white/80 px-1 rounded text-stone-600">
                    GET
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
