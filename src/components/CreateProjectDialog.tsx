import React, { useState } from 'react';
import { Book, Film, Scroll, FileText, Check, Lock, X } from 'lucide-react';
import { ProjectType } from '../types';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';

interface CreateProjectDialogProps {
  onDismiss: () => void;
  onCreated: (projectId: number) => void;
  lang: string;
}

const COLOR_PALETTE = ['#6200EE', '#D32F2F', '#388E3C', '#1976D2', '#FBC02D', '#7B1FA2', '#808080', '#E5A93C'];

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ onDismiss, onCreated, lang }) => {
  const { primaryColor, surfaceColor, surfaceContainerHigh } = useTheme();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ProjectType>('BOOK');
  const [colorHex, setColorHex] = useState('#6200EE');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleCreate = () => {
    if (!title.trim()) return;
    const newProj = StorageService.createProject(
      title.trim(),
      type,
      colorHex,
      password.trim() || null
    );
    onCreated(newProj.id);
  };

  const types: { id: ProjectType; label: string; icon: React.ReactNode }[] = [
    { id: 'BOOK', label: l('cat_book', lang), icon: <Book className="w-4 h-4" /> },
    { id: 'SCREENPLAY', label: l('cat_screenplay', lang), icon: <Film className="w-4 h-4" /> },
    { id: 'STORY', label: l('cat_story', lang), icon: <Scroll className="w-4 h-4" /> },
    { id: 'TEXT', label: l('cat_text', lang), icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all flex flex-col"
        style={{
          backgroundColor: surfaceColor,
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--color-text)]">
            {l('create_proj_title', lang)}
          </h2>
          <button onClick={onDismiss} className="p-1 rounded-full text-[var(--color-text-sec)] hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
            {l('project_name_label', lang)}
          </label>
          <input
            type="text"
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder={l('proj_name_hint', lang)}
            className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)]"
            style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
          />
        </div>

        {/* Format Selector */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
            {l('select_format', lang)}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {types.map(t => {
              const isSel = type === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all active:scale-95"
                  style={{
                    backgroundColor: isSel ? `${primaryColor}20` : surfaceContainerHigh,
                    borderColor: isSel ? primaryColor : 'var(--color-border)',
                    color: isSel ? primaryColor : 'var(--color-text)'
                  }}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Palette Indicator */}
        <div className="mb-4">
          <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
            {l('cover_accent_color', lang)}
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {COLOR_PALETTE.map(hex => {
              const isSel = colorHex === hex;
              return (
                <button
                  key={hex}
                  onClick={() => setColorHex(hex)}
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-90"
                  style={{
                    backgroundColor: hex,
                    border: isSel ? '2.5px solid var(--color-text)' : '1px solid transparent'
                  }}
                >
                  {isSel && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Password Protection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-[var(--color-text-sec)] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              {l('access_password_optional', lang)}
            </label>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="text-[11px] font-medium"
              style={{ color: primaryColor }}
            >
              {showPassword ? (lang === 'ru' ? 'Убрать пароль' : 'Remove') : (lang === 'ru' ? '+ Защитить' : '+ Add password')}
            </button>
          </div>
          {showPassword && (
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={l('enter_password', lang)}
              className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)] mt-1 animate-fadeIn"
              style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {l('cancel', lang)}
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: primaryColor, color: '#000' }}
          >
            {l('create', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
