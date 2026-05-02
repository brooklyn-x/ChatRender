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
    <div className="w-full border border-theme">
      {chats.map((chat, i) => (
        <div
          key={chat.id}
          className={`flex items-center justify-between group transition-colors duration-150 hover:bg-surface ${
            i !== 0 ? 'border-t border-theme' : ''
          }`}
        >
          <button
            onClick={() => onSelectChat(chat)}
            className="flex-1 flex items-center gap-5 px-6 py-5 text-left cursor-pointer min-w-0"
          >
            <span className="text-[11px] font-mono text-subtle w-5 shrink-0">
              {String(i + 1).padStart(2, '0')}
            </span>

            <div className="w-8 h-8 border border-theme flex items-center justify-center shrink-0 text-subtle group-hover:text-muted transition-colors">
              <MessageSquare size={14} strokeWidth={1.5} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted group-hover:text-fg transition-colors truncate tracking-tight">
                {chat.name}
              </p>
              <p className="text-[11px] text-subtle mt-0.5 font-mono">
                {new Date(chat.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <span className="text-[11px] tracking-widest text-ghost group-hover:text-subtle uppercase transition-colors shrink-0 hidden sm:block">
              Open ↗
            </span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this encrypted chat?')) {
                onDeleteChat(chat.id);
              }
            }}
            className="px-5 py-5 text-ghost hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer border-l border-theme shrink-0"
            aria-label="Delete chat"
          >
            <Trash2 size={14} strokeWidth={1.5} />
          </button>
        </div>
      ))}
    </div>
  );
}
