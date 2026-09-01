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
      try {
        setLoading(true);
        if (storageKey.startsWith('data:')) {
          if (isMounted) setImageUrl(storageKey);
          return;
        }

        const url = await getScreenshotUrl(storageKey);
        if (url && isMounted) {
          setImageUrl(url);
        } else if (isMounted) {
          setError(true);
        }
      } catch (err) {
        if (isMounted) setError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [storageKey]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-xs ${className}`}>
        Loading media...
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-slate-400 text-xs ${className}`}>
        Image unavailable
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
    />
  );
};
