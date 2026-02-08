-- Clean up duplicates before adding unique index
DELETE FROM "Reaction"
WHERE id NOT IN (
    SELECT MIN(id)
    FROM "Reaction"
    GROUP BY "candidateId", "profileId"
);

-- Then recreate the constraints
ALTER TABLE "Reaction" DROP COLUMN IF EXISTS "emoji";
ALTER TABLE "Reaction" ADD COLUMN IF NOT EXISTS "score" INTEGER NOT NULL DEFAULT 1 CHECK (score >= 1 AND score <= 5);

ALTER TABLE "Reaction" DROP CONSTRAINT IF EXISTS "Reaction_candidateId_profileId_emoji_key";
DROP INDEX IF EXISTS "Reaction_candidateId_profileId_key";
CREATE UNIQUE INDEX "Reaction_candidateId_profileId_key" ON "Reaction"("candidateId", "profileId");
