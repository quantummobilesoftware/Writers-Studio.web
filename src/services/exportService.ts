import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { EditorBlock, WorkspaceProject, Folder, Document } from '../types';

export const ExportService = {
  // --- TXT Export ---
  exportToTxt(blocks: EditorBlock[]): string {
    return blocks
      .map(b => {
        if (b.type === 'image') {
          return `[Изображение: ${b.imageCaption || 'файл'}]`;
        }
        if (b.type === 'scene' || b.type === 'character') {
          return b.text.toUpperCase();
        }
        if (b.type === 'dialogue' && b.parenthetical) {
          return `(${b.parenthetical})\n${b.text}`;
        }
        if (b.type === 'custom' && b.customPrefix) {
          return `${b.customPrefix} ${b.text}`;
        }
        return b.text;
      })
      .join('\n\n');
  },

  // --- RTF Export ---
  exportToRtf(blocks: EditorBlock[]): string {
    let rtf = '{\\rtf1\\ansi\\deff0\n';
    rtf += '{\\fonttbl{\\f0\\froman\\fcharset204 Times New Roman;}{\\f1\\fmodern\\fcharset204 Courier New;}}\n';
    rtf += '\\viewkind4\\uc1\\f0\\fs24\n';

    for (const block of blocks) {
      const isScreenplay = ['scene', 'character', 'dialogue'].includes(block.type);
      const fontTag = isScreenplay ? '\\f1' : '\\f0';
      let alignTag = '\\ql ';
      if (block.type === 'character' || block.alignment === 'CENTER') alignTag = '\\qc ';
      if (block.alignment === 'RIGHT') alignTag = '\\qr ';

      if (block.type === 'dialogue' && block.parenthetical) {
        const rem = block.parenthetical.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
        rtf += `\\qc \\f1\\fs22\\i (${rem})\\i0\n\\par\n`;
      }

      rtf += `${alignTag}${fontTag}\\fs24 `;
      let rawContent = block.text;
      if (block.type === 'scene' || block.type === 'character') {
        rawContent = rawContent.toUpperCase();
      } else if (block.type === 'custom' && block.customPrefix) {
        rawContent = `${block.customPrefix} ${rawContent}`;
      }

      let text = rawContent.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
      if (block.type === 'scene' || block.type === 'character' || block.style?.isBold) {
        text = `\\b ${text}\\b0 `;
      }
      if (block.style?.isItalic) {
        text = `\\i ${text}\\i0 `;
      }
      if (block.style?.isUnderline) {
        text = `\\ul ${text}\\ulnone `;
      }
      if (block.style?.isStrikethrough) {
        text = `\\strike ${text}\\striked0 `;
      }

      rtf += text + '\n\\par\n';
    }

    rtf += '}';
    return rtf;
  },

  // --- DOCX (Word HTML) Export ---
  exportToDocx(title: string, blocks: EditorBlock[]): string {
    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Courier New', Courier, monospace; font-size: 12pt; line-height: 1.5; margin: 1in; }
        .scene { font-weight: bold; text-transform: uppercase; margin-top: 18pt; margin-bottom: 6pt; }
        .action { font-family: 'Times New Roman', serif; margin-top: 6pt; margin-bottom: 6pt; }
        .character { font-weight: bold; text-align: center; text-transform: uppercase; margin-top: 12pt; margin-bottom: 2pt; margin-left: 1.5in; margin-right: 1.5in; }
        .parenthetical { font-style: italic; text-align: center; margin-top: 1pt; margin-bottom: 2pt; color: #444; }
        .dialogue { margin-left: 1.2in; margin-right: 1.0in; margin-bottom: 8pt; }
        .custom { margin-top: 6pt; margin-bottom: 6pt; }
        .center { text-align: center; }
        .right { text-align: right; }
        .left { text-align: left; }
      </style>
      </head>
      <body>
    `;

    for (const block of blocks) {
      let raw = block.text;
      if (block.type === 'scene' || block.type === 'character') {
        raw = raw.toUpperCase();
      } else if (block.type === 'custom' && block.customPrefix) {
        raw = `${block.customPrefix} ${raw}`;
      }

      let escaped = raw
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

      if (block.type === 'scene' || block.type === 'character' || block.style?.isBold) {
        escaped = `<strong>${escaped}</strong>`;
      }
      if (block.style?.isItalic) {
        escaped = `<em>${escaped}</em>`;
      }
      if (block.style?.isUnderline) {
        escaped = `<u>${escaped}</u>`;
      }
      if (block.style?.isStrikethrough) {
        escaped = `<strike>${escaped}</strike>`;
      }

      if (block.type === 'dialogue' && block.parenthetical) {
        const pText = block.parenthetical
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html += `<p class='parenthetical'>(${pText})</p>\n`;
      }

      const blockClass = block.type;
      html += `<p class='${blockClass}'>${escaped}</p>\n`;
    }

    html += '</body></html>';
    return html;
  },

  // --- PDF Export using jsPDF ---
  exportToPdf(
    title: string,
    blocks: EditorBlock[],
    pageSizeName: string = 'A4',
    fontPreference: string = 'SERIF',
    lineSpacingMultiplier: number = 1.15,
    includePageNumbers: boolean = true
  ): Blob {
    const format = pageSizeName.toLowerCase() === 'letter' ? 'letter' : 'a4';
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 54;
    const contentWidth = pageWidth - margin * 2;
    let currentY = margin;

    // Document Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(title, margin, currentY + 18);
    currentY += 45;

    const baseFont = fontPreference === 'MONOSPACE' ? 'courier' : fontPreference === 'SANS_SERIF' ? 'helvetica' : 'times';

    function checkPageOverflow(neededHeight: number) {
      if (currentY + neededHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
      }
    }

    for (const block of blocks) {
      if (block.type === 'image') {
        checkPageOverflow(80);
        doc.setDrawColor(180, 180, 180);
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(margin, currentY, contentWidth, 60, 4, 4, 'FD');
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(120, 120, 120);
        doc.text(block.imageCaption || '[Изображение]', margin + 14, currentY + 34);
        currentY += 75;
        continue;
      }

      const isScreenplay = ['scene', 'character', 'dialogue'].includes(block.type);
      const font = isScreenplay ? 'courier' : baseFont;
      let style = 'normal';
      if (block.type === 'scene' || block.type === 'character' || block.style?.isBold) {
        style = block.style?.isItalic ? 'bolditalic' : 'bold';
      } else if (block.style?.isItalic) {
        style = 'italic';
      }

      doc.setFont(font, style);
      const fontSize = block.type === 'scene' || block.type === 'character' ? 12 : 11;
      doc.setFontSize(fontSize);
      doc.setTextColor(20, 20, 20);

      // Parenthetical for dialogue
      if (block.type === 'dialogue' && block.parenthetical) {
        checkPageOverflow(20);
        doc.setFont('courier', 'italic');
        doc.setFontSize(10);
        doc.setTextColor(90, 90, 90);
        const pText = `(${block.parenthetical})`;
        doc.text(pText, pageWidth / 2, currentY, { align: 'center' });
        currentY += 16 * lineSpacingMultiplier;
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        doc.setTextColor(20, 20, 20);
      }

      let renderText = block.text;
      if (block.type === 'scene' || block.type === 'character') {
        renderText = renderText.toUpperCase();
      } else if (block.type === 'custom' && block.customPrefix) {
        renderText = `${block.customPrefix} ${renderText}`;
      }

      let textWidth = contentWidth;
      let startX = margin;
      let align: 'left' | 'center' | 'right' = 'left';

      if (block.type === 'character') {
        align = 'center';
        startX = pageWidth / 2;
        textWidth = contentWidth - 160;
      } else if (block.type === 'dialogue') {
        align = 'center';
        startX = pageWidth / 2;
        textWidth = contentWidth - 100;
      } else if (block.alignment === 'CENTER') {
        align = 'center';
        startX = pageWidth / 2;
      } else if (block.alignment === 'RIGHT') {
        align = 'right';
        startX = pageWidth - margin;
      }

      const lines = doc.splitTextToSize(renderText, textWidth);
      const blockHeight = lines.length * (fontSize * 1.35 * lineSpacingMultiplier);
      checkPageOverflow(blockHeight + 10);

      doc.text(lines, startX, currentY, { align });
      currentY += blockHeight + 12;
    }

    // Page numbers in footer
    if (includePageNumbers) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(140, 140, 140);
        doc.text(`${i}`, pageWidth / 2, pageHeight - 24, { align: 'center' });
      }
    }

    return doc.output('blob');
  },

  // --- Trigger Browser File Download ---
  downloadFile(content: Blob | string, filename: string, mimeType?: string) {
    const blob = typeof content === 'string'
      ? new Blob([content], { type: mimeType || 'text/plain;charset=utf-8' })
      : content;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  // --- Export Full Project Structure as ZIP ---
  async exportProjectsToZip(
    projects: WorkspaceProject[],
    folders: Folder[],
    documents: Document[]
  ): Promise<Blob> {
    const zip = new JSZip();
    const root = zip.folder('WriterStudioProjects');

    const activeFolder = root?.folder('Active') || root;
    const archiveFolder = root?.folder('Archive') || root;
    const trashFolder = root?.folder('Trash') || root;

    for (const project of projects) {
      const targetFolder = project.isInTrash
        ? trashFolder
        : project.isArchived
        ? archiveFolder
        : activeFolder;

      const safeProjName = project.title.replace(/[\\/*?:"<>|]/g, '_').trim() || `Project_${project.id}`;
      const projDir = targetFolder?.folder(safeProjName);

      const projFolders = folders.filter(f => f.projectId === project.id);
      const createdFoldersMap = new Map<number, JSZip>();

      // Folders
      for (const f of projFolders.filter(f => !f.parentFolderId)) {
        const safeName = f.name.replace(/[\\/*?:"<>|]/g, '_').trim() || `Folder_${f.id}`;
        const sub = projDir?.folder(safeName);
        if (sub) createdFoldersMap.set(f.id, sub);
      }

      for (const f of projFolders.filter(f => f.parentFolderId)) {
        const parentZip = createdFoldersMap.get(f.parentFolderId!) || projDir;
        const safeName = f.name.replace(/[\\/*?:"<>|]/g, '_').trim() || `Folder_${f.id}`;
        const sub = parentZip?.folder(safeName);
        if (sub) createdFoldersMap.set(f.id, sub);
      }

      // Documents
      const projDocs = documents.filter(d => d.projectId === project.id);
      for (const doc of projDocs) {
        const targetZip = (doc.folderId && createdFoldersMap.get(doc.folderId)) || projDir;
        const safeDocName = doc.title.replace(/[\\/*?:"<>|]/g, '_').trim() || `Doc_${doc.id}`;

        let blocks: EditorBlock[] = [];
        try {
          blocks = JSON.parse(doc.contentBlocksJson);
        } catch {
          blocks = [];
        }

        const plainTxt = this.exportToTxt(blocks);
        targetZip?.file(`${safeDocName}.txt`, plainTxt);
        targetZip?.file(`${safeDocName}.json`, JSON.stringify(doc, null, 2));
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }
};
