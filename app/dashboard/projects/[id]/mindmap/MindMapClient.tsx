"use client";

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection,
  Edge,
  Node,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  Panel,
  Handle,
  Position,
  NodeProps,
  ReactFlowProvider,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { createMindMapNode, updateMindMapNodePosition, updateMindMapNodeLabel, createMindMapEdge, deleteMindMapEdge, deleteMindMapNode } from '../actions';
import { PixelCard } from "@/components/ui/PixelCard";
import { FaUser, FaUsers, FaPlus, FaTrash, FaComments, FaSave, FaTimes } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { ChatDrawer } from "@/components/chat/ChatDrawer";

// --- Custom Node Component ---
const CustomNode = ({ data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [label, setLabel] = useState(data.label as string);
  const editableRef = useRef<HTMLDivElement>(null);

  // Focus and initialize text
  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.innerText = label; // Set initial text
      editableRef.current.focus();
    }
  }, [isEditing]); // Only run when entering edit mode

  const onLabelClick = () => {
    setIsEditing(true);
  };

  const onBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange && label !== data.label) {
      (data.onLabelChange as Function)(data.id, label);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      editableRef.current?.blur();
    }
  };

  const onInput = (e: React.FormEvent<HTMLDivElement>) => {
    setLabel(e.currentTarget.innerText);
  }

  return (
    <div className={cn(
      "px-2 py-1 rounded-md shadow-sm border text-center bg-white transition-all group relative max-w-[200px]",
      selected ? "border-[#f97316] ring-1 ring-orange-200" :
        data.isHighlighted ? "border-[#f97316] ring-4 ring-orange-400/50 scale-110 z-50 shadow-xl" : "border-stone-200",
      data.scope === 'personal' ? "bg-blue-50/50" : "bg-white"
    )}>
      {/* Handles for connections - Grey and explicit IDs */}
      {/* Top: Target, Bottom: Source, Left: Target, Right: Source */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2 !h-2 !bg-stone-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2 !h-2 !bg-stone-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2 !h-2 !bg-stone-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2 !h-2 !bg-stone-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Author Avatar/Initial */}
      <div className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-3 h-3 rounded-full bg-stone-200 text-[6px] font-bold border border-white shadow-sm" title={data.authorName as string}>
        {(data.authorAvatar as string) ? (
          <img src={data.authorAvatar as string} className="w-full h-full rounded-full object-cover" />
        ) : (
          (data.authorName as string)?.[0] || "?"
        )}
      </div>

      {isEditing ? (
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onInput={onInput}
          className="text-[10px] font-medium text-center bg-transparent focus:outline-none min-w-[20px] whitespace-pre-wrap outline-none leading-tight break-words nodrag cursor-text"
          style={{ minHeight: '1em' }}
        />
      ) : (
        <div onDoubleClick={onLabelClick} className="text-[10px] font-medium cursor-text break-words leading-tight whitespace-pre-wrap min-h-[1em] min-w-[20px] nodrag">
          {label}
        </div>
      )}
    </div>
  );
};


function MindMapFlow({
  projectId,
  initialNodes,
  initialEdges,
  currentProfile
}: {
  projectId: string,
  initialNodes: any[],
  initialEdges: any[],
  currentProfile: any
}) {
  const [activeTab, setActiveTab] = useState<'personal' | 'team'>('team');
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: Node } | null>(null);
  const [replyToNode, setReplyToNode] = useState<{ id: string, label: string } | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  // We need to transform DB nodes to ReactFlow nodes.
  const transformNodes = (dbNodes: any[]) => dbNodes.map(n => ({
    id: n.id,
    type: 'custom',
    position: { x: n.positionX, y: n.positionY },
    data: {
      label: n.label,
      id: n.id, // pass id to data for callbacks
      scope: n.scope,
      authorName: n.author?.username,
      authorAvatar: n.author?.avatarUrl,
      onLabelChange: handleLabelChange,
      onDelete: handleDeleteNode,
      isHighlighted: false
    },
  }));

  const transformEdges = (dbEdges: any[]) => dbEdges.map(e => ({
    id: e.id,
    source: e.sourceId,
    target: e.targetId,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    type: 'default',
    animated: true,
    style: { stroke: '#a8a29e', strokeWidth: 2 },
  }));


  // Update local state when tab changes or data updates
  useState(() => {
    setNodes(transformNodes((initialNodes || []).filter(n => n.scope === 'team')) as Node[]);
    setEdges(transformEdges((initialEdges || []).filter(e => e.scope === 'team')) as Edge[]);
  });

  // Re-filter when tab changes
  const handleTabChange = (tab: 'personal' | 'team') => {
    setActiveTab(tab);
    const filteredNodes = (initialNodes || []).filter(n => {
      if (tab === 'team') return n.scope === 'team';
      // Personal: show my personal nodes. (Assuming filteredNodes in prop already filters for me)
      return n.scope === 'personal' && n.authorId === currentProfile.id;
    });
    const filteredEdges = (initialEdges || []).filter(e => e.scope === tab);

    setNodes(transformNodes(filteredNodes) as Node[]);
    setEdges(transformEdges(filteredEdges) as Edge[]);
  };


  // --- Handlers ---

  async function handleLabelChange(id: string, newLabel: string) {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        node.data = { ...node.data, label: newLabel };
      }
      return node;
    }));
    await updateMindMapNodeLabel(id, projectId, newLabel);
  }

  async function handleDeleteNode(id: string) {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    await deleteMindMapNode(id, projectId);
  }


  const onConnect = useCallback(async (params: Connection) => {
    // Optimistic
    const tempId = `edge-${Date.now()}`;
    const newEdge = { ...params, id: tempId, animated: true, style: { stroke: '#a8a29e', strokeWidth: 2 } };
    setEdges((eds) => addEdge(newEdge as any, eds));

    // Server
    await createMindMapEdge(projectId, activeTab, params.source, params.target, params.sourceHandle, params.targetHandle);
  }, [projectId, activeTab, setEdges]);

  const onNodeDragStop = useCallback(async (event: any, node: Node) => {
    await updateMindMapNodePosition(node.id, projectId, node.position.x, node.position.y);
  }, [projectId]);

  const addNode = async (x?: number, y?: number) => {
    const defaultX = x ?? Math.random() * 400;
    const defaultY = y ?? Math.random() * 400;

    // Create on server first to get ID
    try {
      const dbNode = await createMindMapNode(projectId, activeTab, "新規", defaultX, defaultY);
      if (dbNode) {
        const flowNode = {
          id: dbNode.id,
          type: 'custom',
          position: { x: dbNode.positionX, y: dbNode.positionY },
          data: {
            label: dbNode.label,
            id: dbNode.id,
            scope: dbNode.scope,
            authorName: currentProfile.username,
            authorAvatar: currentProfile.avatarUrl,
            onLabelChange: handleLabelChange,
            onDelete: handleDeleteNode
          }
        };
        setNodes((nds) => nds.concat(flowNode as Node));
      }
    } catch (e) {
      console.error(e);
      alert("作成に失敗しました");
    }
  };

  const onPaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
    event.preventDefault();
    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    const position = screenToFlowPosition({
      x: clientX,
      y: clientY,
    });
    addNode(position.x, position.y);
  }, [screenToFlowPosition, projectId, activeTab, currentProfile]);

  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleComment = () => {
    if (contextMenu?.node) {
      setReplyToNode({ id: contextMenu.node.id, label: contextMenu.node.data.label as string });
      // We assume chat input is always visible now
      if (chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }
    setContextMenu(null);
  };

  const onMessageHover = useCallback((nodeId: string | null) => {
    setNodes((nds) => nds.map((n) => {
      // Only update if changes to avoid unnecessary re-renders (ReactFlow handles this optimization mostly but good to checks)
      const shouldHighlight = n.id === nodeId;
      if (!!n.data.isHighlighted === shouldHighlight) return n;

      return {
        ...n,
        data: {
          ...n.data,
          isHighlighted: shouldHighlight
        }
      };
    }));
  }, [setNodes]);

  const onInit = useCallback((instance: any) => {
    instance.fitView({ padding: 2.0, duration: 800 });
  }, []);

  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

  return (
    <div className="flex h-[calc(100vh-100px)] relative" onClick={onPaneClick}>
      {/* Main Flow Area */}
      <div className="flex-1 h-full bg-stone-50 relative pixel-border-sm overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          onPaneContextMenu={onPaneContextMenu}
          onNodeContextMenu={onNodeContextMenu}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          onInit={onInit}
        >
          <Background gap={20} color="#e7e5e4" />
          <Controls />

          <Panel position="top-center" className="m-4 pointer-events-none">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-stone-200 shadow-sm text-center">
              <p className="text-xs font-bold text-stone-600">現在の関心ごとをシェアして課題のタネを見つけよう / 右クリックでノードを追加</p>
            </div>
          </Panel>

          <Panel position="top-left" className="m-4">
            <div className="bg-white p-1.5 rounded pixel-border-sm flex gap-2 shadow-lg">
              <button
                onClick={() => handleTabChange('team')}
                className={cn("px-3 py-1.5 text-xs font-bold flex items-center gap-2 rounded transition-colors", activeTab === 'team' ? "bg-orange-100 text-[#f97316]" : "hover:bg-stone-100 text-stone-500")}
              >
                <FaUsers /> チーム
              </button>
              <button
                onClick={() => handleTabChange('personal')}
                className={cn("px-3 py-1.5 text-xs font-bold flex items-center gap-2 rounded transition-colors", activeTab === 'personal' ? "bg-blue-100 text-blue-600" : "hover:bg-stone-100 text-stone-500")}
              >
                <FaUser /> 個人
              </button>
            </div>
          </Panel>
        </ReactFlow>

        {/* Context Menu */}
        {contextMenu && (
          <div
            className="fixed bg-white pixel-border-sm shadow-xl z-50 py-1 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={handleComment}
              className="w-full text-left px-3 py-2 text-xs hover:bg-stone-100 flex items-center gap-2"
            >
              <FaComments className="text-stone-400" />
              コメントする
            </button>
            <div className="h-px bg-stone-100 my-1" />
            <button
              onClick={() => {
                if (window.confirm("削除しますか？")) {
                  (contextMenu.node.data.onDelete as Function)(contextMenu.node.id);
                }
                setContextMenu(null);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <FaTrash />
              削除
            </button>
          </div>
        )}
      </div>

      {/* Right Sidebar Chat */}
      <div className="w-[350px] border-l-2 border-stone-200 bg-white h-full flex flex-col">
        <ChatDrawer
          isOpen={true} // Always open
          onClose={() => { }} // No close
          projectId={projectId}
          candidateId={null}
          title="マインドマップチャット"
          variant="inline"
          inputRef={chatInputRef}
          replyToNode={replyToNode}
          onClearReply={() => setReplyToNode(null)}
          onMessageHover={onMessageHover}
        />
      </div>
    </div>
  );
}

export default function MindMapClient(props: any) {
  return (
    <ReactFlowProvider>
      <MindMapFlow {...props} />
    </ReactFlowProvider>
  );
}
