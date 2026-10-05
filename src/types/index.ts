export type ProjectType = 'BOOK' | 'SCREENPLAY' | 'STORY' | 'TEXT';

export interface WorkspaceProject {
  id: number;
  title: string;
  type: ProjectType;
  colorHex: string;
  isFavorite: boolean;
  isArchived: boolean;
  isInTrash: boolean;
  passwordHash: string | null;
  createdAt: number;
  updatedAt: number;
  sortOrder: number;
  ownerEmail: string;
}

export interface Folder {
  id: number;
  projectId: number;
  name: string;
  parentFolderId: number | null;
  createdAt: number;
  sortOrder: number;
}

export interface BlockStyle {
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  isStrikethrough: boolean;
  textColorHex: string;
  bgColorHex: string;
  lineSpacing: number;
  textIndentDp: number;
}

export interface EditorBlock {
  id: string;
  type: 'scene' | 'action' | 'character' | 'dialogue' | 'custom' | 'paragraph' | 'h1' | 'h2' | 'h3' | 'quote' | 'bullet_list' | 'image';
  text: string;
  alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY';
  style: BlockStyle;
  imageUrl?: string | null;
  imageSize?: number;
  imageCaption?: string | null;
  customTypeName?: string | null;
  customColorHex?: string | null;
  customIconName?: string | null;
  customPrefix?: string | null;
  parenthetical?: string | null;
}

export interface BlockTemplate {
  id: string;
  name: string;
  typeId: string;
  customTypeName: string | null;
  customColorHex: string | null;
  customIconName: string | null;
  customPrefix: string | null;
  alignment: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFY';
  style: BlockStyle;
}

export interface Document {
  id: number;
  projectId: number;
  folderId: number | null;
  title: string;
  contentBlocksJson: string; // Serialized EditorBlock[]
  sortOrder: number;
  passwordHash: string | null;
  isPlainText: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DocumentHistory {
  id: number;
  documentId: number;
  contentBlocksJson: string;
  snapshotName: string;
  timestamp: number;
}

export interface PrompterSettings {
  documentId: number;
  scrollSpeed: number; // 1 to 50
  fontSize: number; // 16 to 72
  fontFamily: 'SERIF' | 'SANS_SERIF' | 'MONO';
  textColorHex: string;
  bgColorHex: string;
  mirrorHorizontal: boolean;
  mirrorVertical: boolean;
}

export interface ProductivityStat {
  dateString: string; // YYYY-MM-DD
  wordsCount: number;
  charsCount: number;
  minutesSpent: number;
}

export interface CustomPaletteItem {
  id: string;
  name: string;
  primaryHex: string;
  bgHex: string;
  surfaceHex: string;
}

export interface DocumentMetrics {
  words: number;
  characters: number;
  pages: number;
  readingTimeMinutes: number;
}

export type ThemeMode = 'LIGHT' | 'DARK' | 'BLACK';
export type InterfaceStyle = 'PIXEL' | 'CLASSIC';
export type BottomBarStyle = 'STANDARD' | 'CAPSULE' | 'SEGMENTED';
export type ColorPalette = 'AMBER' | 'BLUE' | 'GREEN' | 'ORANGE' | 'RED' | 'CORAL' | 'YELLOW' | 'PINK' | 'GREY' | 'CUSTOM';
