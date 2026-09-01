import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';

interface LazyImageProps {
  storageKey: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({ storageKey, alt, className = '', onClick }) => {
  const { getScreenshotUrl } = useJournal();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      // Guard: empty or invalid key → show placeholder immediately
      if (!storageKey || storageKey.trim() === '' || storageKey.startsWith('{')) {
        if (isMounted) { setError(true); setLoading(false); }
        return;
      }

      try {
        setLoading(true);
        setError(false);

        // Inline data URLs render directly
        if (storageKey.startsWith('data:')) {
          if (isMounted) { setImageUrl(storageKey); }
          return;
        }

        // Full HTTP URLs render directly
        if (storageKey.startsWith('http')) {
          if (isMounted) { setImageUrl(storageKey); }
          return;
        }

        const url = await getScreenshotUrl(storageKey);
        if (url && isMounted) {
          setImageUrl(url);
        } else if (isMounted) {
          setError(true);
        }
      } catch {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImage();
    return () => { isMounted = false; };
  }, [storageKey]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-xs ${className}`}>
        <div className="flex flex-col items-center gap-1">
          <svg className="w-5 h-5 animate-spin text-slate-300" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-slate-100 border border-dashed border-slate-300 text-slate-400 text-xs p-3 rounded ${className}`}>
        <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-center leading-tight">
          No screenshot<br />
          <span className="text-[10px]">Re-upload on the trade form</span>
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={alt}
      className={`${className} cursor-pointer hover:opacity-95 transition-opacity`}
      onClick={onClick}
      loading="lazy"
      onError={() => setError(true)}
    />
  );
};
