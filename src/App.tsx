import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { MessageCircle, ArrowRight, Lock, Eye, Sun, Moon } from 'lucide-react';
import JSZip from 'jszip';
import { FileUpload } from './components/FileUpload';
import { PasswordPrompt } from './components/PasswordPrompt';
import { ChatViewer } from './components/ChatViewer';
import { ChatList } from './components/ChatList';
import { parseWhatsAppChat, ParsedChat } from './utils/whatsappParser';
import { encryptData, decryptData } from './utils/crypto';
import { saveEncryptedChat, getEncryptedChat, getAllEncryptedChats, deleteEncryptedChat, EncryptedChat } from './utils/db';

type AppState = 'home' | 'encrypting' | 'decrypting' | 'viewing';
type Theme = 'dark' | 'light';

const FEATURES = [
  { label: 'AES-256 ENCRYPTION' },
  { label: 'ZERO SERVER ACCESS' },
  { label: 'LOCAL-ONLY STORAGE' },
  { label: 'OPEN SOURCE' },
  { label: 'NO ACCOUNT NEEDED' },
  { label: 'AES-256 ENCRYPTION' },
  { label: 'ZERO SERVER ACCESS' },
  { label: 'LOCAL-ONLY STORAGE' },
  { label: 'OPEN SOURCE' },
  { label: 'NO ACCOUNT NEEDED' },
];

export default function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [chats, setChats] = useState<EncryptedChat[]>([]);
  const [pendingFile, setPendingFile] = useState<{ name: string; content: string; mediaFiles: Record<string, string> } | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<{ parsed: ParsedChat; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('theme') as Theme) ?? 'light'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => { loadSavedChats(); }, []);

  const loadSavedChats = async () => {
    try {
      const savedChats = await getAllEncryptedChats();
      setChats(savedChats);
    } catch (err) {
      console.error('Failed to load chats:', err);
    }
  };

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError('');
    try {
      if (file.name.endsWith('.zip')) {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        let chatText = '';
        const mediaFiles: Record<string, string> = {};

        for (const [filename, zipEntry] of Object.entries(contents.files)) {
          if (zipEntry.dir) continue;
          const baseFilename = filename.split('/').pop() || filename;
          if (baseFilename.startsWith('._')) continue;

          if (baseFilename.endsWith('.txt')) {
            const text = await zipEntry.async('text');
            if (text.trim().match(/^\[?\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}/) || !chatText) chatText = text;
          } else if (baseFilename.match(/\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|mkv|opus|mp3|wav|pdf|doc|docx|xls|xlsx)$/i)) {
            const base64 = await zipEntry.async('base64');
            const ext = baseFilename.split('.').pop()?.toLowerCase();
            let mimeType = ext;
            if (ext === 'jpg') mimeType = 'jpeg';
            if (ext === 'mov') mimeType = 'quicktime';
            if (ext === 'pdf') mimeType = 'pdf';
            if (ext === 'doc' || ext === 'docx') mimeType = 'msword';
            if (ext === 'xls' || ext === 'xlsx') mimeType = 'vnd.ms-excel';
            if (ext === 'opus') mimeType = 'ogg';
            let type = 'application';
            if (baseFilename.match(/\.(mp4|mov|webm|mkv)$/i)) type = 'video';
            else if (baseFilename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) type = 'image';
            else if (baseFilename.match(/\.(opus|mp3|wav)$/i)) type = 'audio';
            mediaFiles[baseFilename] = `data:${type}/${mimeType};base64,${base64}`;
          }
        }

        if (!chatText) throw new Error('No .txt file found in the zip archive.');
        setPendingFile({ name: file.name.replace('.zip', ''), content: chatText, mediaFiles });
        setAppState('encrypting');
      } else {
        const text = await file.text();
        setPendingFile({ name: file.name.replace('.txt', ''), content: text, mediaFiles: {} });
        setAppState('encrypting');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to read file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEncrypt = async (password: string) => {
    if (!pendingFile) return;
    setIsLoading(true);
    setError('');
    try {
      const parsed = parseWhatsAppChat(pendingFile.content, pendingFile.mediaFiles);
      if (parsed.messages.length === 0)
        throw new Error('No messages found in the file. Ensure it is a valid WhatsApp export.');
      const jsonToEncrypt = JSON.stringify(parsed);
      const { ciphertext, salt, iv } = await encryptData(jsonToEncrypt, password);
      const newChat: EncryptedChat = { id: crypto.randomUUID(), name: pendingFile.name, salt, iv, ciphertext, createdAt: Date.now() };
      await saveEncryptedChat(newChat);
      await loadSavedChats();
      setPendingFile(null);
      setAppState('home');
    } catch (err: any) {
      setError(err.message || 'Encryption failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectChat = (chat: EncryptedChat) => { setSelectedChatId(chat.id); setAppState('decrypting'); setError(''); };
  const handleDeleteChat = async (id: string) => { await deleteEncryptedChat(id); await loadSavedChats(); };

  const handleDecrypt = async (password: string) => {
    if (!selectedChatId) return;
    setIsLoading(true);
    setError('');
    try {
      const chatRecord = await getEncryptedChat(selectedChatId);
      if (!chatRecord) throw new Error('Chat not found.');
      const decryptedJson = await decryptData(chatRecord.ciphertext, password, chatRecord.salt, chatRecord.iv);
      setActiveChat({ parsed: JSON.parse(decryptedJson), name: chatRecord.name });
      setAppState('viewing');
    } catch {
      setError('Incorrect password or corrupted data.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => { setAppState('home'); setActiveChat(null); setSelectedChatId(null); setPendingFile(null); setError(''); };

  if (appState === 'viewing' && activeChat) {
    return <ChatViewer chat={activeChat.parsed} chatName={activeChat.name} onBack={handleBackToHome} theme={theme} toggleTheme={toggleTheme} />;
  }

  /* ── Sub-flow shell ── */
  if (appState === 'encrypting' || appState === 'decrypting') {
    return (
      <div className="min-h-screen bg-app text-fg" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <header className="border-b border-theme h-14 flex items-center justify-between px-6">
          <button onClick={handleBackToHome} className="flex items-center gap-2 text-sm text-muted hover:text-fg transition-colors cursor-pointer">
            <span className="text-lg leading-none">←</span>
            {appState === 'encrypting' ? 'Cancel' : 'Back'}
          </button>
          <button onClick={toggleTheme} className="text-subtle hover:text-muted transition-colors cursor-pointer" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </header>
        <main className="max-w-md mx-auto px-6 py-16">
          {appState === 'encrypting' && pendingFile && (
            <PasswordPrompt mode="encrypt" onSubmit={handleEncrypt} isLoading={isLoading} error={error} />
          )}
          {appState === 'decrypting' && selectedChatId && (
            <PasswordPrompt mode="decrypt" onSubmit={handleDecrypt} isLoading={isLoading} error={error} />
          )}
        </main>
      </div>
    );
  }

  /* ── HOME ── */
  return (
    <div className="min-h-screen bg-app text-fg overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-14 border-b border-theme bg-nav backdrop-blur-sm">
        <button onClick={handleBackToHome} className="flex items-center gap-2 cursor-pointer" aria-label="Home">
          <MessageCircle size={18} className="text-muted" />
          <span className="text-sm font-medium tracking-tight text-fg">ChatReader</span>
        </button>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium tracking-widest text-subtle uppercase">
            <Lock size={10} />
            <span>End-to-End Encrypted</span>
          </div>
          <button
            onClick={toggleTheme}
            className="text-subtle hover:text-muted transition-colors cursor-pointer p-1"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-0 px-6 md:px-10 max-w-[1200px] mx-auto">
        <p className="fade-up fade-up-1 text-[11px] font-medium tracking-[0.2em] text-subtle uppercase mb-8">
          Private · Local · Encrypted
        </p>
        <h1 className="fade-up fade-up-2 type-display text-giant text-fg leading-none mb-0">
          Read your chats.<br />
          <span className="type-display-italic text-muted">Trust no one.</span>
        </h1>
        <h2 className="fade-up fade-up-2 type-display text-giant text-fg leading-none mb-10">
          Not even us.
        </h2>
        <div className="fade-up fade-up-3 flex flex-col sm:flex-row sm:items-end gap-8 mb-0 border-t border-theme pt-8">
          <p className="text-muted text-base leading-relaxed max-w-xs">
            Your export. Your password. Your device. Nothing leaves. Nothing is stored remotely. Nothing is shared.
          </p>
          <div className="flex items-center gap-3 text-sm text-subtle shrink-0">
            <Eye size={14} />
            <span>Zero server contact</span>
            <ArrowRight size={14} />
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="mt-12 border-y border-theme py-3 overflow-hidden">
        <div className="marquee-track flex gap-0 w-max">
          {FEATURES.map((f, i) => (
            <span key={i} className="flex items-center gap-4 px-8 text-[11px] font-medium tracking-[0.18em] text-subtle uppercase whitespace-nowrap">
              <span className="w-1 h-1 rounded-full bg-ghost shrink-0" style={{ backgroundColor: 'var(--fg-ghost)' }} />
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* UPLOAD */}
      <section className="px-6 md:px-10 max-w-[1200px] mx-auto py-16 md:py-24">
        <div className="flex items-center justify-between mb-10 border-b border-theme pb-4">
          <span className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">Upload</span>
          <span className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">01 / 01</span>
        </div>
        <FileUpload onFileSelect={handleFileSelect} />
      </section>

      {/* VAULT */}
      {chats.length > 0 && (
        <section className="px-6 md:px-10 max-w-[1200px] mx-auto pb-24">
          <div className="flex items-center justify-between mb-10 border-b border-theme pb-4">
            <span className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">Vault</span>
            <span className="text-[11px] font-medium tracking-widest text-subtle uppercase">{chats.length} chat{chats.length !== 1 ? 's' : ''}</span>
          </div>
          <ChatList chats={chats} onSelectChat={handleSelectChat} onDeleteChat={handleDeleteChat} />
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="border-t border-theme px-6 md:px-10 max-w-[1200px] mx-auto py-16 md:py-24">
        <div className="flex items-center justify-between mb-12 border-b border-theme pb-4">
          <span className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase">How it works</span>
          <span className="text-[11px] text-subtle uppercase tracking-widest">Process</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-theme">
          {[
            { n: '01', title: 'Export', body: 'Open WhatsApp. Tap a chat. Hit Export Chat. Save the .zip or .txt to your device.' },
            { n: '02', title: 'Lock it', body: 'Drop the file. Set a password. AES-256-GCM encryption runs entirely on your device — no network request, ever.' },
            { n: '03', title: 'Read', body: 'Your archive lives in your browser only. Unlock it with your password whenever you want.' },
          ].map((step) => (
            <div key={step.n} className="py-8 md:py-0 md:px-8 first:pl-0 last:pr-0">
              <span className="text-[11px] font-medium tracking-[0.2em] text-subtle uppercase block mb-6">{step.n}</span>
              <h3 className="text-2xl font-semibold tracking-tight text-fg mb-3">{step.title}</h3>
              <p className="text-sm text-muted leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-theme px-6 md:px-10 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[1200px] mx-auto">
        <span className="text-[11px] text-subtle tracking-widest uppercase">ChatReader — {new Date().getFullYear()}</span>
        <span className="text-[11px] text-ghost tracking-wider" style={{ color: 'var(--fg-ghost)' }}>No accounts. No tracking. No servers.</span>
      </footer>

      <Analytics />
    </div>
  );
}
