import React, { useState, useMemo, useEffect } from 'react';
import {
  PenTool,
  Search,
  FolderOpen,
  Star,
  Archive,
  Trash2,
  Lock,
  Plus,
  Edit2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Sparkles,
  User,
  X,
  FileText,
  Calendar,
  Grid3X3,
  List
} from 'lucide-react';
import { WorkspaceProject, ProjectType, Document } from '../types';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';
import { CreateProjectDialog } from './CreateProjectDialog';
import { AccountProfileDialog } from './AccountProfileDialog';

interface ProjectsDashboardProps {
  onSelectProject: (project: WorkspaceProject) => void;
  lang: string;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({ onSelectProject, lang }) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();

  const [projects, setProjects] = useState<WorkspaceProject[]>(() => StorageService.getProjects());
  const [documents, setDocuments] = useState<Document[]>(() => StorageService.getDocuments());
  const [subTab, setSubTab] = useState<'ACTIVE' | 'FAVORITES' | 'ARCHIVE' | 'TRASH'>('ACTIVE');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'MANUAL' | 'UPDATED' | 'NAME' | 'CREATED'>('MANUAL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | ProjectType>('ALL');
  const [viewLayout, setViewLayout] = useState<'GRID' | 'LIST'>('GRID');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const [longPressProj, setLongPressProj] = useState<WorkspaceProject | null>(null);
  const [projectToRename, setProjectToRename] = useState<WorkspaceProject | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const [projectToUnlock, setProjectToUnlock] = useState<WorkspaceProject | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState<WorkspaceProject | null>(null);
  const [isHardDelete, setIsHardDelete] = useState(false);

  const authorAvatar = StorageService.getAuthorAvatar();
  const interfaceStyle = StorageService.getInterfaceStyle();

  // Reload data on storage event
  useEffect(() => {
    return StorageService.subscribe(() => {
      setProjects(StorageService.getProjects());
      setDocuments(StorageService.getDocuments());
    });
  }, []);

  // Desktop keyboard shortcuts: Ctrl/Cmd+N creates project, / focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setShowCreateModal(true);
      } else if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (subTab === 'ACTIVE') {
      list = list.filter(p => !p.isArchived && !p.isInTrash);
    } else if (subTab === 'FAVORITES') {
      list = list.filter(p => p.isFavorite && !p.isInTrash);
    } else if (subTab === 'ARCHIVE') {
      list = list.filter(p => p.isArchived && !p.isInTrash);
    } else if (subTab === 'TRASH') {
      list = list.filter(p => p.isInTrash);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter(p => p.type === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.type.toLowerCase().includes(q));
    }

    switch (sortBy) {
      case 'NAME':
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      case 'CREATED':
        return [...list].sort((a, b) => a.createdAt - b.createdAt);
      case 'UPDATED':
        return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
      case 'MANUAL':
      default:
        return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
    }
  }, [projects, subTab, categoryFilter, searchQuery, sortBy]);

  const handleProjectClick = (p: WorkspaceProject) => {
    if (p.passwordHash) {
      setProjectToUnlock(p);
      setUnlockPassword('');
      setUnlockError(false);
    } else {
      onSelectProject(p);
    }
  };

  const handleUnlockConfirm = () => {
    if (!projectToUnlock) return;
    if (projectToUnlock.passwordHash === unlockPassword) {
      const target = projectToUnlock;
      setProjectToUnlock(null);
      onSelectProject(target);
    } else {
      setUnlockError(true);
    }
  };

  const toggleFavorite = (p: WorkspaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.updateProject({ ...p, isFavorite: !p.isFavorite });
  };

  const toggleArchive = (p: WorkspaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.updateProject({ ...p, isArchived: !p.isArchived });
  };

  const sendToTrash = (p: WorkspaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(p);
    setIsHardDelete(false);
  };

  const restoreFromTrash = (p: WorkspaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    StorageService.updateProject({ ...p, isInTrash: false });
  };

  const permanentDelete = (p: WorkspaceProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjectToDelete(p);
    setIsHardDelete(true);
  };

  const moveProject = (p: WorkspaceProject, up: boolean) => {
    const list = [...filteredProjects];
    const idx = list.findIndex(item => item.id === p.id);
    if (idx === -1) return;
    const targetIdx = up ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    list.forEach((item, i) => {
      StorageService.updateProject({ ...item, sortOrder: i });
    });
    setLongPressProj(null);
  };

  const handleConfirmRename = () => {
    if (projectToRename && newTitle.trim()) {
      StorageService.updateProject({ ...projectToRename, title: newTitle.trim() });
      setProjectToRename(null);
      setNewTitle('');
    }
  };

  const handleConfirmDelete = () => {
    if (!projectToDelete) return;
    if (isHardDelete) {
      StorageService.deleteProject(projectToDelete.id);
    } else {
      StorageService.updateProject({ ...projectToDelete, isInTrash: true });
    }
    setProjectToDelete(null);
  };

  const getProjectDocCount = (projId: number) => {
    return documents.filter(d => d.projectId === projId).length;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Top Desktop & Mobile Header Bar */}
      <header className="px-4 py-3 sm:px-8 flex items-center justify-between border-b border-[var(--color-border)] shrink-0 bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          {/* Mobile Profile Avatar Button */}
          <button
            onClick={() => setShowAccountModal(true)}
            className="md:hidden w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-transform active:scale-95 shadow-xs"
            style={{ borderColor: `${primaryColor}80`, backgroundColor: surfaceContainerLow }}
          >
            {authorAvatar ? (
              <img src={authorAvatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5" style={{ color: primaryColor }} />
            )}
          </button>

          <div className="flex items-center gap-2.5">
            <div
              className="hidden md:flex w-9 h-9 rounded-xl items-center justify-center shadow-xs"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--color-text)]">
                {l('cabinet', lang)}
              </h1>
              <p className="hidden sm:block text-[11px] text-[var(--color-text-sec)]">
                {lang === 'ru' ? 'Ваши литературные проекты и рукописи' : 'Your literary projects & manuscripts'}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Quick Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle for Desktop */}
          <div className="hidden sm:flex rounded-xl p-1 border gap-1" style={{ borderColor: 'var(--color-border)', backgroundColor: surfaceContainerLow }}>
            <button
              onClick={() => setViewLayout('GRID')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'GRID' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-sec)]'}`}
              title="Grid View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('LIST')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'LIST' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-sec)]'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Search Toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="h-10 px-3.5 rounded-xl flex items-center gap-2 border text-xs font-semibold transition-all active:scale-95"
            style={{
              backgroundColor: isSearchOpen ? `${primaryColor}20` : surfaceContainerLow,
              borderColor: isSearchOpen ? primaryColor : 'var(--color-border)',
              color: isSearchOpen ? primaryColor : 'var(--color-text)'
            }}
          >
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">{l('search', lang)}</span>
            <kbd className="hidden lg:inline px-1.5 py-0.5 rounded text-[10px] opacity-40 font-mono bg-[var(--color-border)]">/</kbd>
          </button>

          {/* Direct Create Project Button for Desktop */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="h-10 px-4 rounded-xl text-xs font-bold shadow-md transition-all hover:scale-102 active:scale-95 flex items-center gap-2"
            style={{ backgroundColor: primaryColor, color: '#000' }}
          >
            <Plus className="w-4 h-4" />
            <span>{l('new_project', lang)}</span>
            <kbd className="hidden xl:inline px-1 py-0.2 rounded text-[9px] bg-black/20 font-mono">Ctrl+N</kbd>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-8 space-y-4 max-w-7xl mx-auto w-full pb-28">
        {/* Search & Filter Panel */}
        {isSearchOpen && (
          <div
            className="rounded-3xl p-4 sm:p-5 border space-y-3.5 animate-fadeIn shadow-sm"
            style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>{l('search_filter', lang)}</span>
              </span>
              <button onClick={() => setIsSearchOpen(false)} className="text-[var(--color-text-sec)] hover:opacity-80">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={l('search_placeholder', lang)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-xs sm:text-sm outline-none border transition-all focus:border-[var(--color-primary)]"
                style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
              />
              <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--color-text-sec)]" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-[var(--color-text-sec)] hover:opacity-80"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
              {/* Sorters */}
              <div className="flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-[var(--color-text-sec)] shrink-0 font-medium">{l('sort_by', lang)}</span>
                {[
                  { id: 'MANUAL', label: lang === 'ru' ? 'Вручную' : 'Manual' },
                  { id: 'UPDATED', label: l('sort_changed', lang) },
                  { id: 'NAME', label: l('sort_name', lang) },
                  { id: 'CREATED', label: l('sort_created', lang) }
                ].map(s => {
                  const isSel = sortBy === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSortBy(s.id as any)}
                      className="px-3 py-1 rounded-xl border font-semibold shrink-0 transition-colors"
                      style={{
                        backgroundColor: isSel ? `${primaryColor}20` : 'transparent',
                        borderColor: isSel ? primaryColor : 'var(--color-border)',
                        color: isSel ? primaryColor : 'var(--color-text)'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[var(--color-text-sec)] shrink-0 font-medium">{l('category', lang)}</span>
                {[
                  { id: 'ALL', label: l('cat_all', lang) },
                  { id: 'BOOK', label: l('cat_book', lang) },
                  { id: 'SCREENPLAY', label: l('cat_screenplay', lang) },
                  { id: 'STORY', label: l('cat_story', lang) },
                  { id: 'TEXT', label: l('cat_text', lang) }
                ].map(c => {
                  const isSel = categoryFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategoryFilter(c.id as any)}
                      className="px-3 py-1 rounded-xl border font-semibold shrink-0 transition-colors"
                      style={{
                        backgroundColor: isSel ? `${primaryColor}20` : 'transparent',
                        borderColor: isSel ? primaryColor : 'var(--color-border)',
                        color: isSel ? primaryColor : 'var(--color-text)'
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Sub-Tabs: Active, Favorites, Archive, Trash */}
        {interfaceStyle === 'PIXEL' ? (
          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {[
              { id: 'ACTIVE', label: l('projects', lang), icon: <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { id: 'FAVORITES', label: l('favorites', lang), icon: <Star className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { id: 'ARCHIVE', label: l('archive', lang), icon: <Archive className="w-4 h-4 sm:w-5 sm:h-5" /> },
              { id: 'TRASH', label: l('trash', lang), icon: <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" /> }
            ].map(tab => {
              const isSel = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id as any)}
                  className="py-3 sm:py-3.5 px-2 rounded-2xl flex flex-col items-center justify-center gap-1.5 border transition-all active:scale-98 shadow-xs"
                  style={{
                    backgroundColor: isSel ? primaryColor : surfaceContainerLow,
                    borderColor: isSel ? primaryColor : 'var(--color-border)',
                    color: isSel ? '#000' : 'var(--color-text-sec)'
                  }}
                >
                  {tab.icon}
                  <span className="text-xs sm:text-sm font-bold truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'ACTIVE', label: l('projects', lang) },
              { id: 'FAVORITES', label: l('favorites', lang) },
              { id: 'ARCHIVE', label: l('archive', lang) },
              { id: 'TRASH', label: l('trash', lang) }
            ].map(tab => {
              const isSel = subTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSubTab(tab.id as any)}
                  className="flex-1 py-2 px-4 rounded-xl border text-xs font-semibold shrink-0 transition-all"
                  style={{
                    backgroundColor: isSel ? `${primaryColor}20` : surfaceContainerLow,
                    borderColor: isSel ? primaryColor : 'var(--color-border)',
                    color: isSel ? primaryColor : 'var(--color-text-sec)'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Projects Grid / List View */}
        {filteredProjects.length === 0 ? (
          <div
            className="rounded-3xl p-10 border flex flex-col items-center justify-center text-center my-8 shadow-xs"
            style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-900/30 to-amber-700/20 flex items-center justify-center mb-4 relative shadow-inner">
              <FolderOpen className="w-12 h-12 text-[var(--color-primary)] opacity-80" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute top-2 right-2 animate-pulse" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[var(--color-text)] mb-1">
              {l('no_projects_yet', lang)}
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-sec)] max-w-sm mb-5">
              {l('create_first_project_desc', lang)}
            </p>
            {subTab === 'ACTIVE' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-3 rounded-2xl text-xs sm:text-sm font-bold shadow-md transition-all hover:scale-102 active:scale-95 flex items-center gap-2"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                <Plus className="w-4 h-4" />
                <span>{l('new_project', lang)}</span>
              </button>
            )}
          </div>
        ) : (
          <div className={viewLayout === 'GRID' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5' : 'space-y-2.5'}>
            {filteredProjects.map(proj => {
              const typeLabel = l(`cat_${proj.type.toLowerCase()}`, lang);
              const dateStr = new Date(proj.updatedAt).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              });
              const docCount = getProjectDocCount(proj.id);

              return (
                <div
                  key={proj.id}
                  onClick={() => handleProjectClick(proj)}
                  onContextMenu={e => {
                    e.preventDefault();
                    setLongPressProj(proj);
                  }}
                  className={`rounded-2xl border p-4 flex cursor-pointer transition-all hover:border-[var(--color-primary)] hover:shadow-md relative overflow-hidden group ${
                    viewLayout === 'GRID' ? 'flex-col justify-between min-h-[148px]' : 'items-center gap-3.5'
                  }`}
                  style={{
                    backgroundColor: surfaceContainerLow,
                    borderColor: 'var(--color-border)'
                  }}
                >
                  {/* Left or Top color accent stripe */}
                  <div
                    className={viewLayout === 'GRID' ? 'absolute top-0 left-0 right-0 h-1.5' : 'w-1.5 self-stretch rounded-full shrink-0'}
                    style={{ backgroundColor: proj.colorHex || primaryColor }}
                  />

                  {/* Info Header */}
                  <div className={`min-w-0 flex-1 ${viewLayout === 'GRID' ? 'mt-1' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[var(--color-text)] truncate">{proj.title}</h4>
                        {proj.passwordHash && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>

                      {/* Favorite Star Button */}
                      {subTab !== 'TRASH' && (
                        <button
                          onClick={e => toggleFavorite(proj, e)}
                          className="p-1 rounded-lg hover:opacity-80 transition-colors"
                          style={{ color: proj.isFavorite ? primaryColor : 'var(--color-text-sec)' }}
                        >
                          <Star className={`w-4 h-4 ${proj.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${proj.colorHex || primaryColor}20`,
                          color: proj.colorHex || primaryColor
                        }}
                      >
                        {typeLabel}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-sec)] flex items-center gap-1">
                        <FileText className="w-3 h-3 opacity-60" />
                        <span>{docCount}</span>
                      </span>
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div className={`flex items-center justify-between pt-2.5 border-t border-[var(--color-border)]/50 text-[11px] text-[var(--color-text-sec)] ${viewLayout === 'GRID' ? 'mt-3' : 'shrink-0 border-t-0 pt-0'}`} onClick={e => e.stopPropagation()}>
                    <span className="truncate flex items-center gap-1">
                      <Calendar className="w-3 h-3 opacity-60" />
                      <span>{dateStr}</span>
                    </span>

                    <div className="flex items-center gap-0.5">
                      {subTab === 'TRASH' ? (
                        <>
                          <button
                            onClick={e => restoreFromTrash(proj, e)}
                            title={l('restore', lang)}
                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => permanentDelete(proj, e)}
                            title={l('delete_permanent', lang)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setProjectToRename(proj);
                              setNewTitle(proj.title);
                            }}
                            className="p-1.5 rounded-lg text-[var(--color-text-sec)] hover:opacity-80"
                            title="Rename"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => toggleArchive(proj, e)}
                            className="p-1.5 rounded-lg text-[var(--color-text-sec)] hover:opacity-80"
                            title={l('archive', lang)}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={e => sendToTrash(proj, e)}
                            className="p-1.5 rounded-lg text-[var(--color-text-sec)] hover:text-rose-500"
                            title={l('to_trash', lang)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      {(subTab === 'ACTIVE' || subTab === 'FAVORITES') && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-20 right-5 z-30 px-5 py-3 rounded-full font-bold text-xs flex items-center gap-2 shadow-2xl transition-all active:scale-95"
          style={{ backgroundColor: primaryColor, color: '#000' }}
        >
          <Plus className="w-5 h-5" />
          <span>{l('new_project', lang)}</span>
        </button>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectDialog
          lang={lang}
          onDismiss={() => setShowCreateModal(false)}
          onCreated={newId => {
            setShowCreateModal(false);
            const created = StorageService.getProjects().find(p => p.id === newId);
            if (created) onSelectProject(created);
          }}
        />
      )}

      {/* Account Profile Modal */}
      {showAccountModal && (
        <AccountProfileDialog
          lang={lang}
          onDismiss={() => setShowAccountModal(false)}
        />
      )}

      {/* Password Unlock Modal */}
      {projectToUnlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-[var(--color-text)]">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>{l('protected_project', lang)}</span>
            </div>
            <p className="text-xs text-[var(--color-text-sec)]">
              {l('project_locked_hint', lang)}
            </p>
            <input
              type="password"
              autoFocus
              value={unlockPassword}
              onChange={e => {
                setUnlockPassword(e.target.value);
                setUnlockError(false);
              }}
              onKeyDown={e => e.key === 'Enter' && handleUnlockConfirm()}
              placeholder={l('password', lang)}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{
                backgroundColor: surfaceContainerHigh,
                borderColor: unlockError ? '#EF4444' : 'var(--color-border)'
              }}
            />
            {unlockError && (
              <p className="text-xs text-rose-500">
                {lang === 'ru' ? 'Неверный пароль' : 'Incorrect password'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setProjectToUnlock(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={handleUnlockConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {l('enter_btn', lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {projectToRename && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              {lang === 'ru' ? 'Переименовать проект' : 'Rename Project'}
            </h3>
            <input
              type="text"
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleConfirmRename()}
              className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
              style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setProjectToRename(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!newTitle.trim()}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {lang === 'ru' ? 'Сохранить' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Options / Reorder Modal */}
      {longPressProj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-xs rounded-3xl p-5 border shadow-2xl space-y-3"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)] truncate">{longPressProj.title}</h3>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setProjectToRename(longPressProj);
                  setNewTitle(longPressProj.title);
                  setLongPressProj(null);
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <Edit2 className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Переименовать' : 'Rename'}</span>
              </button>

              <button
                onClick={() => moveProject(longPressProj, true)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <ArrowUp className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Переместить выше' : 'Move Up'}</span>
              </button>

              <button
                onClick={() => moveProject(longPressProj, false)}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <ArrowDown className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Переместить ниже' : 'Move Down'}</span>
              </button>
            </div>
            <button
              onClick={() => setLongPressProj(null)}
              className="w-full py-2 rounded-xl text-xs font-semibold text-[var(--color-text-sec)]"
            >
              {l('close', lang)}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <h3 className="font-bold text-sm text-[var(--color-text)]">
              {isHardDelete
                ? (lang === 'ru' ? 'Удалить навсегда?' : 'Delete Permanently?')
                : (lang === 'ru' ? 'Удалить проект?' : 'Delete Project?')}
            </h3>
            <p className="text-xs text-[var(--color-text-sec)]">
              {isHardDelete
                ? (lang === 'ru'
                  ? `Вы действительно хотите удалить проект "${projectToDelete.title}" навсегда? Это действие необратимо!`
                  : `Are you sure you want to permanently delete "${projectToDelete.title}"? This cannot be undone!`)
                : (lang === 'ru'
                  ? `Переместить проект "${projectToDelete.title}" в корзину?`
                  : `Move "${projectToDelete.title}" to trash?`)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setProjectToDelete(null)}
                className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              >
                {l('cancel', lang)}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white shadow-md active:scale-95"
              >
                {isHardDelete ? (lang === 'ru' ? 'Стереть' : 'Erase') : (lang === 'ru' ? 'Удалить' : 'Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
