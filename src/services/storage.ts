import {
  WorkspaceProject,
  Folder,
  Document,
  DocumentHistory,
  PrompterSettings,
  ProductivityStat,
  CustomPaletteItem,
  BlockTemplate,
  ThemeMode,
  ColorPalette,
  InterfaceStyle,
  BottomBarStyle,
  EditorBlock
} from '../types';

const STORAGE_KEYS = {
  PROJECTS: 'ws_projects',
  FOLDERS: 'ws_folders',
  DOCUMENTS: 'ws_documents',
  HISTORY: 'ws_history',
  PROMPTER: 'ws_prompter_settings',
  STATS: 'ws_stats',
  SAVED_PALETTES: 'ws_saved_palettes',
  BLOCK_TEMPLATES: 'ws_block_templates',
  APP_PIN: 'ws_app_pin',
  PIN_ENABLED: 'ws_pin_enabled',
  APP_LANG: 'ws_app_language',
  THEME_MODE: 'ws_theme_mode',
  COLOR_PALETTE: 'ws_color_palette',
  CUSTOM_PRIMARY: 'ws_custom_primary_hex',
  CUSTOM_BG: 'ws_custom_bg_hex',
  CUSTOM_SURFACE: 'ws_custom_surface_hex',
  INTERFACE_STYLE: 'ws_interface_style',
  REFRESH_RATE: 'ws_preferred_refresh_rate',
  BOTTOM_BAR_STYLE: 'ws_bottom_bar_style',
  AUTHOR_NAME: 'ws_author_name',
  AUTHOR_BIO: 'ws_author_bio',
  AUTHOR_EMAIL: 'ws_author_email',
  AUTHOR_AVATAR: 'ws_author_avatar',
  CLOUD_SYNC: 'ws_cloud_sync_enabled',
};

// Initial default block templates matching Kotlin
export const DEFAULT_BLOCK_TEMPLATES: BlockTemplate[] = [
  {
    id: 'vo',
    name: 'Голос за кадром',
    typeId: 'custom',
    customTypeName: 'З.К.',
    customColorHex: '#7B1FA2',
    customIconName: 'mic|monospace',
    customPrefix: '[З.К.]',
    alignment: 'CENTER',
    style: { isBold: false, isItalic: true, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
  },
  {
    id: 'title',
    name: 'Титр на экране',
    typeId: 'custom',
    customTypeName: 'ТИТР',
    customColorHex: '#0288D1',
    customIconName: 'subtitles|monospace',
    customPrefix: 'ТИТР:',
    alignment: 'CENTER',
    style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
  },
  {
    id: 'sfx',
    name: 'Звуковой эффект',
    typeId: 'custom',
    customTypeName: 'SFX',
    customColorHex: '#E65100',
    customIconName: 'sfx|monospace',
    customPrefix: 'SFX:',
    alignment: 'LEFT',
    style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
  },
  {
    id: 'note',
    name: 'Режиссерская заметка',
    typeId: 'custom',
    customTypeName: 'ПРИМЕЧАНИЕ',
    customColorHex: '#E5A93C',
    customIconName: 'note|sans',
    customPrefix: '//',
    alignment: 'LEFT',
    style: { isBold: false, isItalic: true, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
  }
];

// Seed sample project if empty
function initializeDefaults() {
  if (typeof window === 'undefined') return;

  if (!localStorage.getItem(STORAGE_KEYS.PROJECTS)) {
    const initialProjects: WorkspaceProject[] = [
      {
        id: 1,
        title: 'Тайна старого маяка',
        type: 'SCREENPLAY',
        colorHex: '#6200EE',
        isFavorite: true,
        isArchived: false,
        isInTrash: false,
        passwordHash: null,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 3600000,
        sortOrder: 0,
        ownerEmail: 'local'
      },
      {
        id: 2,
        title: 'Хроники Затерянных Миров',
        type: 'BOOK',
        colorHex: '#E5A93C',
        isFavorite: false,
        isArchived: false,
        isInTrash: false,
        passwordHash: null,
        createdAt: Date.now() - 86400000 * 7,
        updatedAt: Date.now() - 86400000 * 2,
        sortOrder: 1,
        ownerEmail: 'local'
      }
    ];

    const initialFolders: Folder[] = [
      {
        id: 1,
        projectId: 1,
        name: 'Акт I — Пролог',
        parentFolderId: null,
        createdAt: Date.now() - 86400000 * 3,
        sortOrder: 0
      },
      {
        id: 2,
        projectId: 1,
        name: 'Черновики и Заметки',
        parentFolderId: null,
        createdAt: Date.now() - 86400000 * 2,
        sortOrder: 1
      }
    ];

    const initialBlocksDoc1: EditorBlock[] = [
      {
        id: 'b1',
        type: 'scene',
        text: 'НАТ. СКАЛИСТЫЙ БЕРЕГ - НОЧЬ',
        alignment: 'LEFT',
        style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      },
      {
        id: 'b2',
        type: 'action',
        text: 'Штормовые волны яростно разбиваются о гранитные утесы. Вдали сквозь пелену дождя мерцает одинокий фонарь маяка.',
        alignment: 'LEFT',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      },
      {
        id: 'b3',
        type: 'character',
        text: 'ВИКТОР',
        alignment: 'CENTER',
        style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      },
      {
        id: 'b4',
        type: 'dialogue',
        text: 'Свет гаснет! Если мы не запустим резервный генератор до полуночи, корабль разобьется о рифы.',
        alignment: 'CENTER',
        parenthetical: 'задыхаясь от ветра',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      },
      {
        id: 'b5',
        type: 'custom',
        text: 'Глухой удар корабельного колокола сквозь завывание бури.',
        alignment: 'LEFT',
        customTypeName: 'SFX',
        customColorHex: '#E65100',
        customIconName: 'sfx|monospace',
        customPrefix: 'SFX:',
        style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      }
    ];

    const initialDocuments: Document[] = [
      {
        id: 1,
        projectId: 1,
        folderId: 1,
        title: 'Сцена 1: Пробуждение Шторма',
        contentBlocksJson: JSON.stringify(initialBlocksDoc1),
        sortOrder: 0,
        passwordHash: null,
        isPlainText: false,
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 3600000
      },
      {
        id: 2,
        projectId: 1,
        folderId: null,
        title: 'Библия персонажей и синопсис',
        contentBlocksJson: JSON.stringify([
          {
            id: 't1',
            type: 'paragraph',
            text: 'Главные герои:\n- Виктор (42 года) — смотритель маяка со стажем, ветеран береговой охраны.\n- Анна (26 лет) — метеоролог, впервые прибывшая на отдаленный остров.\n\nОсновной конфликт:\nОстров хранит древнюю тайну затонувшего фрегата "Северная Звезда".',
            alignment: 'LEFT',
            style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
          }
        ]),
        sortOrder: 1,
        passwordHash: null,
        isPlainText: true,
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000
      }
    ];

    const today = new Date();
    const initialStats: ProductivityStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const words = i === 0 ? 320 : Math.floor(Math.random() * 450) + 120;
      initialStats.push({
        dateString: ds,
        wordsCount: words,
        charsCount: words * 6,
        minutesSpent: Math.floor(words / 15)
      });
    }

    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initialProjects));
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(initialFolders));
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(initialDocuments));
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(initialStats));
    localStorage.setItem(STORAGE_KEYS.BLOCK_TEMPLATES, JSON.stringify(DEFAULT_BLOCK_TEMPLATES));
  }
}

initializeDefaults();

// Reactive event emitter for data sync
type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  listeners.forEach(l => l());
}

export const StorageService = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  // --- Projects ---
  getProjects(): WorkspaceProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveProjects(projects: WorkspaceProject[]) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    notify();
  },

  createProject(title: string, type: WorkspaceProject['type'], colorHex: string, passwordHash?: string | null): WorkspaceProject {
    const list = this.getProjects();
    const newProj: WorkspaceProject = {
      id: Date.now(),
      title,
      type,
      colorHex,
      isFavorite: false,
      isArchived: false,
      isInTrash: false,
      passwordHash: passwordHash || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sortOrder: list.length,
      ownerEmail: 'local'
    };
    this.saveProjects([...list, newProj]);
    return newProj;
  },

  updateProject(project: WorkspaceProject) {
    const list = this.getProjects();
    const updated = list.map(p => p.id === project.id ? { ...project, updatedAt: Date.now() } : p);
    this.saveProjects(updated);
  },

  deleteProject(id: number) {
    const list = this.getProjects();
    this.saveProjects(list.filter(p => p.id !== id));
  },

  // --- Folders ---
  getFolders(projectId?: number): Folder[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLDERS);
      const all: Folder[] = data ? JSON.parse(data) : [];
      return projectId !== undefined ? all.filter(f => f.projectId === projectId) : all;
    } catch {
      return [];
    }
  },

  saveFolders(folders: Folder[]) {
    localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(folders));
    notify();
  },

  createFolder(projectId: number, name: string, parentFolderId: number | null = null): Folder {
    const all = this.getFolders();
    const newFolder: Folder = {
      id: Date.now(),
      projectId,
      name,
      parentFolderId,
      createdAt: Date.now(),
      sortOrder: all.filter(f => f.projectId === projectId && f.parentFolderId === parentFolderId).length
    };
    this.saveFolders([...all, newFolder]);
    return newFolder;
  },

  updateFolder(folder: Folder) {
    const all = this.getFolders();
    this.saveFolders(all.map(f => f.id === folder.id ? folder : f));
  },

  deleteFolder(id: number) {
    const all = this.getFolders();
    // recursively delete subfolders
    const toDelete = new Set<number>([id]);
    let added = true;
    while (added) {
      added = false;
      all.forEach(f => {
        if (f.parentFolderId && toDelete.has(f.parentFolderId) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          added = true;
        }
      });
    }
    this.saveFolders(all.filter(f => !toDelete.has(f.id)));

    // Also delete documents in those folders
    const allDocs = this.getDocuments();
    this.saveDocuments(allDocs.filter(d => !d.folderId || !toDelete.has(d.folderId)));
  },

  // --- Documents ---
  getDocuments(projectId?: number, folderId?: number | null): Document[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      const all: Document[] = data ? JSON.parse(data) : [];
      let res = all;
      if (projectId !== undefined) {
        res = res.filter(d => d.projectId === projectId);
      }
      if (folderId !== undefined) {
        res = res.filter(d => d.folderId === folderId);
      }
      return res;
    } catch {
      return [];
    }
  },

  saveDocuments(documents: Document[]) {
    localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    notify();
  },

  createDocument(projectId: number, folderId: number | null, title: string, isPlainText: boolean = false, initialContent?: EditorBlock[]): Document {
    const all = this.getDocuments();
    const defaultBlocks: EditorBlock[] = initialContent || (isPlainText
      ? [{
          id: 'b1',
          type: 'action',
          text: '',
          alignment: 'LEFT',
          style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
        }]
      : [{
          id: 'b1',
          type: 'scene',
          text: 'НАТ. КОМНАТА - ДЕНЬ',
          alignment: 'LEFT',
          style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
        }]);

    const newDoc: Document = {
      id: Date.now(),
      projectId,
      folderId,
      title,
      contentBlocksJson: JSON.stringify(defaultBlocks),
      sortOrder: all.filter(d => d.projectId === projectId && d.folderId === folderId).length,
      passwordHash: null,
      isPlainText,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.saveDocuments([...all, newDoc]);
    return newDoc;
  },

  updateDocument(doc: Document, statsIncrementWords: number = 0, statsIncrementChars: number = 0) {
    const all = this.getDocuments();
    const updated = all.map(d => d.id === doc.id ? { ...doc, updatedAt: Date.now() } : d);
    this.saveDocuments(updated);
    if (statsIncrementWords > 0 || statsIncrementChars > 0) {
      this.logProductivity(statsIncrementWords, statsIncrementChars);
    }
  },

  deleteDocument(id: number) {
    const all = this.getDocuments();
    this.saveDocuments(all.filter(d => d.id !== id));
  },

  // --- Document History Snapshots ---
  getHistory(documentId: number): DocumentHistory[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const all: DocumentHistory[] = data ? JSON.parse(data) : [];
      return all.filter(h => h.documentId === documentId).sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  },

  saveHistory(documentId: number, contentBlocksJson: string, snapshotName: string): DocumentHistory {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const all: DocumentHistory[] = data ? JSON.parse(data) : [];
    const newHist: DocumentHistory = {
      id: Date.now(),
      documentId,
      contentBlocksJson,
      snapshotName,
      timestamp: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([newHist, ...all]));
    notify();
    return newHist;
  },

  deleteHistory(id: number) {
    const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
    const all: DocumentHistory[] = data ? JSON.parse(data) : [];
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(all.filter(h => h.id !== id)));
    notify();
  },

  // --- Prompter Settings ---
  getPrompterSettings(documentId: number): PrompterSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROMPTER);
      const all: Record<string, PrompterSettings> = data ? JSON.parse(data) : {};
      return all[documentId] || {
        documentId,
        scrollSpeed: 10,
        fontSize: 26,
        fontFamily: 'SERIF',
        textColorHex: '#FFFFFF',
        bgColorHex: '#000000',
        mirrorHorizontal: false,
        mirrorVertical: false
      };
    } catch {
      return {
        documentId,
        scrollSpeed: 10,
        fontSize: 26,
        fontFamily: 'SERIF',
        textColorHex: '#FFFFFF',
        bgColorHex: '#000000',
        mirrorHorizontal: false,
        mirrorVertical: false
      };
    }
  },

  savePrompterSettings(settings: PrompterSettings) {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROMPTER);
      const all: Record<string, PrompterSettings> = data ? JSON.parse(data) : {};
      all[settings.documentId] = settings;
      localStorage.setItem(STORAGE_KEYS.PROMPTER, JSON.stringify(all));
      notify();
    } catch (e) {
      console.error(e);
    }
  },

  // --- Productivity Stats ---
  getStats(): ProductivityStat[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  logProductivity(words: number, chars: number) {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.getStats();
    const existing = stats.find(s => s.dateString === today);
    if (existing) {
      existing.wordsCount += words;
      existing.charsCount += chars;
      existing.minutesSpent += 1;
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    } else {
      stats.unshift({
        dateString: today,
        wordsCount: words,
        charsCount: chars,
        minutesSpent: 1
      });
      localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
    }
    notify();
  },

  // --- Saved Custom Palettes ---
  getSavedCustomPalettes(): CustomPaletteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_PALETTES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCustomPalettes(list: CustomPaletteItem[]) {
    localStorage.setItem(STORAGE_KEYS.SAVED_PALETTES, JSON.stringify(list));
    notify();
  },

  // --- Block Templates ---
  getBlockTemplates(): BlockTemplate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BLOCK_TEMPLATES);
      return data ? JSON.parse(data) : DEFAULT_BLOCK_TEMPLATES;
    } catch {
      return DEFAULT_BLOCK_TEMPLATES;
    }
  },

  saveBlockTemplates(templates: BlockTemplate[]) {
    localStorage.setItem(STORAGE_KEYS.BLOCK_TEMPLATES, JSON.stringify(templates));
    notify();
  },

  // --- App Settings (Key-Value) ---
  getSetting<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return defaultValue;
      return JSON.parse(val);
    } catch {
      return defaultValue;
    }
  },

  setSetting<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
    notify();
  },

  // Specific Getters & Setters
  getThemeMode(): ThemeMode {
    return this.getSetting<ThemeMode>(STORAGE_KEYS.THEME_MODE, 'DARK');
  },
  setThemeMode(val: ThemeMode) {
    this.setSetting(STORAGE_KEYS.THEME_MODE, val);
  },

  getColorPalette(): ColorPalette {
    return this.getSetting<ColorPalette>(STORAGE_KEYS.COLOR_PALETTE, 'GREY');
  },
  setColorPalette(val: ColorPalette) {
    this.setSetting(STORAGE_KEYS.COLOR_PALETTE, val);
  },

  getCustomPrimaryColor(): string {
    return this.getSetting<string>(STORAGE_KEYS.CUSTOM_PRIMARY, '#E5A93C');
  },
  setCustomPrimaryColor(val: string) {
    this.setSetting(STORAGE_KEYS.CUSTOM_PRIMARY, val);
  },

  getCustomBgColor(): string {
    return this.getSetting<string>(STORAGE_KEYS.CUSTOM_BG, '');
  },
  setCustomBgColor(val: string) {
    this.setSetting(STORAGE_KEYS.CUSTOM_BG, val);
  },

  getCustomSurfaceColor(): string {
    return this.getSetting<string>(STORAGE_KEYS.CUSTOM_SURFACE, '');
  },
  setCustomSurfaceColor(val: string) {
    this.setSetting(STORAGE_KEYS.CUSTOM_SURFACE, val);
  },

  getInterfaceStyle(): InterfaceStyle {
    return this.getSetting<InterfaceStyle>(STORAGE_KEYS.INTERFACE_STYLE, 'PIXEL');
  },
  setInterfaceStyle(val: InterfaceStyle) {
    this.setSetting(STORAGE_KEYS.INTERFACE_STYLE, val);
  },

  getBottomBarStyle(): BottomBarStyle {
    return this.getSetting<BottomBarStyle>(STORAGE_KEYS.BOTTOM_BAR_STYLE, 'STANDARD');
  },
  setBottomBarStyle(val: BottomBarStyle) {
    this.setSetting(STORAGE_KEYS.BOTTOM_BAR_STYLE, val);
  },

  getAppLanguage(): string {
    return this.getSetting<string>(STORAGE_KEYS.APP_LANG, 'system');
  },
  setAppLanguage(val: string) {
    this.setSetting(STORAGE_KEYS.APP_LANG, val);
  },

  getAppPin(): string | null {
    return this.getSetting<string | null>(STORAGE_KEYS.APP_PIN, null);
  },
  setAppPin(pin: string | null) {
    this.setSetting(STORAGE_KEYS.APP_PIN, pin);
    this.setSetting(STORAGE_KEYS.PIN_ENABLED, !!pin);
  },
  isPinEnabled(): boolean {
    return this.getSetting<boolean>(STORAGE_KEYS.PIN_ENABLED, false);
  },

  getAuthorName(): string {
    return this.getSetting<string>(STORAGE_KEYS.AUTHOR_NAME, 'Автор');
  },
  setAuthorName(val: string) {
    this.setSetting(STORAGE_KEYS.AUTHOR_NAME, val);
  },

  getAuthorBio(): string {
    return this.getSetting<string>(STORAGE_KEYS.AUTHOR_BIO, 'Драматург и романист');
  },
  setAuthorBio(val: string) {
    this.setSetting(STORAGE_KEYS.AUTHOR_BIO, val);
  },

  getAuthorAvatar(): string {
    return this.getSetting<string>(STORAGE_KEYS.AUTHOR_AVATAR, '');
  },
  setAuthorAvatar(val: string) {
    this.setSetting(STORAGE_KEYS.AUTHOR_AVATAR, val);
  },

  resetPaletteToDefault() {
    this.setCustomPrimaryColor('#E5A93C');
    this.setCustomBgColor('');
    this.setCustomSurfaceColor('');
    this.setColorPalette('GREY');
  },

  // --- Full Backup JSON Export & Import ---
  exportBackupJson(): string {
    const backup = {
      backup_version: 1,
      timestamp: Date.now(),
      projects: this.getProjects(),
      folders: this.getFolders(),
      documents: this.getDocuments(),
      history: JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'),
      prompter_settings: JSON.parse(localStorage.getItem(STORAGE_KEYS.PROMPTER) || '{}'),
      stats: this.getStats(),
      saved_palettes: this.getSavedCustomPalettes(),
      block_templates: this.getBlockTemplates(),
      settings: {
        app_language: this.getAppLanguage(),
        theme_mode: this.getThemeMode(),
        color_palette: this.getColorPalette(),
        custom_primary_hex: this.getCustomPrimaryColor(),
        custom_bg_hex: this.getCustomBgColor(),
        interface_style: this.getInterfaceStyle(),
        bottom_bar_style: this.getBottomBarStyle(),
        author_name: this.getAuthorName(),
        author_bio: this.getAuthorBio(),
        author_avatar: this.getAuthorAvatar()
      }
    };
    return JSON.stringify(backup, null, 2);
  },

  importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (!data.backup_version) return false;

      if (data.projects) localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(data.projects));
      if (data.folders) localStorage.setItem(STORAGE_KEYS.FOLDERS, JSON.stringify(data.folders));
      if (data.documents) localStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(data.documents));
      if (data.history) localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(data.history));
      if (data.prompter_settings) localStorage.setItem(STORAGE_KEYS.PROMPTER, JSON.stringify(data.prompter_settings));
      if (data.stats) localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(data.stats));
      if (data.saved_palettes) localStorage.setItem(STORAGE_KEYS.SAVED_PALETTES, JSON.stringify(data.saved_palettes));
      if (data.block_templates) localStorage.setItem(STORAGE_KEYS.BLOCK_TEMPLATES, JSON.stringify(data.block_templates));

      if (data.settings) {
        if (data.settings.app_language) this.setAppLanguage(data.settings.app_language);
        if (data.settings.theme_mode) this.setThemeMode(data.settings.theme_mode);
        if (data.settings.color_palette) this.setColorPalette(data.settings.color_palette);
        if (data.settings.custom_primary_hex) this.setCustomPrimaryColor(data.settings.custom_primary_hex);
        if (data.settings.custom_bg_hex) this.setCustomBgColor(data.settings.custom_bg_hex);
        if (data.settings.interface_style) this.setInterfaceStyle(data.settings.interface_style);
        if (data.settings.bottom_bar_style) this.setBottomBarStyle(data.settings.bottom_bar_style);
        if (data.settings.author_name) this.setAuthorName(data.settings.author_name);
        if (data.settings.author_bio) this.setAuthorBio(data.settings.author_bio);
        if (data.settings.author_avatar) this.setAuthorAvatar(data.settings.author_avatar);
      }

      notify();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
