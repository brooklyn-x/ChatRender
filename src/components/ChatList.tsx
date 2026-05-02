import React from 'react';
import { MessageSquare, Trash2 } from 'lucide-react';
import { EncryptedChat } from '../utils/db';

interface ChatListProps {
  chats: EncryptedChat[];
  onSelectChat: (chat: EncryptedChat) => void;
  onDeleteChat: (id: string) => void;
}

export function ChatList({ chats, onSelectChat, onDeleteChat }: ChatListProps) {
  if (chats.length === 0) return null;

  return (
    <div className="w-full border border-white/10">
      {chats.map((chat, i) => (
        <div
          key={chat.id}
          className={`flex items-center justify-between group transition-colors duration-150 hover:bg-white/3 ${
            i !== 0 ? 'border-t border-white/8' : ''
          }`}
        >
          {/* Main row — click to open */}
          <button
            onClick={() => onSelectChat(chat)}
            className="flex-1 flex items-center gap-5 px-6 py-5 text-left cursor-pointer min-w-0"
          >
            {/* Index */}
            <span className="text-[11px] font-mono text-white/40 w-5 shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>

            {/* Icon */}
            <div className="w-8 h-8 border border-white/20 flex items-center justify-center shrink-0 text-white/45 group-hover:text-white/70 transition-colors">
              <MessageSquare size={14} strokeWidth={1.5} />
            </div>

            {/* Name + date */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white/85 group-hover:text-white transition-colors truncate tracking-tight">
                {chat.name}
              </p>
              <p className="text-[11px] text-white/45 mt-0.5 font-mono">
                {new Date(chat.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Open label */}
            <span className="text-[11px] tracking-widest text-white/35 group-hover:text-white/60 uppercase transition-colors shrink-0 hidden sm:block">
              Open ↗
            </span>
          </button>

          {/* Delete */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this encrypted chat?')) {
                onDeleteChat(chat.id);
              }
            }}
            className="px-5 py-5 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border-l border-white/8 shrink-0"
            aria-label="Delete chat"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
