import React from 'react';
import { AutosaveStatus } from '../../context/JournalContext';

interface AutosaveBadgeProps {
  status: AutosaveStatus;
}

export const AutosaveBadge: React.FC<AutosaveBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'Saved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Saving...':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'Unsaved changes':
        return 'bg-amber-50 text-amber-800 border-amber-300';
      case 'Save failed':
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors ${getBadgeStyle()}`}>
      <span className="relative flex h-2 w-2">
        {status === 'Saving...' && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          status === 'Saved' ? 'bg-emerald-500' :
          status === 'Saving...' ? 'bg-amber-500' :
          status === 'Unsaved changes' ? 'bg-amber-500' : 'bg-rose-500'
        }`}></span>
      </span>
      <span>{status}</span>
    </div>
  );
};
