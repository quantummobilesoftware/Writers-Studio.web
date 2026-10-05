import { EditorBlock } from '../types';

export interface ParsedKeepNote {
  title: string;
  blocks: EditorBlock[];
  labels: string[];
  isPlainText: boolean;
  createdAt: number;
}

export const KeepImporter = {
  parseRawText(rawText: string): ParsedKeepNote[] {
    const trimmed = rawText.trim();
    if (!trimmed) return [];

    // Check if JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        if (trimmed.startsWith('[')) {
          const arr = JSON.parse(trimmed);
          const notes: ParsedKeepNote[] = [];
          for (let i = 0; i < arr.length; i++) {
            const parsed = this.parseJsonContent(JSON.stringify(arr[i]), `Note ${i + 1}`);
            if (parsed) notes.push(parsed);
          }
          if (notes.length > 0) return notes;
        } else {
          const parsed = this.parseJsonContent(trimmed, 'Keep Note');
          if (parsed) return [parsed];
        }
      } catch {
        // Fall back to plain text
      }
    }

    // Split multiple notes if separated by delimiter
    if (trimmed.includes('\n---\n') || trimmed.includes('\n***\n')) {
      const parts = trimmed.split(/\n(?:---|\*\*\*)\n/);
      return parts.map((part, index) => this.parseTextContent(part, `Keep Note ${index + 1}`));
    }

    return [this.parseTextContent(trimmed, 'Keep Note')];
  },

  parseJsonContent(jsonStr: string, fallbackTitle: string): ParsedKeepNote | null {
    try {
      const json = JSON.parse(jsonStr);
      const rawTitle = json.title || fallbackTitle;
      const textContent = json.textContent || json.text || json.content || '';
      const listContent = json.listContent || [];
      const labelsArray = json.labels || [];
      const createdAt = json.userEditedTimestampUsec
        ? Math.floor(json.userEditedTimestampUsec / 1000)
        : Date.now();

      const labels: string[] = labelsArray.map((lbl: any) => (typeof lbl === 'string' ? lbl : lbl.name || ''));
      const blocks: EditorBlock[] = [];

      if (textContent) {
        const lines = textContent.split('\n');
        lines.forEach((line: string) => {
          if (line.trim()) {
            blocks.push({
              id: 'b_' + Math.random().toString(36).substring(2, 9),
              type: 'paragraph',
              text: line,
              alignment: 'LEFT',
              style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
            });
          }
        });
      }

      if (Array.isArray(listContent) && listContent.length > 0) {
        listContent.forEach((item: any) => {
          const itemText = item.text || '';
          const isChecked = !!item.isChecked;
          blocks.push({
            id: 'b_' + Math.random().toString(36).substring(2, 9),
            type: 'bullet_list',
            text: (isChecked ? '✓ ' : '• ') + itemText,
            alignment: 'LEFT',
            style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: isChecked, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
          });
        });
      }

      if (blocks.length === 0) {
        blocks.push({
          id: 'b_default',
          type: 'paragraph',
          text: '',
          alignment: 'LEFT',
          style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
        });
      }

      return {
        title: rawTitle || 'Google Keep Note',
        blocks,
        labels,
        isPlainText: true,
        createdAt
      };
    } catch {
      return null;
    }
  },

  parseHtmlContent(htmlStr: string, fallbackTitle: string): ParsedKeepNote {
    const titleMatch = htmlStr.match(/<title>(.*?)<\/title>/i);
    const h1Match = htmlStr.match(/<h1>(.*?)<\/h1>/i);
    const title = h1Match?.[1] || titleMatch?.[1] || fallbackTitle;

    let cleaned = htmlStr
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    const blocks: EditorBlock[] = [];

    for (const line of lines) {
      if (line === title) continue;
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*');
      blocks.push({
        id: 'b_' + Math.random().toString(36).substring(2, 9),
        type: isBullet ? 'bullet_list' : 'paragraph',
        text: isBullet ? line.replace(/^[•\-\*]\s*/, '') : line,
        alignment: 'LEFT',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      });
    }

    if (blocks.length === 0) {
      blocks.push({
        id: 'b_def',
        type: 'paragraph',
        text: '',
        alignment: 'LEFT',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      });
    }

    return {
      title,
      blocks,
      labels: [],
      isPlainText: true,
      createdAt: Date.now()
    };
  },

  parseTextContent(textStr: string, fallbackTitle: string): ParsedKeepNote {
    const lines = textStr.split('\n').map(l => l.trimEnd());
    const firstLine = lines.find(l => l.trim().length > 0) || fallbackTitle;
    const title = firstLine.length <= 60 && !firstLine.includes('.') ? firstLine : fallbackTitle;
    const blocks: EditorBlock[] = [];

    let skipFirst = title === firstLine;
    for (const line of lines) {
      if (skipFirst && line.trim() === firstLine) {
        skipFirst = false;
        continue;
      }
      if (line.trim()) {
        const trimmed = line.trim();
        const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
        blocks.push({
          id: 'b_' + Math.random().toString(36).substring(2, 9),
          type: isBullet ? 'bullet_list' : 'paragraph',
          text: isBullet ? trimmed.substring(2) : line,
          alignment: 'LEFT',
          style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
        });
      }
    }

    if (blocks.length === 0) {
      blocks.push({
        id: 'b_def',
        type: 'paragraph',
        text: textStr,
        alignment: 'LEFT',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      });
    }

    return {
      title,
      blocks,
      labels: [],
      isPlainText: true,
      createdAt: Date.now()
    };
  }
};
