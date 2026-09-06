import { getSupabase } from "@/lib/auth";

/**
 * プロジェクトのメンバーに「誰が・どこで・何をしたか」を届ける。
 *
 * 非同期で離れて作業する以上、他のメンバーの動きは
 * 本人が見にいかない限り気づけない。ここが唯一の通知の入口。
 *
 * migration_v2_collaboration.sql をまだ実行していない環境でも
 * 通知そのものは落とさず動くよう、拡張列が無い場合は
 * 基本列だけで書き込み直す（列不足エラー = Postgres 42703）。
 */

let extendedColumnsAvailable: boolean | null = null;

type NotifyInput = {
  projectId: string;
  /** 通知を発生させた本人。この人には送らない。 */
  actorProfileId: string | null;
  title: string;
  content: string;
  /** クリック時の遷移先 */
  link: string;
};

export async function notifyProjectMembers({
  projectId,
  actorProfileId,
  title,
  content,
  link,
}: NotifyInput) {
  try {
    const supabase = await getSupabase();

    const { data: members } = await supabase
      .from("ProjectMember")
      .select("profileId")
      .eq("projectId", projectId);

    const recipients = (members || [])
      .map((m: any) => String(m.profileId))
      .filter((id) => id !== String(actorProfileId));

    if (recipients.length === 0) return;

    const base = recipients.map((profileId) => ({
      profileId,
      title,
      content,
      type: "in-app",
      read: false,
    }));

    if (extendedColumnsAvailable !== false) {
      const { error } = await supabase.from("Notification").insert(
        base.map((row) => ({ ...row, link, projectId, actorId: actorProfileId }))
      );

      if (!error) {
        extendedColumnsAvailable = true;
        return;
      }
      if (error.code !== "42703") {
        console.error("[notify] insert failed", error);
        return;
      }
      // 拡張列が無い環境。以降は基本列だけで送る。
      extendedColumnsAvailable = false;
    }

    const { error } = await supabase.from("Notification").insert(base);
    if (error) console.error("[notify] fallback insert failed", error);
  } catch (e) {
    // 通知は補助機能。失敗しても本体の操作は成立させる。
    console.error("[notify] unexpected", e);
  }
}
