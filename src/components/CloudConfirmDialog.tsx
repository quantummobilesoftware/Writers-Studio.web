import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTheme } from './ThemeWrapper';

interface CloudConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const CloudConfirmDialog: React.FC<CloudConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel
}) => {
  const { surfaceColor, surfaceContainerLow, primaryColor } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-sm rounded-3xl p-5 shadow-2xl border flex flex-col space-y-4 animate-popIn"
        style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isDestructive ? 'bg-rose-500/15 text-rose-500' : 'bg-amber-500/15 text-amber-500'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-[var(--color-text)] leading-snug">{title}</h3>
            <p className="text-xs text-[var(--color-text-sec)] mt-1.5 leading-relaxed">{description}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[var(--color-text-sec)] hover:opacity-75 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2.5 rounded-xl border text-xs font-semibold text-[var(--color-text-sec)] hover:bg-white/5 transition-all"
            style={{ borderColor: 'var(--color-border)', backgroundColor: surfaceContainerLow }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 ${
              isDestructive
                ? 'bg-rose-600 text-white hover:bg-rose-700'
                : 'bg-[var(--color-primary)] text-black hover:opacity-90'
            }`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
