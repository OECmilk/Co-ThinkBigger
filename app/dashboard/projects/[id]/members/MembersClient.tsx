"use client";

import { useState } from "react";
import { PixelCard } from "@/components/ui/PixelCard";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { FaCopy, FaUserPlus, FaSearch, FaCheck } from "react-icons/fa";
import { searchUsers, addMember } from "../actions";

type Profile = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

type Member = {
  id: string;
  role: string;
  profile: Profile;
};

export default function MembersClient({
  projectId,
  initialMembers,
  inviteCode
}: {
  projectId: string;
  initialMembers: Member[];
  inviteCode: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/invite/${inviteCode}` : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results as Profile[]);
    setIsSearching(false);
  };

  const handleAddMember = async (profileId: string) => {
    await addMember(projectId, profileId);
    // Optimistic update or refresh? For simplicity, we assume generic revalidate handles it on router refresh?
    // Or just reload.
    window.location.reload();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="bg-white p-6 pixel-border-sm space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">MEMBERS</span> メンバー管理
        </h2>
        <p className="text-stone-600 text-sm">
          プロジェクトのメンバーを管理します。招待リンクを共有して仲間を増やしましょう。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Invite Link */}
        <div className="space-y-4">
          <PixelCard title="招待リンク">
            <p className="text-xs text-stone-500 mb-2">
              以下のリンクを知り合いに共有してください。アカウントがない場合は新規登録後に自動参加します。
            </p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteUrl}
                className="flex-1 bg-stone-100 p-2 text-sm pixel-border-sm text-stone-600"
              />
              <PixelButton onClick={handleCopy} variant="secondary">
                {copied ? <FaCheck /> : <FaCopy />}
              </PixelButton>
            </div>
          </PixelCard>

          <PixelCard title="ユーザー検索・追加">
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <PixelInput
                placeholder="ユーザー名で検索"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <PixelButton type="submit" disabled={isSearching}>
                <FaSearch />
              </PixelButton>
            </form>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map(user => {
                  const isMember = members.some(m => m.profile.id === user.id);
                  return (
                    <div key={user.id} className="flex justify-between items-center p-2 bg-stone-50 pixel-border-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-stone-200 rounded-full overflow-hidden">
                          {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" /> : null}
                        </div>
                        <span className="font-bold text-sm">{user.username}</span>
                      </div>
                      {isMember ? (
                        <span className="text-xs text-stone-400 font-bold px-2">参加済み</span>
                      ) : (
                        <PixelButton onClick={() => handleAddMember(user.id)} className="text-xs py-1 px-2">
                          追加
                        </PixelButton>
                      )}
                    </div>
                  );
                })
              ) : (
                searchQuery && !isSearching && <p className="text-center text-xs text-stone-400">見つかりませんでした</p>
              )}
            </div>
          </PixelCard>
        </div>

        {/* Member List */}
        <div>
          <h3 className="font-bold text-lg mb-4">参加メンバー ({members.length})</h3>
          <div className="space-y-3">
            {members.map(member => (
              <a href={`/dashboard/profile/${member.profile.id}`} key={member.id} className="block group">
                <PixelCard className="flex items-center gap-4 p-4 transition-transform group-hover:-translate-y-1">
                  <div className="w-12 h-12 bg-stone-200 pixel-border-sm flex items-center justify-center text-xl font-bold text-stone-400 overflow-hidden">
                    {member.profile.avatarUrl ? (
                      <img src={member.profile.avatarUrl} className="w-full h-full object-cover" />
                    ) : (
                      member.profile.username[0]
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-lg group-hover:text-[#f97316] transition-colors">{member.profile.username}</div>
                    <div className="text-xs text-stone-500 uppercase font-bold tracking-wider">
                      {member.role === 'owner' ? <span className="text-orange-500">OWNER</span> : "MEMBER"}
                    </div>
                  </div>
                </PixelCard>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
