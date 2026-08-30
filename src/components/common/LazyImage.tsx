import React, { useState, useEffect } from 'react';
import { useJournal } from '../../context/JournalContext';

interface LazyImageProps {
  storageKey: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({ storageKey, alt, className = '', onClick }) => {
  const { getScreenshotBlob } = useJournal();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let url: string | null = null;

    const loadBlob = async () => {
      try {
        setLoading(true);
        const blob = await getScreenshotBlob(storageKey);
        if (blob && isMounted) {
          url = URL.createObjectURL(blob);
          setObjectUrl(url);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadBlob();

    return () => {
      isMounted = false;
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [storageKey]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-xs ${className}`}>
        Loading media...
      </div>
    );
  }

  if (error || !objectUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs ${className}`}>
        Image unavailable
      </div>
    );
  }

  return (
    <img
      src={objectUrl}
      alt={alt}
      className={`${className} cursor-pointer hover:opacity-95 transition-opacity`}
      onClick={onClick}
      loading="lazy"
    />
  );
};
