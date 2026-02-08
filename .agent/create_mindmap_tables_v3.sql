
-- Drop tables if they were partially created
DROP TABLE IF EXISTS "MindMapEdge";
DROP TABLE IF EXISTS "MindMapNode";

-- Create MindMap Nodes Table
CREATE TABLE "MindMapNode" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" BIGINT NOT NULL, 
    "scope" TEXT NOT NULL DEFAULT 'team', 
    "label" TEXT NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "positionY" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "authorId" UUID NOT NULL, 
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindMapNode_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MindMapNode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    CONSTRAINT "MindMapNode_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE RESTRICT
);

-- Create MindMap Edges Table
CREATE TABLE "MindMapEdge" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "projectId" BIGINT NOT NULL, 
    "scope" TEXT NOT NULL DEFAULT 'team', 
    "sourceId" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "label" TEXT,
    "authorId" UUID NOT NULL, 
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MindMapEdge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MindMapEdge_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE,
    CONSTRAINT "MindMapEdge_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE,
    CONSTRAINT "MindMapEdge_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "MindMapNode"("id") ON DELETE CASCADE,
    CONSTRAINT "MindMapEdge_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Profile"("id") ON DELETE RESTRICT
);

-- Enable RLS
ALTER TABLE "MindMapNode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MindMapEdge" ENABLE ROW LEVEL SECURITY;

-- Policies for MindMapNode
CREATE POLICY "Allow read for project members" ON "MindMapNode"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    -- ProjectMember.projectId IS BIGINT, matching MindMapNode.projectId (BIGINT)
    WHERE pm."projectId" = "MindMapNode"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

CREATE POLICY "Allow insert for project members" ON "MindMapNode"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapNode"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

CREATE POLICY "Allow update for project members" ON "MindMapNode"
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapNode"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

CREATE POLICY "Allow delete for project members" ON "MindMapNode"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapNode"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

-- Policies for MindMapEdge
CREATE POLICY "Enable read access for all project members" ON "MindMapEdge"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapEdge"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

CREATE POLICY "Enable insert access for all project members" ON "MindMapEdge"
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapEdge"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);

CREATE POLICY "Enable delete access for all project members" ON "MindMapEdge"
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM "ProjectMember" pm
    WHERE pm."projectId" = "MindMapEdge"."projectId"
    AND pm."profileId" IN (
      SELECT id FROM "Profile" WHERE "userId" = auth.uid()
    )
  )
);
