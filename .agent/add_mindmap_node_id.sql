
-- MessageテーブルにmindMapNodeIdカラムを追加
ALTER TABLE public.Message
ADD COLUMN mindMapNodeId uuid;

-- 外部キー制約を追加 (オプション: ノード削除時にNULLにする)
ALTER TABLE public.Message
ADD CONSTRAINT Message_mindMapNodeId_fkey
FOREIGN KEY (mindMapNodeId)
REFERENCES public.MindMapNode(id)
ON DELETE SET NULL;
