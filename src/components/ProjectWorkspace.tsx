import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  FolderPlus,
  FilePlus,
  Home,
  ChevronRight,
  Folder as FolderIcon,
  FolderOpen,
  FileText,
  FileEdit,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  FolderInput,
  Edit2,
  Trash2,
  Clock,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus
} from 'lucide-react';
import { WorkspaceProject, Folder, Document } from '../types';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';
import { MoveDocumentDialog, MoveFolderDialog } from './MoveDialogs';
import { DocumentEditor } from './DocumentEditor';

interface ProjectWorkspaceProps {
  project: WorkspaceProject;
  onBack: () => void;
  selectedDoc: Document | null;
  onSelectDocument: (doc: Document) => void;
  onCloseDocument: () => void;
  onLaunchPrompter: () => void;
  lang: string;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  project,
  onBack,
  selectedDoc,
  onSelectDocument,
  onCloseDocument,
  onLaunchPrompter,
  lang
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const isRussian = lang === 'ru';

  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<Folder[]>(() => StorageService.getFolders(project.id));
  const [documents, setDocuments] = useState<Document[]>(() => StorageService.getDocuments(project.id));
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [workspaceSortBy, setWorkspaceSortBy] = useState<string>('MANUAL');

  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocIsPlain, setNewDocIsPlain] = useState(false);

  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  const [renameFolderText, setRenameFolderText] = useState('');

  const [docToRename, setDocToRename] = useState<Document | null>(null);
  const [renameDocText, setRenameDocText] = useState('');

  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [docToDelete, setDocToDelete] = useState<Document | null>(null);

  const [docToMove, setDocToMove] = useState<Document | null>(null);
  const [folderToMove, setFolderToMove] = useState<Folder | null>(null);

  const [quickDropDoc, setQuickDropDoc] = useState<Document | null>(null);
  const [quickDropFolder, setQuickDropFolder] = useState<Folder | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Subscribe to changes
  React.useEffect(() => {
    return StorageService.subscribe(() => {
      setFolders(StorageService.getFolders(project.id));
      setDocuments(StorageService.getDocuments(project.id));
    });
  }, [project.id]);

  // Active folder object
  const activeFolder = useMemo(() => {
    return activeFolderId ? folders.find(f => f.id === activeFolderId) || null : null;
  }, [activeFolderId, folders]);

  // Breadcrumbs trail
  const breadcrumbTrail = useMemo(() => {
    const trail: Folder[] = [];
    let curr = activeFolder;
    while (curr) {
      trail.unshift(curr);
      curr = curr.parentFolderId ? folders.find(f => f.id === curr!.parentFolderId) || null : null;
    }
    return trail;
  }, [activeFolder, folders]);

  // Current level items
  const currentFolders = useMemo(() => {
    const raw = folders.filter(f => f.parentFolderId === (activeFolder ? activeFolder.id : null));
    switch (workspaceSortBy) {
      case 'NAME_ASC': return [...raw].sort((a, b) => a.name.localeCompare(b.name));
      case 'NAME_DESC': return [...raw].sort((a, b) => b.name.localeCompare(a.name));
      case 'DATE_CREATED_DESC': return [...raw].sort((a, b) => b.createdAt - a.createdAt);
      case 'DATE_CREATED_ASC': return [...raw].sort((a, b) => a.createdAt - b.createdAt);
      default: return [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }, [folders, activeFolder, workspaceSortBy]);

  const currentDocs = useMemo(() => {
    const raw = documents.filter(d => d.folderId === (activeFolder ? activeFolder.id : null));
    switch (workspaceSortBy) {
      case 'NAME_ASC': return [...raw].sort((a, b) => a.title.localeCompare(b.title));
      case 'NAME_DESC': return [...raw].sort((a, b) => b.title.localeCompare(a.title));
      case 'DATE_CREATED_DESC': return [...raw].sort((a, b) => b.createdAt - a.createdAt);
      case 'DATE_CREATED_ASC': return [...raw].sort((a, b) => a.createdAt - b.createdAt);
      case 'DATE_MODIFIED_DESC': return [...raw].sort((a, b) => b.updatedAt - a.updatedAt);
      default: return [...raw].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }, [documents, activeFolder, workspaceSortBy]);

  const handleBack = () => {
    if (activeFolder) {
      setActiveFolderId(activeFolder.parentFolderId);
    } else {
      onBack();
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    StorageService.createFolder(project.id, newFolderName.trim(), activeFolder ? activeFolder.id : null);
    setNewFolderName('');
    setShowCreateFolder(false);
  };

  const handleCreateDocument = () => {
    if (!newDocName.trim()) return;
    const doc = StorageService.createDocument(
      project.id,
      activeFolder ? activeFolder.id : null,
      newDocName.trim(),
      newDocIsPlain
    );
    setNewDocName('');
    setShowCreateDoc(false);
    onSelectDocument(doc);
  };

  const handleFolderClick = (folder: Folder) => {
    if (quickDropDoc) {
      StorageService.updateDocument({ ...quickDropDoc, folderId: folder.id });
      setQuickDropDoc(null);
    } else if (quickDropFolder) {
      if (quickDropFolder.id !== folder.id) {
        StorageService.updateFolder({ ...quickDropFolder, parentFolderId: folder.id });
      }
      setQuickDropFolder(null);
    } else {
      setActiveFolderId(folder.id);
    }
  };

  const moveFolderOrder = (f: Folder, up: boolean) => {
    const list = [...currentFolders];
    const idx = list.findIndex(x => x.id === f.id);
    if (idx === -1) return;
    const targetIdx = up ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    list.forEach((item, i) => {
      StorageService.updateFolder({ ...item, sortOrder: i });
    });
  };

  const moveDocOrder = (d: Document, up: boolean) => {
    const list = [...currentDocs];
    const idx = list.findIndex(x => x.id === d.id);
    if (idx === -1) return;
    const targetIdx = up ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;
    list.forEach((item, i) => {
      StorageService.updateDocument({ ...item, sortOrder: i });
    });
  };

  // If on mobile screen and a document is selected, render DocumentEditor full screen
  if (selectedDoc && typeof window !== 'undefined' && window.innerWidth < 1024) {
    return (
      <DocumentEditor
        document={selectedDoc}
        onBack={onCloseDocument}
        onLaunchPrompter={onLaunchPrompter}
        lang={lang}
      />
    );
  }

  return (
    <div className="flex-1 flex h-full overflow-hidden relative">
      {/* Left Explorer Pane (Desktop & Mobile) */}
      <div
        className={`flex flex-col h-full border-r border-[var(--color-border)] shrink-0 transition-all duration-300 ${
          selectedDoc && !isSidebarOpen ? 'w-0 hidden' : 'w-full lg:w-80 xl:w-96'
        }`}
        style={{ backgroundColor: surfaceContainerLow }}
      >
        {/* Left Explorer Header */}
        <header className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between shrink-0 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={handleBack}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
              style={{ backgroundColor: surfaceContainerHigh }}
              title="Back"
            >
              <ArrowLeft className="w-4 h-4 text-[var(--color-text)]" />
            </button>

            <div className="min-w-0">
              <h2 className="font-bold text-sm text-[var(--color-text)] truncate flex items-center gap-1.5">
                <span className="truncate">{project.title}</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-text-sec)]">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: project.colorHex || primaryColor }} />
                <span className="font-semibold uppercase">{l(`cat_${project.type.toLowerCase()}`, lang)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => setShowCreateFolder(true)}
              className="p-2 rounded-xl text-[var(--color-text-sec)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
              title={l('create_folder_title', lang)}
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowCreateDoc(true)}
              className="p-2 rounded-xl text-[var(--color-text-sec)] hover:text-[var(--color-primary)] hover:bg-[var(--color-border)] transition-colors"
              title={l('create_doc_title', lang)}
            >
              <FilePlus className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Breadcrumb Trail */}
        <div className="px-3 py-2 border-b border-[var(--color-border)]/60 flex items-center gap-1 overflow-x-auto text-[11px] bg-[var(--color-surface-low)]">
          <button
            onClick={() => setActiveFolderId(null)}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${activeFolderId === null ? 'font-bold' : 'text-[var(--color-text-sec)]'}`}
            style={{ color: activeFolderId === null ? primaryColor : undefined }}
          >
            <Home className="w-3 h-3" />
            <span>{l('project_root', lang)}</span>
          </button>

          {breadcrumbTrail.map(crumb => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3 h-3 text-[var(--color-text-sec)] opacity-40 shrink-0" />
              <button
                onClick={() => setActiveFolderId(crumb.id)}
                className="font-medium text-[var(--color-text-sec)] hover:text-[var(--color-primary)] truncate max-w-[90px]"
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Quick Drop Mode Notification */}
        {(quickDropDoc || quickDropFolder) && (
          <div
            className="p-2.5 mx-3 mt-2 rounded-xl border flex items-center justify-between text-xs animate-fadeIn"
            style={{ backgroundColor: `${primaryColor}15`, borderColor: primaryColor }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <FolderInput className="w-3.5 h-3.5 shrink-0" style={{ color: primaryColor }} />
              <span className="truncate text-[11px]">
                {quickDropDoc ? `"${quickDropDoc.title}"` : `"${quickDropFolder?.name}"`}
              </span>
            </div>
            <button
              onClick={() => {
                setQuickDropDoc(null);
                setQuickDropFolder(null);
              }}
              className="p-1 text-[var(--color-text-sec)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Items List in Explorer */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          {/* Folders */}
          {currentFolders.map(fold => (
            <div
              key={`fold_${fold.id}`}
              onClick={() => handleFolderClick(fold)}
              className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer hover:border-[var(--color-primary)] transition-all group"
              style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <FolderIcon className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="font-semibold text-xs text-[var(--color-text)] truncate">{fold.name}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-sec)] opacity-50 group-hover:opacity-100" />
            </div>
          ))}

          {/* Documents */}
          {currentDocs.map(doc => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={`doc_${doc.id}`}
                onClick={() => onSelectDocument(doc)}
                className="p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all relative pl-3.5"
                style={{
                  backgroundColor: isSelected ? `${primaryColor}20` : surfaceColor,
                  borderColor: isSelected ? primaryColor : 'var(--color-border)'
                }}
              >
                {/* Left active marker */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
                  style={{ backgroundColor: isSelected ? primaryColor : 'transparent' }}
                />

                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {doc.isPlainText ? (
                    <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                  ) : (
                    <FileEdit className="w-4 h-4 shrink-0" style={{ color: primaryColor }} />
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-[var(--color-text)] truncate">{doc.title}</div>
                    <div className="text-[10px] text-[var(--color-text-sec)]">
                      {doc.isPlainText ? 'TXT' : 'Screenplay'} • {new Date(doc.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setDocToRename(doc);
                      setRenameDocText(doc.title);
                    }}
                    className="p-1 rounded text-[var(--color-text-sec)] hover:opacity-80"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setDocToDelete(doc)}
                    className="p-1 rounded text-[var(--color-text-sec)] hover:text-rose-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {currentFolders.length === 0 && currentDocs.length === 0 && (
            <div className="text-center py-10 px-4 text-xs text-[var(--color-text-sec)]">
              {isRussian ? 'В этой папке пока пусто' : 'This folder is empty'}
            </div>
          )}
        </div>

        {/* Explorer Bottom New Item Quick Button */}
        <div className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
          <button
            onClick={() => setShowCreateDoc(true)}
            className="w-full py-2 px-3 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            <Plus className="w-4 h-4" />
            <span>{l('create_doc_title', lang)}</span>
          </button>
        </div>
      </div>

      {/* Right Stage Pane (Desktop Split Screen) */}
      <div className="hidden lg:flex flex-1 flex-col h-full overflow-hidden relative bg-[var(--color-bg)]">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Desktop Panel Toggle Bar */}
            <div className="absolute top-3 left-3 z-30">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl border shadow-sm transition-all hover:opacity-80"
                style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
                title={isSidebarOpen ? 'Collapse Project Explorer' : 'Expand Project Explorer'}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
            </div>

            <DocumentEditor
              document={selectedDoc}
              onBack={onCloseDocument}
              onLaunchPrompter={onLaunchPrompter}
              lang={lang}
            />
          </div>
        ) : (
          /* Desktop Welcome / Empty Selection Stage */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-lg border"
              style={{ backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}40`, color: primaryColor }}
            >
              <FileEdit className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">
              {project.title}
            </h2>
            <p className="text-xs text-[var(--color-text-sec)] mb-6 leading-relaxed">
              {isRussian
                ? 'Выберите документ из списка слева, чтобы продолжить работу, или создайте новый черновик сцены.'
                : 'Select a document from the left explorer to continue writing, or create a new scene draft.'}
            </p>

            <button
              onClick={() => setShowCreateDoc(true)}
              className="px-6 py-3 rounded-2xl text-xs font-bold shadow-md transition-all hover:scale-102 active:scale-95 flex items-center gap-2"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              <Plus className="w-4 h-4" />
              <span>{l('create_doc_title', lang)}</span>
            </button>
          </div>
        )}
      </div>

      {/* Dialogs: Create Folder */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
              <FolderPlus className="w-4 h-4" style={{ color: primaryColor }} />
              <span>{l('create_folder_title', lang)}</span>
            </h3>
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
              placeholder={l('folder_name', lang)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {l('create', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog: Create Document */}
      {showCreateDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
              <FilePlus className="w-4 h-4" style={{ color: primaryColor }} />
              <span>{l('create_doc_title', lang)}</span>
            </h3>
            <input
              type="text"
              autoFocus
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              placeholder={l('doc_name', lang)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
            />

            <div>
              <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                {l('select_editor_mode', lang)}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewDocIsPlain(false)}
                  className="flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all"
                  style={{
                    backgroundColor: !newDocIsPlain ? `${primaryColor}25` : surfaceContainerHigh,
                    borderColor: !newDocIsPlain ? primaryColor : 'var(--color-border)',
                    color: !newDocIsPlain ? primaryColor : 'var(--color-text-sec)'
                  }}
                >
                  {l('type_doc', lang)}
                </button>
                <button
                  type="button"
                  onClick={() => setNewDocIsPlain(true)}
                  className="flex-1 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all"
                  style={{
                    backgroundColor: newDocIsPlain ? `${primaryColor}25` : surfaceContainerHigh,
                    borderColor: newDocIsPlain ? primaryColor : 'var(--color-border)',
                    color: newDocIsPlain ? primaryColor : 'var(--color-text-sec)'
                  }}
                >
                  {l('type_txt', lang)}
                </button>
              </div>
              <p className="text-[11px] text-[var(--color-text-sec)] mt-1.5 opacity-80">
                {newDocIsPlain ? l('basic_mode_desc', lang) : l('pro_mode_desc', lang)}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCreateDoc(false)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={handleCreateDocument}
                disabled={!newDocName.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {l('create', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Document Dialog */}
      {docToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              {lang === 'ru' ? 'Переименовать документ' : 'Rename Document'}
            </h3>
            <input
              type="text"
              autoFocus
              value={renameDocText}
              onChange={e => setRenameDocText(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setDocToRename(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={() => {
                  if (renameDocText.trim()) {
                    StorageService.updateDocument({ ...docToRename, title: renameDocText.trim() });
                    setDocToRename(null);
                  }
                }}
                disabled={!renameDocText.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {lang === 'ru' ? 'Сохранить' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Dialog */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-rose-500">
              {lang === 'ru' ? 'Удалить документ?' : 'Delete Document?'}
            </h3>
            <p className="text-xs text-[var(--color-text-sec)]">
              {lang === 'ru'
                ? `Вы уверены, что хотите удалить документ "${docToDelete.title}"?`
                : `Are you sure you want to delete "${docToDelete.title}"?`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={() => {
                  StorageService.deleteDocument(docToDelete.id);
                  if (selectedDoc?.id === docToDelete.id) onCloseDocument();
                  setDocToDelete(null);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md active:scale-95"
              >
                {l('delete', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Document Dialog */}
      {docToMove && (
        <MoveDocumentDialog
          doc={docToMove}
          folders={folders}
          lang={lang}
          onDismiss={() => setDocToMove(null)}
          onConfirmMove={(targetFolderId) => {
            StorageService.updateDocument({ ...docToMove, folderId: targetFolderId });
            setDocToMove(null);
          }}
          onCreateNewFolder={(name) => {
            StorageService.createFolder(project.id, name, activeFolder ? activeFolder.id : null);
          }}
        />
      )}

      {/* Move Folder Dialog */}
      {folderToMove && (
        <MoveFolderDialog
          folder={folderToMove}
          folders={folders}
          lang={lang}
          onDismiss={() => setFolderToMove(null)}
          onConfirmMove={(targetParentId) => {
            StorageService.updateFolder({ ...folderToMove, parentFolderId: targetParentId });
            setFolderToMove(null);
          }}
          onCreateNewFolder={(name) => {
            StorageService.createFolder(project.id, name, activeFolder ? activeFolder.id : null);
          }}
        />
      )}
    </div>
  );
};
