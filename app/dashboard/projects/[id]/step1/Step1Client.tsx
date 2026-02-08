
"use client";

import { useState } from "react";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelInput } from "@/components/ui/PixelInput";
import { PixelCard } from "@/components/ui/PixelCard";
import { addCandidate, rateCandidate, setMainProblem, updateCandidate, deleteCandidate } from "../actions";
import { FaPaperPlane, FaFire, FaRegCommentDots, FaCheckCircle, FaCrown, FaEdit, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "@/components/chat/ChatDrawer";
import { useRouter } from "next/navigation";

type Candidate = {
  id: string;
  title: string;
  authorId: string;
  createdAt: string;
  reactions: { score: number; profile: { username: string; id: string } }[];
  _count?: { messages: number };
};

export default function Step1Client({
  projectId,
  candidates,
  currentProfileId,
  currentUserId,
  totalMembers
}: {
  projectId: string;
  candidates: Candidate[];
  currentProfileId: string;
  currentUserId: string;
  totalMembers: number;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeChat, setActiveChat] = useState<{ id: string, title: string } | null>(null);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsSubmitting(true);
    await addCandidate(projectId, newTitle);
    setNewTitle("");
    setIsSubmitting(false);
  };

  const handleSetMain = async (title: string) => {
    if (confirm(`「${title}」をメイン課題として定義しますか？\n（Step 02に反映されます）`)) {
      await setMainProblem(projectId, title);
      router.push(`/dashboard/projects/${projectId}/step2`);
    }
  };

  const startEdit = (candidate: Candidate) => {
    setEditingId(candidate.id);
    setEditTitle(candidate.title);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = async (id: string) => {
    if (!editTitle.trim()) return;
    await updateCandidate(id, projectId, editTitle);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("本当に削除しますか？")) {
      await deleteCandidate(id, projectId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Introduction */}
      <div className="bg-white p-6 pixel-border-sm space-y-2">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="text-[#f97316]">STEP 01</span> 課題の候補
        </h2>
        <p className="text-stone-600 text-sm">
          まずは思いつく限りの「課題」を挙げてください。<br />
          5段階の炎で情熱を評価しましょう（チームメンバーの平均点が表示されます）。
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-4 items-end">
        <div className="flex-1">
          <PixelInput
            placeholder="課題を入力 (例: どうすれば...できるだろうか？)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-lg"
          />
        </div>
        <PixelButton type="submit" disabled={isSubmitting} className="h-[46px] px-8">
          <FaPaperPlane />
        </PixelButton>
      </form>

      {/* Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {candidates.map((candidate) => {
          const myRating = candidate.reactions.find(r => r.profile.id === currentProfileId)?.score || 0;
          const isAuthor = candidate.authorId === currentUserId;

          // Calculate Average
          const totalScore = candidate.reactions.reduce((sum, r) => sum + r.score, 0);
          const avgScore = candidate.reactions.length > 0 ? (totalScore / candidate.reactions.length).toFixed(1) : "0.0";

          // Calculate Participation Percentage for Border
          // totalMembers might differ if member left, but use current count.
          // reactions.length is # of distinct profiles who voted (assuming DB constraint).
          const participationRate = totalMembers > 0 ? (candidate.reactions.length / totalMembers) * 100 : 0;
          // conic-gradient(orange X%, #e7e5e4 X%)
          const borderStyle = {
            background: `conic-gradient(#f97316 0% ${participationRate}%, #e7e5e4 ${participationRate}% 100%)`
          };

          // Build tooltip text (who gave what score)
          const votersList = candidate.reactions.map(r => `${r.profile.username}: ${r.score}点`).join("\n");

          const isEditingThis = editingId === candidate.id;

          return (
            <PixelCard key={candidate.id} className="min-h-[200px] flex flex-col justify-between hover:bg-stone-50 transition-colors relative group">
              <div className="mb-4 pr-12">
                {isEditingThis ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full text-sm font-bold border-b-2 border-orange-500 focus:outline-none bg-transparent"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(candidate.id)} className="text-green-500 hover:text-green-700">
                      <FaSave />
                    </button>
                    <button onClick={cancelEdit} className="text-stone-400 hover:text-stone-600">
                      <FaTimes />
                    </button>
                  </div>
                ) : (
                  <h3 className="text-sm font-bold leading-relaxed break-words group-hover:text-stone-800">
                    {candidate.title}
                  </h3>
                )}
              </div>

              {/* Edit/Delete Actions (Only for Author) */}
              {isAuthor && !isEditingThis && (
                <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(candidate)} className="text-stone-300 hover:text-stone-500" title="編集">
                    <FaEdit />
                  </button>
                  <button onClick={() => handleDelete(candidate.id)} className="text-stone-300 hover:text-red-500" title="削除">
                    <FaTrash />
                  </button>
                </div>
              )}


              {/* Average Score Badge with Dynamic Border */}
              <div
                className="absolute top-4 right-4 flex items-center justify-center w-12 h-12 rounded-full"
                style={borderStyle} // Apply Conic Gradient here
                title={votersList}
              >
                {/* Inner White Circle */}
                <div className="w-[42px] h-[42px] bg-white rounded-full flex flex-col items-center justify-center">
                  <FaFire className={cn("text-xs", Number(avgScore) >= 3 ? "text-red-500" : "text-stone-400")} />
                  <span className="text-xs font-bold font-mono">{avgScore}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {/* Rating UI */}
                <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-stone-200">
                  <FaFire className="text-stone-300" /> {/* Gray Fire (Low) */}

                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(score => (
                      <button
                        key={score}
                        onClick={() => rateCandidate(candidate.id, projectId, score)}
                        className={cn(
                          "w-8 h-8 rounded pixel-border-sm font-bold text-sm transition-transform hover:scale-110",
                          myRating === score ? "bg-orange-500 text-white" : "bg-white hover:bg-orange-100"
                        )}
                      >
                        {score}
                      </button>
                    ))}
                  </div>

                  <FaFire className="text-red-500 animate-pulse" /> {/* Red Fire (High) */}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={() => setActiveChat({ id: candidate.id, title: candidate.title })}
                    className="flex items-center gap-1 text-stone-400 text-xs font-bold hover:text-[#f97316] transition-colors"
                  >
                    <FaRegCommentDots className="text-base" /> {candidate._count?.messages || 0}
                  </button>

                  <PixelButton
                    onClick={() => handleSetMain(candidate.title)}
                    variant="secondary"
                    className="flex items-center gap-1 px-2 py-1 text-xs"
                  >
                    <FaCrown className="text-yellow-500" /> メイン課題へ
                  </PixelButton>
                </div>
              </div>
            </PixelCard>
          );
        })}
      </div>

      <ChatDrawer
        isOpen={!!activeChat}
        onClose={() => setActiveChat(null)}
        projectId={projectId}
        candidateId={activeChat?.id}
        title={activeChat?.title || ""}
      />
    </div>
  );
}

