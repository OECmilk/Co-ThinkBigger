
-- Messageという名前のテーブルが存在するか確認し、なければ "Message" (引用符付き) で試す
-- ほとんどの場合、Supabase/Postgresでは引用符なしの識別子は小文字に変換されます。
-- もしテーブルが "Message"（大文字含む）として作成されている場合、ダブルクォートが必要です。

ALTER TABLE "Message"
ADD COLUMN IF NOT EXISTS "mindMapNodeId" uuid;

ALTER TABLE "Message"
DROP CONSTRAINT IF EXISTS "Message_mindMapNodeId_fkey";

ALTER TABLE "Message"
ADD CONSTRAINT "Message_mindMapNodeId_fkey"
FOREIGN KEY ("mindMapNodeId")
REFERENCES "MindMapNode"("id")
ON DELETE SET NULL;
