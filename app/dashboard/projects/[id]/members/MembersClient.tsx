"use client";

import { useState } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { FaCopy, FaSearch, FaCheck, FaCrown } from "react-icons/fa";
import Link from "next/link";
import { searchUsers, addMember } from "../actions";
import { Avatar } from "@/components/project/Authorship";
import { useAction } from "@/components/ui/useAction";
import { Spinner } from "@/components/ui/Spinner";
import { useFeedback } from "@/components/ui/Feedback";

type Profile = { id: string; username: string; avatarUrl: string | null };
type Member = { id: string; role: string; profile: Profile };

export default function MembersClient({
  projectId,
  initialMembers,
  inviteCode,
}: {
  projectId: string;
  initialMembers: Member[];
  inviteCode: string;
}) {
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searched, setSearched] = useState(false);

  const { run, isBusy } = useAction();
  const { toast } = useFeedback();

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const inviteUrl = origin && inviteCode ? `${origin}/invite/${inviteCode}` : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast("招待リンクをコピーしました", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("コピーできませんでした。リンクを手動で選択してください", "error");
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) {
      toast("2文字以上で検索してください", "error");
      return;
    }
    run(
      async () => {
        setResults((await searchUsers(query)) as Profile[]);
        setSearched(true);
      },
      { key: "search" }
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white p-6 pixel-border-sm space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">MEMBERS</span> メンバー
        </h2>
        <p className="text-stone-600 text-sm">
          離れたメンバーは、招待リンクを開くだけで参加できます（アカウントが無い場合は登録後に自動で参加します）。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <PixelCard title="招待リンク">
            {inviteUrl ? (
              <>
                <p className="text-xs text-stone-500 mb-3">
                  このリンクを共有してください。チャットやメールに貼るだけで参加できます。
                </p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="flex-1 bg-stone-100 p-2 text-sm pixel-border-sm text-stone-600 min-w-0"
                  />
                  <PixelButton onClick={handleCopy} variant="secondary" className="shrink-0">
                    {copied ? <FaCheck className="text-emerald-600" /> : <FaCopy />}
                  </PixelButton>
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">
                このプロジェクトには招待コードが設定されていません。
              </p>
            )}
          </PixelCard>

          <PixelCard title="ユーザー名で追加">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <PixelInput
                placeholder="ユーザー名（2文字以上）"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1"
              />
              <PixelButton
                type="submit"
                disabled={isBusy("search")}
                className="shrink-0 flex items-center justify-center"
              >
                {isBusy("search") ? <Spinner size={12} /> : <FaSearch />}
              </PixelButton>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {results.map((user) => {
                const isMember = initialMembers.some((m) => m.profile.id === user.id);
                return (
                  <div key={user.id} className="flex justify-between items-center gap-3 p-2 bg-stone-50 pixel-border-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar author={user} size={32} />
                      <span className="font-bold text-sm truncate">{user.username}</span>
                    </div>
                    {isMember ? (
                      <span className="text-xs text-stone-400 font-bold px-2 shrink-0">参加済み</span>
                    ) : (
                      <PixelButton
                        onClick={() =>
                          run(() => addMember(projectId, user.id), {
                            key: `add-${user.id}`,
                            success: `${user.username} さんを追加しました`,
                          })
                        }
                        className="text-xs py-1 px-2 shrink-0 inline-flex items-center gap-1.5"
                        disabled={isBusy(`add-${user.id}`)}
                      >
                        {isBusy(`add-${user.id}`) && <Spinner size={9} />}
                        追加
                      </PixelButton>
                    )}
                  </div>
                );
              })}
              {searched && results.length === 0 && (
                <p className="text-center text-xs text-stone-400 py-4">
                  見つかりませんでした。招待リンクを送る方が確実です。
                </p>
              )}
            </div>
          </PixelCard>
        </div>

        <div>
          <h3 className="font-bold text-lg mb-4">参加メンバー（{initialMembers.length}）</h3>
          <div className="space-y-3">
            {initialMembers.map((member) => (
              <Link href={`/dashboard/profile/${member.profile.id}`} key={member.id} className="block group">
                <PixelCard className="flex items-center gap-4 p-4 transition-transform group-hover:-translate-y-1">
                  <Avatar author={member.profile} size={48} className="rounded-none" />
                  <div className="min-w-0">
                    <div className="font-bold text-lg group-hover:text-[#f97316] transition-colors truncate">
                      {member.profile.username}
                    </div>
                    <div className="text-xs font-bold tracking-wider flex items-center gap-1">
                      {member.role === "owner" ? (
                        <span className="text-orange-500 flex items-center gap-1">
                          <FaCrown /> OWNER
                        </span>
                      ) : (
                        <span className="text-stone-500">MEMBER</span>
                      )}
                    </div>
                  </div>
                </PixelCard>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
