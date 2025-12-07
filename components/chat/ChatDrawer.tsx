
'use client';

import { useState, useEffect, useRef } from 'react';
import { IoClose, IoSend } from 'react-icons/io5';

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  candidateId?: string | null;
  title: string;
  members: { id: string; name: string; avatar: string | null }[];
  currentUserId: string;
}

export default function ChatDrawer({ isOpen, onClose, projectId, candidateId, title, members, currentUserId }: ChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, projectId, candidateId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    const url = new URL(`/api/projects/${projectId}/chat`, window.location.origin);
    if (candidateId) url.searchParams.set('candidateId', candidateId);

    try {
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Simple mention detection
    const mentionedUserIds = members
      .filter(m => input.includes(`@${m.name}`))
      .map(m => m.id);

    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: input,
          userId: currentUserId,
          candidateId,
          mentionedUserIds
        })
      });

      if (res.ok) {
        setInput('');
        fetchMessages();
        scrollToBottom();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    // Check if user just typed '@' at the end
    if (val.endsWith('@') || val.endsWith('＠')) {
      setShowMentions(true);
    } else if (showMentions && val.includes(' ')) {
      // Hide if space typed (simplistic)
      setShowMentions(false);
    }
  };

  const insertMention = (memberName: string) => {
    setInput(prev => prev + memberName + ' ');
    setShowMentions(false);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-transparent z-[90]"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl transform transition-transform duration-300 z-[100] flex flex-col border-l border-gray-200 animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Chat</div>
            <h3 className="font-bold text-gray-800 line-clamp-1 text-sm">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
            <IoClose size={24} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100/50">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Start the conversation!</div>
          )}
          {messages.map(msg => {
            const isMe = msg.user.id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-orange-500 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'}`}>
                  {!isMe && <div className="text-xs font-bold mb-1 opacity-70">{msg.user.name}</div>}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-orange-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Mention List Popup */}
        {showMentions && (
          <div className="absolute bottom-20 left-4 right-4 bg-white border rounded-lg shadow-xl max-h-40 overflow-y-auto z-10">
            <div className="p-2 text-xs font-bold text-gray-500 bg-gray-50">Select Member</div>
            {members.map(m => (
              <button
                key={m.id}
                onClick={() => insertMention(m.name)}
                className="w-full text-left px-3 py-2 hover:bg-orange-50 text-sm flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs overflow-hidden">
                  {m.avatar ? <img src={m.avatar} alt={m.name} /> : m.name[0]}
                </div>
                {m.name}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none h-14 bg-gray-50"
              placeholder="Type a message... Use @ to mention"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              <IoSend size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
