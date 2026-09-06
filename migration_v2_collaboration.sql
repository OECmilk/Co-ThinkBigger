-- ============================================================
-- CO-THINK BIGGER / migration v2
--   目的: 「挫折なく遂行する」「離れたメンバーと難なく取り組める」
--   Supabase の SQL Editor で全文を実行してください。
--   すべて冪等（何度実行しても安全）です。
-- ============================================================

-- ------------------------------------------------------------
-- 1. Solution.authorId
--    これが無いまま app 側が INSERT していたため、
--    STEP 5 の「解決策の保存」が常に失敗していた。
-- ------------------------------------------------------------
ALTER TABLE "Solution"
  ADD COLUMN IF NOT EXISTS "authorId" UUID REFERENCES "Profile"("id") ON DELETE SET NULL;


-- ------------------------------------------------------------
-- 2. Notification に遷移先を持たせる
--    離れたメンバーが「どこで何が起きたか」に1クリックで行けるようにする。
-- ------------------------------------------------------------
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "link"      TEXT;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "projectId" BIGINT REFERENCES "Project"("id") ON DELETE CASCADE;
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "actorId"   UUID   REFERENCES "Profile"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "Notification_profileId_createdAt_idx"
  ON "Notification"("profileId", "createdAt" DESC);


-- ------------------------------------------------------------
-- 3. ステップごとの議論スレッド
--    これまで STEP 2 だけが持っていたプロジェクトチャットを
--    全ステップに分ける。既存メッセージは STEP 2 の議論として引き継ぐ。
-- ------------------------------------------------------------
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "step" TEXT;

UPDATE "Message"
   SET "step" = 'step2'
 WHERE "candidateId" IS NULL
   AND "projectId" IS NOT NULL
   AND "step" IS NULL;

CREATE INDEX IF NOT EXISTS "Message_projectId_step_idx"
  ON "Message"("projectId", "step", "createdAt");


-- ------------------------------------------------------------
-- 4. 共有の取り消しに備えた既定値の明示
--    （列は add_personal_team_columns.sql で作成済み。念のため冪等に）
-- ------------------------------------------------------------
ALTER TABLE "SubProblem" ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Desire"     ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Choice"     ADD COLUMN IF NOT EXISTS "isShared" BOOLEAN NOT NULL DEFAULT false;


-- ------------------------------------------------------------
-- 5. 一覧クエリ用のインデックス
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Candidate_projectId_idx"     ON "Candidate"("projectId");
CREATE INDEX IF NOT EXISTS "SubProblem_projectId_idx"    ON "SubProblem"("projectId");
CREATE INDEX IF NOT EXISTS "Desire_projectId_idx"        ON "Desire"("projectId");
CREATE INDEX IF NOT EXISTS "Solution_projectId_idx"      ON "Solution"("projectId");
CREATE INDEX IF NOT EXISTS "Choice_subProblemId_idx"     ON "Choice"("subProblemId");
CREATE INDEX IF NOT EXISTS "Evaluation_solutionId_idx"   ON "Evaluation"("solutionId");
CREATE INDEX IF NOT EXISTS "ProjectMember_profileId_idx" ON "ProjectMember"("profileId");


-- ------------------------------------------------------------
-- 6. リアルタイム配信の有効化
--    誰かの追加・共有が、他のメンバーの画面にリロード無しで届くようにする。
-- ------------------------------------------------------------
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'Candidate','Reaction','SubProblem','Desire','Choice',
    'Solution','Evaluation','Message','Notification','ProjectMember','Project'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
