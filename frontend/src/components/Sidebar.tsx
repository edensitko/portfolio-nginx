import React from 'react';
import { PlusCircle, MessageSquare, Settings } from 'lucide-react';

interface SidebarProps {
  conversations: { id: string; title: string }[];
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  selectedId?: string;
}

export function Sidebar({ conversations, onNewChat, onSelectChat, selectedId }: SidebarProps) {
  return (
    <div className="w-64 bg-gray-900 h-screen p-4 flex flex-col">
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        <PlusCircle size={20} />
        New Chat
      </button>
      
      <div className="mt-6 flex-1 overflow-y-auto">
        {conversations.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-2 w-full px-4 py-2 rounded-lg mb-1 ${
              selectedId === chat.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={18} />
            <span className="truncate text-left">{chat.title}</span>
          </button>
        ))}
      </div>

      <button className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white transition-colors">
        <Settings size={20} />
        Settings
      </button>
    </div>
  );
}