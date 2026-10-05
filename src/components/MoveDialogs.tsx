import React, { useState, useMemo } from 'react';
import { Folder as FolderIcon, Home, CheckCircle, Plus, X, FolderInput } from 'lucide-react';
import { Document, Folder } from '../types';
import { StorageService } from '../services/storage';
import { useTheme } from './ThemeWrapper';

interface MoveDocumentDialogProps {
  doc: Document;
  folders: Folder[];
  lang: string;
  onDismiss: () => void;
  onConfirmMove: (targetFolderId: number | null, targetFolderName: string) => void;
  onCreateNewFolder: (name: string) => void;
}

export const MoveDocumentDialog: React.FC<MoveDocumentDialogProps> = ({
  doc,
  folders,
  lang,
  onDismiss,
  onConfirmMove,
  onCreateNewFolder
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const [selectedId, setSelectedId] = useState<number | null>(doc.folderId);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    return folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [folders, search]);

  const getFolderPath = (folderId: number | null): string => {
    if (!folderId) return '';
    const names: string[] = [];
    let curr = folders.find(f => f.id === folderId);
    while (curr) {
      names.unshift(curr.name);
      curr = curr.parentFolderId ? folders.find(f => f.id === curr!.parentFolderId) : undefined;
    }
    return names.join(' / ');
  };

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    onCreateNewFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: surfaceColor,
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <FolderInput className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-[var(--color-text)] truncate">
              {lang === 'ru' ? 'Переместить документ' : 'Move Document'}
            </h3>
            <p className="text-xs text-[var(--color-text-sec)] truncate">{doc.title}</p>
          </div>
          <button onClick={onDismiss} className="p-1 rounded-full text-[var(--color-text-sec)] hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Folder Inline */}
        {showCreate ? (
          <div
            className="flex items-center gap-2 p-2.5 rounded-xl border mb-3"
            style={{ backgroundColor: surfaceContainerHigh, borderColor: `${primaryColor}40` }}
          >
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder={lang === 'ru' ? 'Имя новой папки' : 'New folder name'}
              className="flex-1 bg-transparent text-xs outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!newFolderName.trim()}
              className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              {lang === 'ru' ? 'Создать' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="p-1 text-[var(--color-text-sec)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl border border-dashed text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? '+ Создать новую папку' : '+ Create New Folder'}</span>
          </button>
        )}

        {/* Search */}
        {folders.length > 3 && (
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === 'ru' ? 'Поиск папки...' : 'Search folder...'}
            className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none mb-3"
            style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
          />
        )}

        {/* Folders List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Root Level Option */}
          <div
            onClick={() => setSelectedId(null)}
            className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-98"
            style={{
              backgroundColor: selectedId === null ? `${primaryColor}15` : surfaceContainerLow,
              borderColor: selectedId === null ? primaryColor : 'var(--color-border)'
            }}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4" style={{ color: selectedId === null ? primaryColor : 'var(--color-text-sec)' }} />
              <div>
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  {lang === 'ru' ? 'Корень проекта (без папки)' : 'Project Root (no folder)'}
                </div>
                {doc.folderId === null && (
                  <div className="text-[10px] text-emerald-500 font-medium">
                    {lang === 'ru' ? 'Текущее расположение' : 'Current location'}
                  </div>
                )}
              </div>
            </div>
            {selectedId === null && <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />}
          </div>

          {/* Folder Options */}
          {filteredFolders.map(folder => {
            const isChosen = selectedId === folder.id;
            const isCurrent = doc.folderId === folder.id;
            const fullPath = getFolderPath(folder.id);

            return (
              <div
                key={folder.id}
                onClick={() => setSelectedId(folder.id)}
                className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-98"
                style={{
                  backgroundColor: isChosen ? `${primaryColor}15` : surfaceContainerLow,
                  borderColor: isChosen ? primaryColor : 'var(--color-border)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderIcon className="w-4 h-4 shrink-0" style={{ color: isChosen ? primaryColor : 'var(--color-text-sec)' }} />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[var(--color-text)] truncate">{folder.name}</div>
                    {fullPath !== folder.name && (
                      <div className="text-[10px] text-[var(--color-text-sec)] truncate">📁 {fullPath}</div>
                    )}
                    {isCurrent && (
                      <div className="text-[10px] text-emerald-500 font-medium">
                        {lang === 'ru' ? 'Текущее расположение' : 'Current location'}
                      </div>
                    )}
                  </div>
                </div>
                {isChosen && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />}
              </div>
            );
          })}
        </div>

        {/* Confirm Move */}
        <div className="flex gap-2.5 pt-4 mt-2 border-t border-[var(--color-border)]">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              const targetName = selectedId === null
                ? (lang === 'ru' ? 'Корень проекта' : 'project root')
                : (folders.find(f => f.id === selectedId)?.name || '');
              onConfirmMove(selectedId, targetName);
            }}
            disabled={selectedId === doc.folderId}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: primaryColor, color: '#000' }}
          >
            {selectedId === doc.folderId
              ? (lang === 'ru' ? 'Уже здесь' : 'Already here')
              : (lang === 'ru' ? 'Переместить' : 'Move')}
          </button>
        </div>
      </div>
    </div>
  );
};

interface MoveFolderDialogProps {
  folder: Folder;
  folders: Folder[];
  lang: string;
  onDismiss: () => void;
  onConfirmMove: (targetParentId: number | null, targetParentName: string) => void;
  onCreateNewFolder: (name: string) => void;
}

export const MoveFolderDialog: React.FC<MoveFolderDialogProps> = ({
  folder,
  folders,
  lang,
  onDismiss,
  onConfirmMove,
  onCreateNewFolder
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const [selectedParentId, setSelectedParentId] = useState<number | null>(folder.parentFolderId);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Cycle prevention: get all descendant IDs of this folder
  const descendantIds = useMemo(() => {
    const set = new Set<number>([folder.id]);
    let added = true;
    while (added) {
      added = false;
      folders.forEach(f => {
        if (f.parentFolderId && set.has(f.parentFolderId) && !set.has(f.id)) {
          set.add(f.id);
          added = true;
        }
      });
    }
    return set;
  }, [folder.id, folders]);

  const availableFolders = useMemo(() => {
    const valid = folders.filter(f => !descendantIds.has(f.id));
    if (!search.trim()) return valid;
    return valid.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [folders, descendantIds, search]);

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    onCreateNewFolder(newFolderName.trim());
    setNewFolderName('');
    setShowCreate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all flex flex-col max-h-[85vh]"
        style={{
          backgroundColor: surfaceColor,
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <FolderInput className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-[var(--color-text)] truncate">
              {lang === 'ru' ? 'Переместить папку' : 'Move Folder'}
            </h3>
            <p className="text-xs text-[var(--color-text-sec)] truncate">{folder.name}</p>
          </div>
          <button onClick={onDismiss} className="p-1 rounded-full text-[var(--color-text-sec)] hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create Folder Inline */}
        {showCreate ? (
          <div
            className="flex items-center gap-2 p-2.5 rounded-xl border mb-3"
            style={{ backgroundColor: surfaceContainerHigh, borderColor: `${primaryColor}40` }}
          >
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder={lang === 'ru' ? 'Имя новой папки' : 'New folder name'}
              className="flex-1 bg-transparent text-xs outline-none"
            />
            <button
              onClick={handleCreate}
              disabled={!newFolderName.trim()}
              className="px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              {lang === 'ru' ? 'Создать' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="p-1 text-[var(--color-text-sec)]">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 mb-3 rounded-xl border border-dashed text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? '+ Создать новую папку' : '+ Create New Folder'}</span>
          </button>
        )}

        {/* Folders List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {/* Root level option */}
          <div
            onClick={() => setSelectedParentId(null)}
            className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-98"
            style={{
              backgroundColor: selectedParentId === null ? `${primaryColor}15` : surfaceContainerLow,
              borderColor: selectedParentId === null ? primaryColor : 'var(--color-border)'
            }}
          >
            <div className="flex items-center gap-3">
              <Home className="w-4 h-4" style={{ color: selectedParentId === null ? primaryColor : 'var(--color-text-sec)' }} />
              <div>
                <div className="font-semibold text-xs text-[var(--color-text)]">
                  {lang === 'ru' ? 'Корень проекта (верхний уровень)' : 'Project Root (top level)'}
                </div>
                {folder.parentFolderId === null && (
                  <div className="text-[10px] text-emerald-500 font-medium">
                    {lang === 'ru' ? 'Текущее расположение' : 'Current location'}
                  </div>
                )}
              </div>
            </div>
            {selectedParentId === null && <CheckCircle className="w-4 h-4" style={{ color: primaryColor }} />}
          </div>

          {availableFolders.map(targetFold => {
            const isChosen = selectedParentId === targetFold.id;
            const isCurrent = folder.parentFolderId === targetFold.id;

            return (
              <div
                key={targetFold.id}
                onClick={() => setSelectedParentId(targetFold.id)}
                className="flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all active:scale-98"
                style={{
                  backgroundColor: isChosen ? `${primaryColor}15` : surfaceContainerLow,
                  borderColor: isChosen ? primaryColor : 'var(--color-border)'
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FolderIcon className="w-4 h-4 shrink-0" style={{ color: isChosen ? primaryColor : 'var(--color-text-sec)' }} />
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-[var(--color-text)] truncate">{targetFold.name}</div>
                    {isCurrent && (
                      <div className="text-[10px] text-emerald-500 font-medium">
                        {lang === 'ru' ? 'Текущее расположение' : 'Current location'}
                      </div>
                    )}
                  </div>
                </div>
                {isChosen && <CheckCircle className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-2.5 pt-4 mt-2 border-t border-[var(--color-border)]">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {lang === 'ru' ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              const targetName = selectedParentId === null
                ? (lang === 'ru' ? 'Корень проекта' : 'project root')
                : (folders.find(f => f.id === selectedParentId)?.name || '');
              onConfirmMove(selectedParentId, targetName);
            }}
            disabled={selectedParentId === folder.parentFolderId}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-40"
            style={{ backgroundColor: primaryColor, color: '#000' }}
          >
            {selectedParentId === folder.parentFolderId
              ? (lang === 'ru' ? 'Уже здесь' : 'Already here')
              : (lang === 'ru' ? 'Переместить' : 'Move')}
          </button>
        </div>
      </div>
    </div>
  );
};
