-- update_reaction_table.sql

-- Reactionテーブルの emoji カラムを score (INTEGER) に変更する
-- 既存のデータは削除する（型変換が複雑なため）

ALTER TABLE "Reaction" DROP COLUMN "emoji";
ALTER TABLE "Reaction" ADD COLUMN "score" INTEGER NOT NULL DEFAULT 1 CHECK (score >= 1 AND score <= 5);

-- ユニーク制約の再作成
-- 旧: unique(candidateId, profileId, emoji)
-- 新: unique(candidateId, profileId)  <-- 1ユーザーにつき1つの評価のみ
ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS "Reaction_candidateId_profileId_emoji_key";
CREATE UNIQUE INDEX "Reaction_candidateId_profileId_key" ON "Reaction"("candidateId", "profileId");
