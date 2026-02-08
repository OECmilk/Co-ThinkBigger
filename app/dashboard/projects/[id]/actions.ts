
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// MindMap Actions
export async function createMindMapNode(projectId: string, scope: 'team' | 'personal', label: string, x: number, y: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  const { data, error } = await supabase.from("MindMapNode").insert({
    projectId: Number(projectId), // Ensure projectId is number
    scope,
    label,
    positionX: x,
    positionY: y,
    authorId: profile.id
  }).select().single();

  if (error) console.error(error);
  revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
  return data;
}

export async function updateMindMapNodePosition(id: string, projectId: string, x: number, y: number) {
  const supabase = await createClient();
  await supabase.from("MindMapNode").update({ positionX: x, positionY: y, updatedAt: new Date().toISOString() }).eq("id", id);
  // Optional: revalidatePath might be too heavy for drag, usually client optimistic update is enough
  // revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
}

export async function updateMindMapNodeLabel(id: string, projectId: string, label: string) {
  const supabase = await createClient();
  await supabase.from("MindMapNode").update({ label, updatedAt: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
}

export async function deleteMindMapNode(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("MindMapNode").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
}

export async function createMindMapEdge(projectId: string, scope: 'team' | 'personal', sourceId: string, targetId: string, sourceHandle?: string | null, targetHandle?: string | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();

  if (!profile) throw new Error("Profile not found");

  await supabase.from("MindMapEdge").insert({
    projectId: Number(projectId),
    scope,
    sourceId,
    targetId,
    sourceHandle,
    targetHandle,
    authorId: profile.id
  });
  revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
}

export async function deleteMindMapEdge(id: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("MindMapEdge").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/mindmap`);
}

// ... Existing Actions ...

import { BADGES, Badge, BadgeType, getBadge } from "@/lib/badges";

// Helper to count unlockable achievements
async function checkAndUnlockAchievement(profileId: string, type: BadgeType, supabase: any, userId?: string) {
  let count = 0;
  if (type === 'CANDIDATE') {
    // If userId not provided, try to fetch from profile
    let uid = userId;
    if (!uid) {
      const { data: p } = await supabase.from('Profile').select('userId').eq('id', profileId).single();
      uid = p?.userId;
    }

    if (uid) {
      const { count: c } = await supabase.from('Candidate').select('id', { count: 'exact', head: true }).eq('authorId', uid);
      count = c || 0;
    }
  } else {
    // Choice, Solution, SubProblem use profileId
    const table = type === 'CHOICE' ? 'Choice' : 'Solution'; // We don't have badge for SubProblem yet in BADGE definitions? Actually only CANDIDATE, CHOICE, SOLUTION.
    const { count: c } = await supabase.from(table).select('id', { count: 'exact', head: true }).eq('authorId', profileId);
    count = c || 0;
  }

  // Check levels
  const levels = [1, 3, 5, 10, 15, 20];
  const unlockedLevels = levels.filter(l => count >= l);

  for (const level of unlockedLevels) {
    const badgeId = `${type}_${level}`;
    // Check exist
    const { data: existing } = await supabase.from('Achievement').select('id').eq('profileId', profileId).eq('badgeType', badgeId).single();
    if (!existing) {
      // Unlock!
      await supabase.from('Achievement').insert({
        profileId,
        badgeType: badgeId,
        unlockedAt: new Date().toISOString()
      });
    }
  }
}


export async function addCandidate(projectId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Get Profile ID
  const { data: profile } = await supabase
    .from("Profile")
    .select("id")
    .eq("userId", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  await supabase.from("Candidate").insert({
    projectId,
    title,
    authorId: user.id
  });

  await checkAndUnlockAchievement(profile.id, 'CANDIDATE', supabase, user.id);

  revalidatePath(`/dashboard/projects/${projectId}/step1`);
}




export async function rateCandidate(candidateId: string, projectId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  // Upsert score (because unique constraint is on candidateId, profileId)
  const { data: existing } = await supabase
    .from("Reaction")
    .select("id")
    .eq("candidateId", candidateId)
    .eq("profileId", profile.id)
    .single();

  if (existing) {
    await supabase.from("Reaction").update({ score }).eq("id", existing.id);
  } else {
    await supabase.from("Reaction").insert({
      candidateId,
      profileId: profile.id,
      score
    });
  }

  revalidatePath(`/dashboard/projects/${projectId}/step1`);
}

export async function updateCandidate(id: string, projectId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership or admin? Assuming owner only for simplicity or admin
  const { data: candidate } = await supabase.from("Candidate").select("authorId").eq("id", id).single();
  // We should strictly check authorId but for now let's allow if logged in and project member.
  // Actually, standard is author only.
  if (candidate?.authorId !== user.id) {
    // Check if user is project admin? Or just restrict.
    // Restrict to author for now.
    throw new Error("Only author can edit");
  }

  await supabase.from("Candidate").update({ title }).eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step1`);
}

export async function deleteCandidate(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: candidate } = await supabase.from("Candidate").select("authorId").eq("id", id).single();
  if (candidate?.authorId !== user.id) {
    throw new Error("Only author can delete");
  }

  await supabase.from("Candidate").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step1`);
}

export async function getProjectMemberCount(projectId: string) {
  // Returns count of members in the project
  const supabase = await createClient();
  const { count } = await supabase.from("ProjectMember").select("id", { count: 'exact', head: true }).eq("projectId", projectId);
  // Add 1 for the Owner if Project schema handles owner separately?
  // Schema check: ProjectMember contains all members? Usually owner is added to member table?
  // Let's assume yes. Data model usually has owner in ProjectMember too.
  return count || 1;
}

export async function setMainProblem(projectId: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Project").update({ description }).eq("id", projectId);

  // No revalidate needed for Step 1 per se, but good for Step 2
  revalidatePath(`/dashboard/projects/${projectId}/step2`);
}

export async function updateProjectDescription(projectId: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Project").update({ description }).eq("id", projectId);
  revalidatePath(`/dashboard/projects/${projectId}/step2`);
}

export async function addSubProblem(projectId: string, title: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  await supabase.from("SubProblem").insert({
    projectId,
    title,
    order: 0,
    authorId: profile.id,
    isShared: false
  });
  revalidatePath(`/dashboard/projects/${projectId}/step2`);
}

export async function deleteSubProblem(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("SubProblem").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step2`);
}

export async function shareItem(type: 'subProblem' | 'desire' | 'choice', id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const tableMap = {
    'subProblem': 'SubProblem',
    'desire': 'Desire',
    'choice': 'Choice'
  };

  await supabase.from(tableMap[type]).update({ isShared: true }).eq("id", id);

  // Revalidate appropriate path
  if (type === 'subProblem') revalidatePath(`/dashboard/projects/${projectId}/step2`);
  if (type === 'desire') revalidatePath(`/dashboard/projects/${projectId}/step3`);
  if (type === 'choice') revalidatePath(`/dashboard/projects/${projectId}/step4`);
}

export async function addDesire(projectId: string, type: 'self' | 'target' | 'third-party', content: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  await supabase.from("Desire").insert({
    projectId,
    type,
    content,
    authorId: profile.id,
    isShared: false
  });
  revalidatePath(`/dashboard/projects/${projectId}/step3`);
}

export async function deleteDesire(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Desire").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step3`);
}

export async function addChoice(subProblemId: string, projectId: string, title: string, isOutsideDomain: boolean, sourceURL?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();
  if (!profile) throw new Error("Profile not found");

  await supabase.from("Choice").insert({
    subProblemId,
    title,
    isOutsideDomain,
    sourceURL,
    authorId: profile.id,
    isShared: false
  });

  // Fetch profile for achievement - redundant fetch removed as we have it
  if (profile) await checkAndUnlockAchievement(profile.id, 'CHOICE', supabase);

  revalidatePath(`/dashboard/projects/${projectId}/step4`);
}

export async function deleteChoice(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Choice").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step4`);
}

// Helper to check for equality of components
function isSameComponents(a: Record<string, string>, b: any) {
  if (!b) return false;
  const keysA = Object.keys(a).sort();
  const keysB = Object.keys(b).sort();
  if (keysA.length !== keysB.length) return false;
  return keysA.every(key => a[key] === b[key]);
}

export async function saveSolution(projectId: string, name: string, description: string, components: Record<string, string>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check for duplicates
  const { data: existingSolutions } = await supabase
    .from("Solution")
    .select("components")
    .eq("projectId", projectId);

  const isDuplicate = existingSolutions?.some(sol => isSameComponents(components, sol.components));

  if (isDuplicate) {
    return { error: "この組み合わせは既に保存されています。" };
  }

  // Fetch profile for authorId and achievement
  const { data: profile } = await supabase.from("Profile").select("id").eq("userId", user.id).single();

  const { error } = await supabase.from("Solution").insert({
    projectId,
    name,
    description,
    components,
    authorId: profile?.id
  });

  if (error) throw error;

  if (profile) await checkAndUnlockAchievement(profile.id, 'SOLUTION', supabase);

  revalidatePath(`/dashboard/projects/${projectId}/step5`);
  return { success: true };
}

export async function updateSolution(id: string, projectId: string, name: string, description: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Solution").update({ name, description }).eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step5`);
}

export async function deleteSolution(id: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  await supabase.from("Solution").delete().eq("id", id);
  revalidatePath(`/dashboard/projects/${projectId}/step5`);
  revalidatePath(`/dashboard/projects/${projectId}/step6`); // Also affects evaluation step
}

export async function toggleEvaluation(solutionId: string, desireId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check existence
  const { data: existing } = await supabase
    .from("Evaluation")
    .select("id")
    .eq("solutionId", solutionId)
    .eq("desireId", desireId)
    .single();

  if (existing) {
    await supabase.from("Evaluation").delete().eq("id", existing.id);
  } else {
    await supabase.from("Evaluation").insert({
      solutionId,
      desireId,
      score: 1 // Default to 1 (Satisfied)
    });
  }
  revalidatePath(`/dashboard/projects/${projectId}/step6`);
}

// Members Management Actions
export async function getInviteCode(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("Project").select("inviteCode").eq("id", projectId).single();
  return data?.inviteCode;
}

export async function searchUsers(query: string) {
  if (!query || query.length < 2) return [];
  const supabase = await createClient();

  // Search by username or email (if visible?)
  // Assuming username search
  const { data } = await supabase
    .from("Profile")
    .select("id, username, avatarUrl")
    .ilike("username", `%${query}%`)
    .limit(5);

  return data || [];
}

export async function addMember(projectId: string, profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Check if already member
  const { data: existing } = await supabase
    .from("ProjectMember")
    .select("id")
    .eq("projectId", projectId)
    .eq("profileId", profileId)
    .single();

  if (existing) return { message: "すでにメンバーです" };

  await supabase.from("ProjectMember").insert({
    projectId,
    profileId,
    role: "member"
  });

  revalidatePath(`/dashboard/projects/${projectId}/members`);
  return { success: true };
}

export async function getContributionData(profileId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase.from('Profile').select('userId').eq('id', profileId).single();
  if (!profile) return {};

  const userId = profile.userId;

  const results = await Promise.all([
    supabase.from('Candidate').select('createdAt').eq('authorId', userId),
    supabase.from('SubProblem').select('createdAt').eq('authorId', profileId),
    supabase.from('Desire').select('createdAt').eq('authorId', profileId),
    supabase.from('Choice').select('createdAt').eq('authorId', profileId),
    supabase.from('Solution').select('createdAt').eq('authorId', profileId),
  ]);

  const map: Record<string, number> = {};

  const process = (items: any[], score: number) => {
    items.forEach(item => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      map[date] = Math.max(map[date] || 0, score);
    });
  };

  process(results[0].data || [], 2);
  process(results[1].data || [], 3);
  process(results[2].data || [], 3);
  process(results[3].data || [], 4);
  process(results[4].data || [], 5);

  return map;
}
