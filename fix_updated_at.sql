-- Fix all updatedAt columns to have default values
ALTER TABLE "Project" ALTER COLUMN "updatedAt" SET DEFAULT now();
ALTER TABLE "Profile" ALTER COLUMN "updatedAt" SET DEFAULT now();
-- Add other tables if they have updatedAt
-- Candidate, SubProblem etc do not have updatedAt in schema, only createdAt which usually has default(now())

-- If there are other tables with updatedAt, add them here.
-- Based on schema.prisma:
-- Profile and Project are the main ones with @updatedAt.
-- Let's check schema again.

-- Profile: updatedAt
-- Project: updatedAt

-- Only these two models have updatedAt in the provided schema.
