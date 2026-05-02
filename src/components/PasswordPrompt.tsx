import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

interface PasswordPromptProps {
  mode: 'encrypt' | 'decrypt';
  onSubmit: (password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function PasswordPrompt({ mode, onSubmit, isLoading, error }: PasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'encrypt' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    onSubmit(password);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Icon + heading */}
      <div className="mb-8">
        <div className={`inline-flex p-3 border mb-6 ${mode === 'encrypt' ? 'border-white/15 text-white/60' : 'border-white/15 text-white/60'}`}>
          {mode === 'encrypt' ? <Lock size={24} strokeWidth={1.5} /> : <KeyRound size={24} strokeWidth={1.5} />}
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-2">
          {mode === 'encrypt' ? 'Lock this chat.' : 'Unlock this chat.'}
        </h2>
        <p className="text-sm text-white/45 leading-relaxed">
          {mode === 'encrypt'
            ? 'Set a password. It encrypts locally using AES-256-GCM. Lose it and the data is gone — permanently.'
            : 'Enter the password you used when you first locked this chat.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium tracking-[0.15em] text-white/40 uppercase mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all text-sm"
            placeholder="Enter password"
            required
            autoFocus
          />
        </div>

        {mode === 'encrypt' && (
          <div>
            <label className="block text-[11px] font-medium tracking-[0.15em] text-white/40 uppercase mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all text-sm"
              placeholder="Confirm password"
              required
            />
          </div>
        )}

        {(error || localError) && (
          <p className="text-sm text-red-400 border border-red-500/20 bg-red-500/5 px-4 py-3">
            {error || localError}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-white text-black text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-40 cursor-pointer mt-2"
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              {mode === 'encrypt' ? 'Encrypt & Save' : 'Decrypt & View'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
