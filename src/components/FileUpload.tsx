import React, { useState, useRef } from 'react';
import { Upload, ShieldCheck, ArrowUpRight } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.txt') || file.name.endsWith('.zip')) {
        onFileSelect(file);
      } else {
        alert('Please upload a .txt or .zip file exported from WhatsApp.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      {/* Drop zone — editorial full-width card */}
      <div
        className={`relative w-full border transition-all duration-200 cursor-pointer group
          ${isDragging
            ? 'border-white/40 bg-white/4'
            : 'border-white/10 hover:border-white/25 bg-white/2 hover:bg-white/[0.035]'
          }`}
        style={{ minHeight: '280px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".txt,.zip"
          className="hidden"
        />

        {/* Corner label */}
        <div className="absolute top-5 left-6 flex items-center gap-2">
          <span className="text-[10px] font-medium tracking-[0.2em] text-white/50 uppercase">Drop file</span>
        </div>

        {/* Top-right arrow indicator */}
        <div className={`absolute top-5 right-6 transition-all duration-200 ${isDragging ? 'text-white/60' : 'text-white/15 group-hover:text-white/40'}`}>
          <ArrowUpRight size={18} />
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center justify-center h-full py-20 px-8 text-center">
          <div className={`mb-6 transition-all duration-200 ${isDragging ? 'scale-110 text-white/70' : 'text-white/20 group-hover:text-white/40'}`}>
            <Upload size={36} strokeWidth={1.5} />
          </div>

          <p className={`text-2xl font-semibold tracking-tight transition-colors duration-200 mb-2
            ${isDragging ? 'text-white' : 'text-white/70 group-hover:text-white/90'}`}>
            {isDragging ? 'Let go.' : 'Drop your export here.'}
          </p>
          <p className="text-sm text-white/45 mt-1">or click to browse</p>

          {/* Format badges */}
          <div className="flex items-center gap-3 mt-8">
            {['.txt', '.zip'].map(ext => (
              <span key={ext} className="px-3 py-1 border border-white/20 text-[11px] font-mono tracking-wider text-white/50">
                {ext}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/8 px-6 py-3 flex items-center gap-2">
          <ShieldCheck size={12} className="text-white/40 shrink-0" />
          <span className="text-[11px] text-white/40 tracking-wide">Stays on your device. Always.</span>
        </div>
      </div>

      {/* Steps — horizontal editorial grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8 border border-white/8 border-t-0">
        {[
          { n: '1', text: 'Open WhatsApp → tap the chat name → Export Chat.' },
          { n: '2', text: 'Pick "With Media" or "Without Media." Save to device.' },
          { n: '3', text: 'Drop the file above. Done.' },
        ].map(step => (
          <div key={step.n} className="px-5 py-4 flex items-start gap-3">
            <span className="text-[11px] font-mono text-white/45 mt-0.5 shrink-0">{step.n}.</span>
            <span className="text-xs text-white/55 leading-relaxed">{step.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
