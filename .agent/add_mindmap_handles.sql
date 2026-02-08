
-- MindMapEdgeテーブルにsourceHandleとtargetHandleを追加
ALTER TABLE "MindMapEdge"
ADD COLUMN IF NOT EXISTS "sourceHandle" text,
ADD COLUMN IF NOT EXISTS "targetHandle" text;
