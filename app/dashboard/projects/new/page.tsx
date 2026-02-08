"use client";

import { PixelCard } from "@/components/ui/PixelCard";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelButton } from "@/components/ui/PixelButton";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // 2. Get Profile (to link member)
    let { data: profile } = await supabase
      .from('Profile')
      .select('id')
      .eq('userId', user.id)
      .single();

    if (!profile) {
      // Profile fallback creation
      const { data: newProfile, error: createError } = await supabase
        .from('Profile')
        .insert({
          id: crypto.randomUUID(), // Explicit ID generation
          userId: user.id,
          username: user.user_metadata.username || user.email?.split('@')[0] || `user_${Math.random().toString(36).slice(2, 7)}`,
        })
        .select('id')
        .single();

      if (createError) {
        alert("プロフィールの作成に失敗しました: " + createError.message);
        setLoading(false);
        return;
      }
      profile = newProfile;
    }

    // 3. Create Project
    const { data: project, error: projectError } = await supabase
      .from('Project')
      .insert({
        // id is now auto-increment BigInt, do not provide UUID
        name,
        description,
        inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase()
      })
      .select()
      .single();

    if (projectError) {
      alert("Failed to create project: " + projectError.message);
      setLoading(false);
      return;
    }

    // 4. Add Creator as Admin Member
    const { error: memberError } = await supabase
      .from('ProjectMember')
      .insert({
        // id is now auto-increment BigInt
        projectId: project.id,
        profileId: profile.id,
        role: 'owner'
      });

    if (memberError) {
      alert("Failed to join project: " + memberError.message);
    } else {
      router.push(`/dashboard/projects/${project.id}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-stone-500 hover:text-[#f97316] mb-6 font-bold">
        <FaArrowLeft /> ダッシュボードに戻る
      </Link>

      <PixelCard title="新規プロジェクト作成">
        <form onSubmit={handleCreate} className="flex flex-col gap-6 pt-4">
          <PixelInput
            label="プロジェクト名"
            placeholder="例: 次世代コーヒーメーカー"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="flex flex-col gap-2">
            <label className="font-bold text-sm text-stone-600">概要・説明</label>
            <textarea
              className="bg-white pixel-border-sm px-4 py-2 focus:outline-none focus:bg-orange-50 min-h-[100px]"
              placeholder="解決したい中核的な課題は何ですか？"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-4 mt-4">
            <Link href="/dashboard">
              <PixelButton type="button" variant="secondary">キャンセル</PixelButton>
            </Link>
            <PixelButton type="submit" disabled={loading}>
              {loading ? "作成中..." : "プロジェクトを開始"}
            </PixelButton>
          </div>
        </form>
      </PixelCard>
    </div>
  );
}
