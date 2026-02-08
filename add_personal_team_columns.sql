-- Add authorId and isShared columns to support Personal/Team tabs
-- Fixed: Changed authorId from TEXT to UUID to match Profile.id type in database

-- SubProblem (Step 2)
ALTER TABLE "SubProblem" ADD COLUMN "authorId" UUID REFERENCES "Profile"("id") ON DELETE SET NULL;
ALTER TABLE "SubProblem" ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false;

-- Desire (Step 3)
ALTER TABLE "Desire" ADD COLUMN "authorId" UUID REFERENCES "Profile"("id") ON DELETE SET NULL;
ALTER TABLE "Desire" ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false;

-- Choice (Step 4)
ALTER TABLE "Choice" ADD COLUMN "authorId" UUID REFERENCES "Profile"("id") ON DELETE SET NULL;
ALTER TABLE "Choice" ADD COLUMN "isShared" BOOLEAN NOT NULL DEFAULT false;

-- Migrate existing data to be considered "Shared" (Team visible)
UPDATE "SubProblem" SET "isShared" = true;
UPDATE "Desire" SET "isShared" = true;
UPDATE "Choice" SET "isShared" = true;
