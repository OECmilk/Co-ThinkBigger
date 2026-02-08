
-- Add a column to Message table to store the related MindMapNode ID
ALTER TABLE "Message" ADD COLUMN "mindMapNodeId" UUID DEFAULT NULL;

-- Add foreign key constraint (optional, but good for integrity)
-- Note: mindMapNodeId is optional, so it can be NULL
ALTER TABLE "Message" ADD CONSTRAINT "Message_mindMapNodeId_fkey" FOREIGN KEY ("mindMapNodeId") REFERENCES "MindMapNode"("id") ON DELETE SET NULL;
