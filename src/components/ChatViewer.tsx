import React, { useState, useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { format, parseISO } from 'date-fns';
import { Search, X, BarChart2, ArrowLeft, Image as ImageIcon, Video as VideoIcon, FileText, Headphones, Filter } from 'lucide-react';
import { ParsedChat, ChatMessage } from '../utils/whatsappParser';

interface ChatViewerProps {
  chat: ParsedChat;
  chatName: string;
  onBack: () => void;
}

const SENDER_ACCENTS = [
  'text-blue-400',
  'text-violet-400',
  'text-amber-400',
  'text-rose-400',
  'text-cyan-400',
  'text-fuchsia-400',
];

export function ChatViewer({ chat, chatName, onBack }: ChatViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSender, setSelectedSender] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [meUser, setMeUser] = useState<string>(
    chat.senders.length > 1 ? chat.senders[1] : chat.senders[0]
  );

  const filteredMessages = useMemo(() => {
    return chat.messages.filter(msg => {
      const matchesSearch = msg.message.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSender = selectedSender ? msg.sender === selectedSender : true;
      return matchesSearch && matchesSender;
    });
  }, [chat.messages, searchQuery, selectedSender]);

  const senderAccents = useMemo(() => {
    const map: Record<string, string> = {};
    chat.senders.forEach((sender, i) => {
      map[sender] = SENDER_ACCENTS[i % SENDER_ACCENTS.length];
    });
    return map;
  }, [chat.senders]);

  const groupedDates = useMemo(() => {
    const dates: { index: number; date: string }[] = [];
    let lastDate = '';
    filteredMessages.forEach((msg, index) => {
      try {
        const dateStr = format(parseISO(msg.timestamp), 'MMMM d, yyyy');
        if (dateStr !== lastDate) {
          dates.push({ index, date: dateStr });
          lastDate = dateStr;
        }
      } catch {
        // ignore invalid dates
      }
    });
    return dates;
  }, [filteredMessages]);

  const renderMessage = (index: number, msg: ChatMessage) => {
    const dateHeader = groupedDates.find(d => d.index === index);
    const prevMsg = index > 0 ? filteredMessages[index - 1] : null;
    const isConsecutive = prevMsg && prevMsg.sender === msg.sender && prevMsg.type !== 'system' && !dateHeader;

    if (msg.type === 'system') {
      return (
        <div className="flex flex-col items-center px-4 my-3">
          {dateHeader && <DateDivider date={dateHeader.date} />}
          <span className="text-[11px] font-mono text-white/25 tracking-wide text-center px-4">
            {msg.message}
          </span>
        </div>
      );
    }

    const isMe = msg.sender === meUser;

    return (
      <div className="flex flex-col px-4 md:px-8">
        {dateHeader && <DateDivider date={dateHeader.date} />}

        <div className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}>
          <div
            className={`max-w-[72%] md:max-w-[55%] px-3.5 py-2.5 relative
              ${isMe
                ? 'bg-white/[0.07] border border-white/10'
                : 'bg-white/[0.04] border border-white/[0.06]'
              }`}
          >
            {!isMe && !isConsecutive && (
              <p className={`text-[11px] font-medium tracking-wide mb-1 ${senderAccents[msg.sender] ?? 'text-white/50'}`}>
                {msg.sender}
              </p>
            )}

            {msg.attachment && (
              <div className="mb-2 overflow-hidden bg-white/5 flex items-center justify-center">
                {msg.attachment.dataUrl ? (
                  msg.attachment.dataUrl.startsWith('data:video/') ? (
                    <video src={msg.attachment.dataUrl} controls className="max-w-full max-h-56 object-contain" />
                  ) : msg.attachment.dataUrl.startsWith('data:audio/') ? (
                    <audio src={msg.attachment.dataUrl} controls className="max-w-full" />
                  ) : msg.attachment.dataUrl.startsWith('data:image/') ? (
                    <img src={msg.attachment.dataUrl} alt="Attached media" className="max-w-full max-h-56 object-contain" loading="lazy" />
                  ) : (
                    <a href={msg.attachment.dataUrl} download={msg.attachment.fileName}
                      className="p-4 flex flex-col items-center gap-2 text-white/40 hover:text-white/70 transition-colors w-full">
                      <FileText size={20} strokeWidth={1.5} />
                      <span className="text-[11px] font-mono underline">{msg.attachment.fileName}</span>
                    </a>
                  )
                ) : (
                  <div className="p-4 flex flex-col items-center gap-2 text-white/25 w-full">
                    {msg.attachment.fileName.match(/\.(mp4|mov|webm|mkv)$/i) ? <VideoIcon size={20} strokeWidth={1.5} /> :
                     msg.attachment.fileName.match(/\.(opus|mp3|wav)$/i) ? <Headphones size={20} strokeWidth={1.5} /> :
                     msg.attachment.fileName.match(/\.(pdf|doc|docx|xls|xlsx)$/i) ? <FileText size={20} strokeWidth={1.5} /> :
                     <ImageIcon size={20} strokeWidth={1.5} />}
                    <span className="text-[11px] font-mono text-white/30">{msg.attachment.fileName}</span>
                  </div>
                )}
              </div>
            )}

            {msg.message && (
              <p className="text-sm text-white/85 leading-relaxed whitespace-pre-wrap break-words">
                {msg.message}
              </p>
            )}

            <p className="text-[10px] text-white/25 text-right mt-1.5 font-mono">
              {format(parseISO(msg.timestamp), 'h:mm a')}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <header className="shrink-0 border-b border-white/8 px-4 md:px-8 h-14 flex items-center justify-between bg-[#0a0a0a]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-2"
          >
            <ArrowLeft size={16} strokeWidth={1.5} />
          </button>
          <div>
            <h1 className="text-sm font-medium text-white tracking-tight">{chatName}</h1>
            <p className="text-[11px] text-white/30 font-mono">{chat.messages.length.toLocaleString()} messages</p>
          </div>
        </div>

        <button
          onClick={() => setShowStats(!showStats)}
          className={`flex items-center gap-1.5 text-[11px] tracking-widest uppercase transition-colors cursor-pointer px-3 py-1.5 border ${
            showStats
              ? 'border-white/30 text-white'
              : 'border-white/10 text-white/35 hover:text-white/60 hover:border-white/20'
          }`}
        >
          <BarChart2 size={12} strokeWidth={1.5} />
          <span>Stats</span>
        </button>
      </header>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-white/[0.06] px-4 md:px-8 py-2.5 flex flex-wrap gap-3 items-center bg-[#0a0a0a] z-10">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-1.5 bg-white/4 border border-white/8 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all font-['Inter',system-ui]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 cursor-pointer">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sender filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <Filter size={12} className="text-white/20 shrink-0" strokeWidth={1.5} />
          {[null, ...chat.senders].map((sender) => (
            <button
              key={sender ?? '__all__'}
              onClick={() => setSelectedSender(sender)}
              className={`px-2.5 py-1 text-[11px] font-mono tracking-wide whitespace-nowrap transition-colors cursor-pointer border ${
                selectedSender === sender
                  ? 'border-white/40 text-white bg-white/8'
                  : 'border-white/8 text-white/35 hover:text-white/60 hover:border-white/15'
              }`}
            >
              {sender ?? 'All'}
            </button>
          ))}
        </div>

        {/* Me selector */}
        <div className="flex items-center gap-2 ml-auto border-l border-white/8 pl-3 shrink-0">
          <span className="text-[11px] text-white/25 uppercase tracking-widest whitespace-nowrap">Me:</span>
          <select
            value={meUser}
            onChange={(e) => setMeUser(e.target.value)}
            className="text-[11px] font-mono bg-white/5 border border-white/8 text-white/60 px-2.5 py-1 focus:outline-none focus:border-white/20 cursor-pointer max-w-[130px] truncate"
          >
            {chat.senders.map(sender => (
              <option key={sender} value={sender} className="bg-[#111] text-white">{sender}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 h-full">
          {filteredMessages.length > 0 ? (
            <Virtuoso
              data={filteredMessages}
              itemContent={renderMessage}
              className="h-full w-full"
              initialTopMostItemIndex={filteredMessages.length - 1}
              followOutput="smooth"
              increaseViewportBy={800}
              defaultItemHeight={80}
              style={{ paddingTop: '16px', paddingBottom: '24px' }}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-white/20 text-sm font-mono">No messages found.</p>
            </div>
          )}
        </div>

        {/* Stats sidebar */}
        {showStats && (
          <div className="w-72 shrink-0 border-l border-white/8 bg-[#0a0a0a] flex flex-col overflow-y-auto z-20 absolute right-0 h-full md:relative">
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between sticky top-0 bg-[#0a0a0a]">
              <span className="text-[11px] font-medium tracking-[0.2em] text-white/40 uppercase">Statistics</span>
              <button onClick={() => setShowStats(false)} className="text-white/25 hover:text-white/60 transition-colors cursor-pointer md:hidden">
                <X size={14} />
              </button>
            </div>

            <div className="p-5 space-y-8">
              {/* Overview */}
              <div>
                <p className="text-[11px] tracking-[0.2em] text-white/25 uppercase mb-4">Overview</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: chat.messages.length.toLocaleString(), label: 'Messages' },
                    { value: chat.senders.length.toString(), label: 'Participants' },
                  ].map(stat => (
                    <div key={stat.label} className="border border-white/8 p-3">
                      <p className="text-xl font-semibold text-white tracking-tight">{stat.value}</p>
                      <p className="text-[11px] text-white/30 mt-0.5">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per sender */}
              <div>
                <p className="text-[11px] tracking-[0.2em] text-white/25 uppercase mb-4">By Sender</p>
                <div className="space-y-4">
                  {chat.senders.map((sender, i) => {
                    const count = chat.messages.filter(m => m.sender === sender).length;
                    const pct = Math.round((count / chat.messages.length) * 100);
                    return (
                      <div key={sender}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className={`text-xs font-medium truncate max-w-[140px] ${SENDER_ACCENTS[i % SENDER_ACCENTS.length]}`}>{sender}</span>
                          <span className="text-[11px] font-mono text-white/35 shrink-0">{count.toLocaleString()} · {pct}%</span>
                        </div>
                        <div className="w-full bg-white/5 h-px">
                          <div className="bg-white/30 h-px transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DateDivider({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-4 my-5 px-0">
      <div className="flex-1 border-t border-white/[0.06]" />
      <span className="text-[11px] font-mono text-white/25 tracking-wide whitespace-nowrap">{date}</span>
      <div className="flex-1 border-t border-white/[0.06]" />
    </div>
  );
}
