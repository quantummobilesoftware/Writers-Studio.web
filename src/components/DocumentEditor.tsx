import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Search,
  History,
  Play,
  MoreVertical,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Download,
  Film,
  FileText,
  User,
  MessageSquare,
  Sliders,
  Type,
  Check,
  Copy,
  BookOpen,
  LayoutGrid,
  X,
  Keyboard,
  Monitor
} from 'lucide-react';
import { Document, EditorBlock, DocumentHistory, BlockStyle } from '../types';
import { StorageService } from '../services/storage';
import { ExportService } from '../services/exportService';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';
import { CustomBlockConfigDialog } from './CustomBlockConfigDialog';

interface DocumentEditorProps {
  document: Document;
  onBack: () => void;
  onLaunchPrompter: () => void;
  lang: string;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  document: initialDoc,
  onBack,
  onLaunchPrompter,
  lang
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const isRussian = lang === 'ru';

  const [doc, setDoc] = useState<Document>(initialDoc);
  const [docTitle, setDocTitle] = useState(initialDoc.title);

  // Parse blocks
  const [blocks, setBlocks] = useState<EditorBlock[]>(() => {
    try {
      const parsed = JSON.parse(initialDoc.contentBlocksJson);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
    return initialDoc.isPlainText
      ? [{ id: 'b1', type: 'action', text: '', alignment: 'LEFT', style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 } }]
      : [{ id: 'b1', type: 'scene', text: isRussian ? 'НАТ. КОМНАТА - ДЕНЬ' : 'INT. ROOM - DAY', alignment: 'LEFT', style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 } }];
  });

  const [activeBlockIndex, setActiveBlockIndex] = useState(0);
  const [editorTab, setEditorTab] = useState<'BLOCKS' | 'DOCUMENT'>('BLOCKS');

  // History Undo/Redo stacks
  const [undoStack, setUndoStack] = useState<EditorBlock[][]>([]);
  const [redoStack, setRedoStack] = useState<EditorBlock[][]>([]);

  // Search & Replace
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Snapshots panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [historyList, setHistoryList] = useState<DocumentHistory[]>(() => StorageService.getHistory(initialDoc.id));

  // Reading mode
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [readFontSize, setReadFontSize] = useState(16);

  // Basic Mode settings
  const [basicFontFamily, setBasicFontFamily] = useState<'SansSerif' | 'Serif' | 'Monospace'>('SansSerif');
  const [basicFontSize, setBasicFontSize] = useState(16);
  const [basicLineSpacing, setBasicLineSpacing] = useState(1.5);
  const [isBasicFormatOpen, setIsBasicFormatOpen] = useState(false);

  // Dialogs
  const [showAddBlockModal, setShowAddBlockModal] = useState(false);
  const [configuringCustomBlock, setConfiguringCustomBlock] = useState<EditorBlock | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Export settings
  const [exportFormat, setExportFormat] = useState<'PDF' | 'DOCX' | 'RTF' | 'TXT'>('PDF');
  const [exportPageSize, setExportPageSize] = useState('A4');
  const [exportFontFamily, setExportFontFamily] = useState('SERIF');
  const [exportLineSpacing, setExportLineSpacing] = useState(1.15);
  const [exportPageNumbers, setExportPageNumbers] = useState(true);

  // Gemini AI Assistant
  const [showGeminiModal, setShowGeminiModal] = useState(false);
  const [geminiMode, setGeminiMode] = useState<'BLOCK' | 'DOCUMENT'>('BLOCK');
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiResult, setGeminiResult] = useState('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [geminiError, setGeminiError] = useState<string | null>(null);

  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(new Set());

  // Desktop keyboard shortcuts: Ctrl/Cmd+S, Ctrl/Cmd+Z, Ctrl/Cmd+Y, Ctrl/Cmd+F, Ctrl/Cmd+P, Ctrl+Shift+E, Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveDocument();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((isCtrlOrCmd && e.key.toLowerCase() === 'y') || (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        saveDocument();
        onLaunchPrompter();
      } else if (isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setShowExportModal(true);
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'b' && !doc.isPlainText) {
        e.preventDefault();
        const cur = blocks[activeBlockIndex];
        if (cur) {
          const isB = cur.style?.isBold;
          const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isBold: !isB } } : b);
          updateBlocksWithHistory(updated);
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'i' && !doc.isPlainText) {
        e.preventDefault();
        const cur = blocks[activeBlockIndex];
        if (cur) {
          const isI = cur.style?.isItalic;
          const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isItalic: !isI } } : b);
          updateBlocksWithHistory(updated);
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'u' && !doc.isPlainText) {
        e.preventDefault();
        const cur = blocks[activeBlockIndex];
        if (cur) {
          const isU = cur.style?.isUnderline;
          const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isUnderline: !isU } } : b);
          updateBlocksWithHistory(updated);
        }
      } else if (e.altKey && e.key === 'ArrowUp' && !doc.isPlainText) {
        e.preventDefault();
        moveBlock(activeBlockIndex, true);
      } else if (e.altKey && e.key === 'ArrowDown' && !doc.isPlainText) {
        e.preventDefault();
        moveBlock(activeBlockIndex, false);
      } else if (e.key === 'Escape') {
        if (showGeminiModal) setShowGeminiModal(false);
        else if (showAddBlockModal) setShowAddBlockModal(false);
        else if (showExportModal) setShowExportModal(false);
        else if (isSearchOpen) setIsSearchOpen(false);
        else if (isHistoryOpen) setIsHistoryOpen(false);
        else if (zenMode) setZenMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [blocks, docTitle, activeBlockIndex, undoStack, redoStack, showGeminiModal, showAddBlockModal, showExportModal, isSearchOpen, isHistoryOpen, zenMode, doc.isPlainText]);

  // Auto-save debouncer
  const isDirtyRef = useRef(false);
  useEffect(() => {
    if (!isDirtyRef.current) return;
    const timer = setTimeout(() => {
      saveDocument();
    }, 1500);
    return () => clearTimeout(timer);
  }, [blocks, docTitle]);

  const saveDocument = () => {
    const updated: Document = {
      ...doc,
      title: docTitle.trim() || 'Документ',
      contentBlocksJson: JSON.stringify(blocks),
      updatedAt: Date.now()
    };
    StorageService.updateDocument(updated);
    setDoc(updated);
    isDirtyRef.current = false;
  };

  const updateBlocksWithHistory = (newBlocks: EditorBlock[], saveHistory = true) => {
    if (saveHistory) {
      setUndoStack(prev => [...prev.slice(-30), blocks]);
      setRedoStack([]);
    }
    setBlocks(newBlocks);
    isDirtyRef.current = true;
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(r => [...r, blocks]);
    setBlocks(prev);
    isDirtyRef.current = true;
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(u => [...u, blocks]);
    setBlocks(next);
    isDirtyRef.current = true;
  };

  // Metrics
  const metrics = useMemo(() => {
    let characters = 0;
    let words = 0;
    blocks.forEach(b => {
      characters += b.text.length;
      const count = b.text.trim().split(/\s+/).filter(Boolean).length;
      words += count;
    });
    const pages = Math.max(1, Math.round(words / 300));
    const readingTime = Math.max(1, Math.round(words / 200));
    return { characters, words, pages, readingTime };
  }, [blocks]);

  // Handle Search & Replace
  const handleReplaceAll = () => {
    if (!findText) return;
    const updated = blocks.map(b => ({
      ...b,
      text: b.text.replaceAll(findText, replaceText)
    }));
    updateBlocksWithHistory(updated);
  };

  // Create Snapshot
  const handleTakeSnapshot = () => {
    if (!snapshotLabel.trim()) return;
    const hist = StorageService.saveHistory(doc.id, JSON.stringify(blocks), snapshotLabel.trim());
    setHistoryList(prev => [hist, ...prev]);
    setSnapshotLabel('');
  };

  const handleRestoreSnapshot = (h: DocumentHistory) => {
    try {
      const restored = JSON.parse(h.contentBlocksJson);
      updateBlocksWithHistory(restored);
      saveDocument();
    } catch {}
  };

  // Call Gemini API
  const handleCallGemini = async (promptOverride?: string) => {
    const finalPrompt = promptOverride || geminiPrompt;
    if (!finalPrompt.trim()) return;

    setIsGeminiLoading(true);
    setGeminiError(null);
    setGeminiResult('');

    try {
      let contextText = '';
      if (doc.isPlainText) {
        contextText = blocks[0]?.text || '';
      } else if (geminiMode === 'BLOCK') {
        contextText = blocks[activeBlockIndex]?.text || '';
      } else {
        contextText = blocks.map(b => `[${b.type.toUpperCase()}]: ${b.text}`).join('\n\n');
      }

      const instruction = geminiMode === 'BLOCK' || doc.isPlainText
        ? 'You are an expert Hollywood screenplay co-writer. Provide only the updated text directly, without markdown code fences or conversational greetings.'
        : 'You are an expert literary consultant and script doctor. Deliver a structured, thoughtful analysis with clear headings.';

      const combinedPrompt = `Context:\n"""\n${contextText}\n"""\n\nTask:\n${finalPrompt}`;

      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: combinedPrompt,
          systemInstruction: instruction
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }

      const data = await res.json();
      setGeminiResult(data.text);
    } catch (err: any) {
      setGeminiError(err.message || 'Failed to call Gemini API');
    } finally {
      setIsGeminiLoading(false);
    }
  };

  // Apply Gemini result
  const handleApplyGeminiReplace = () => {
    if (doc.isPlainText) {
      updateBlocksWithHistory([{ ...blocks[0], text: geminiResult }]);
    } else if (geminiMode === 'BLOCK') {
      const updated = blocks.map((b, idx) => idx === activeBlockIndex ? { ...b, text: geminiResult } : b);
      updateBlocksWithHistory(updated);
    }
    setShowGeminiModal(false);
  };

  const handleApplyGeminiAppend = () => {
    if (doc.isPlainText) {
      const cur = blocks[0]?.text || '';
      updateBlocksWithHistory([{ ...blocks[0], text: cur ? `${cur}\n\n${geminiResult}` : geminiResult }]);
    } else if (geminiMode === 'BLOCK') {
      const cur = blocks[activeBlockIndex]?.text || '';
      const updated = blocks.map((b, idx) => idx === activeBlockIndex ? { ...b, text: cur ? `${cur} ${geminiResult}` : geminiResult } : b);
      updateBlocksWithHistory(updated);
    } else {
      const newBlock: EditorBlock = {
        id: 'gemini_' + Date.now(),
        type: 'action',
        text: `--- AI ANALYSIS ---\n\n${geminiResult}`,
        alignment: 'LEFT',
        style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
      };
      updateBlocksWithHistory([...blocks, newBlock]);
    }
    setShowGeminiModal(false);
  };

  // Export current document
  const handleExport = () => {
    const filename = (docTitle.trim() || 'Document').replace(/\s+/g, '_');
    if (exportFormat === 'TXT') {
      const txt = ExportService.exportToTxt(blocks);
      ExportService.downloadFile(txt, `${filename}.txt`, 'text/plain');
    } else if (exportFormat === 'RTF') {
      const rtf = ExportService.exportToRtf(blocks);
      ExportService.downloadFile(rtf, `${filename}.rtf`, 'application/rtf');
    } else if (exportFormat === 'DOCX') {
      const docx = ExportService.exportToDocx(docTitle, blocks);
      ExportService.downloadFile(docx, `${filename}.docx`, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    } else {
      // PDF
      const pdfBlob = ExportService.exportToPdf(
        docTitle,
        blocks,
        exportPageSize,
        exportFontFamily,
        exportLineSpacing,
        exportPageNumbers
      );
      ExportService.downloadFile(pdfBlob, `${filename}.pdf`, 'application/pdf');
    }
    setShowExportModal(false);
  };

  // Block Helpers
  const activeBlock = blocks[activeBlockIndex] || blocks[0];

  const changeBlockType = (index: number, newType: EditorBlock['type']) => {
    const target = blocks[index];
    if (!target) return;
    let formattedText = target.text;
    if (newType === 'scene' || newType === 'character') {
      formattedText = formattedText.toUpperCase();
    }
    const updated = blocks.map((b, i) => {
      if (i === index) {
        return {
          ...b,
          type: newType,
          text: formattedText,
          alignment: (newType === 'character' || newType === 'dialogue' ? 'CENTER' : 'LEFT') as any
        };
      }
      return b;
    });
    updateBlocksWithHistory(updated);
  };

  const moveBlock = (index: number, up: boolean) => {
    const targetIndex = up ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const list = [...blocks];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    updateBlocksWithHistory(list);
    setActiveBlockIndex(targetIndex);
  };

  const deleteBlock = (index: number) => {
    if (blocks.length <= 1) {
      updateBlocksWithHistory([{ id: 'b_init', type: 'scene', text: '', alignment: 'LEFT', style: { isBold: true, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 } }]);
      setActiveBlockIndex(0);
      return;
    }
    const list = blocks.filter((_, i) => i !== index);
    updateBlocksWithHistory(list);
    setActiveBlockIndex(Math.max(0, index - 1));
  };

  const getBlockAccentColor = (type: string, customColor?: string | null) => {
    if (type === 'custom') return customColor || '#E5A93C';
    switch (type) {
      case 'scene': return '#2B5C8F';
      case 'action': return '#455A64';
      case 'character': return '#7B1FA2';
      case 'dialogue': return '#2E7D32';
      default: return '#455A64';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      {/* Top Header */}
      <header className="px-4 py-2.5 sm:px-6 flex items-center justify-between border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={() => {
              saveDocument();
              onBack();
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity shrink-0"
            style={{ backgroundColor: surfaceContainerLow }}
          >
            <ArrowLeft className="w-5 h-5 text-[var(--color-text)]" />
          </button>

          <input
            type="text"
            value={docTitle}
            onChange={e => {
              setDocTitle(e.target.value);
              isDirtyRef.current = true;
            }}
            className="font-bold text-base sm:text-lg bg-transparent outline-none flex-1 truncate text-[var(--color-text)] focus:border-b border-[var(--color-primary)]"
            placeholder={l('doc_name', lang)}
          />
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Gemini AI Assistant */}
          <button
            onClick={() => {
              setGeminiMode(editorTab === 'BLOCKS' ? 'BLOCK' : 'DOCUMENT');
              setGeminiPrompt('');
              setGeminiResult('');
              setGeminiError(null);
              setShowGeminiModal(true);
            }}
            className="p-2 rounded-xl text-[var(--color-primary)] hover:opacity-80 transition-opacity"
            title="Gemini AI"
          >
            <Sparkles className="w-5 h-5" />
          </button>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            title={l('find_replace', lang)}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Snapshots / Versions */}
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            title={l('versions', lang)}
          >
            <History className="w-5 h-5" />
          </button>

          {/* Zen Mode / Fullscreen Toggle */}
          <button
            onClick={() => setZenMode(!zenMode)}
            className="hidden sm:flex p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            title={zenMode ? (isRussian ? 'Обычный режим' : 'Exit Zen Mode') : (isRussian ? 'Дзен-режим (Фокус)' : 'Zen Focus Mode')}
          >
            {zenMode ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Shortcuts Help */}
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="hidden lg:flex p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            title={isRussian ? 'Горячие клавиши' : 'Keyboard Shortcuts'}
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Export */}
          <button
            onClick={() => setShowExportModal(true)}
            className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            title="Export"
          >
            <Download className="w-5 h-5" />
          </button>

          {/* Teleprompter Launch */}
          <button
            onClick={() => {
              saveDocument();
              onLaunchPrompter();
            }}
            className="p-2 px-3 rounded-full font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
            style={{ backgroundColor: primaryColor, color: '#000' }}
            title={l('prompter', lang)}
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">{l('prompter', lang)}</span>
          </button>
        </div>
      </header>

      {/* Editor Sub-Tabs for Pro Mode */}
      {!doc.isPlainText && !isReadingMode && (
        <div className="flex border-b border-[var(--color-border)] px-4 bg-[var(--color-surface)]">
          <button
            onClick={() => setEditorTab('BLOCKS')}
            className={`flex items-center gap-1.5 py-2 px-4 text-xs font-bold border-b-2 transition-all ${editorTab === 'BLOCKS' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-sec)]'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Блоки' : 'Blocks'}</span>
          </button>
          <button
            onClick={() => setEditorTab('DOCUMENT')}
            className={`flex items-center gap-1.5 py-2 px-4 text-xs font-bold border-b-2 transition-all ${editorTab === 'DOCUMENT' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-[var(--color-text-sec)]'}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isRussian ? 'Документ (Чтение)' : 'Document (Read)'}</span>
          </button>
        </div>
      )}

      {/* Search & Replace Panel */}
      {isSearchOpen && (
        <div
          className="p-3 border-b border-[var(--color-border)] flex items-center gap-2 flex-wrap animate-fadeIn text-xs"
          style={{ backgroundColor: surfaceContainerLow }}
        >
          <input
            type="text"
            value={findText}
            onChange={e => setFindText(e.target.value)}
            placeholder={l('find_replace', lang)}
            className="px-3 py-1.5 rounded-xl border flex-1 min-w-[140px] outline-none"
            style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
          />
          <input
            type="text"
            value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            placeholder={isRussian ? 'Заменить на...' : 'Replace with...'}
            className="px-3 py-1.5 rounded-xl border flex-1 min-w-[140px] outline-none"
            style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
          />
          <button
            onClick={handleReplaceAll}
            className="px-3 py-1.5 rounded-xl font-bold border"
            style={{ borderColor: primaryColor, color: primaryColor }}
          >
            {isRussian ? 'Заменить всё' : 'Replace All'}
          </button>
          <button onClick={() => setIsSearchOpen(false)} className="p-1 text-[var(--color-text-sec)]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 overflow-hidden flex relative">
        {/* Pro Mode: Blocks View */}
        {!doc.isPlainText && editorTab === 'BLOCKS' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Quick Screenplay Type Bar */}
            <div className="p-2 px-4 border-b border-[var(--color-border)] flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
              {[
                { id: 'scene', label: isRussian ? 'Сцена' : 'Scene', icon: <Film className="w-3.5 h-3.5" /> },
                { id: 'action', label: isRussian ? 'Действие' : 'Action', icon: <FileText className="w-3.5 h-3.5" /> },
                { id: 'character', label: isRussian ? 'Персонаж' : 'Character', icon: <User className="w-3.5 h-3.5" /> },
                { id: 'dialogue', label: isRussian ? 'Диалог' : 'Dialogue', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { id: 'custom', label: isRussian ? 'Кастом' : 'Custom', icon: <Sliders className="w-3.5 h-3.5" /> }
              ].map(type => {
                const isCurr = activeBlock?.type === type.id;
                return (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (isCurr && type.id === 'custom') {
                        setConfiguringCustomBlock(activeBlock);
                      } else {
                        changeBlockType(activeBlockIndex, type.id as any);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition-all active:scale-95"
                    style={{
                      backgroundColor: isCurr ? primaryColor : surfaceContainerLow,
                      borderColor: isCurr ? primaryColor : 'var(--color-border)',
                      color: isCurr ? '#000' : 'var(--color-text-sec)'
                    }}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                );
              })}

              {activeBlock?.type === 'custom' && (
                <button
                  onClick={() => setConfiguringCustomBlock(activeBlock)}
                  className="p-1.5 rounded-lg border text-amber-500 hover:opacity-80 shrink-0"
                  title="Configure"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Blocks List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-w-4xl mx-auto w-full pb-24">
              {blocks.map((b, idx) => {
                const isSelected = idx === activeBlockIndex;
                const isCollapsed = collapsedBlocks.has(b.id);
                const accentColor = getBlockAccentColor(b.type, b.customColorHex);

                return (
                  <div
                    key={b.id}
                    onClick={() => setActiveBlockIndex(idx)}
                    className="rounded-2xl border transition-all relative overflow-hidden pl-4 pr-3 py-3"
                    style={{
                      backgroundColor: isSelected ? `${accentColor}12` : surfaceContainerLow,
                      borderColor: isSelected ? `${accentColor}80` : 'var(--color-border)',
                      boxShadow: isSelected ? `0 0 0 1px ${accentColor}40` : undefined
                    }}
                  >
                    {/* Left vertical color stripe */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
                      style={{ backgroundColor: accentColor }}
                    />

                    {/* Block Header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                          style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                        >
                          {b.type === 'scene'
                            ? (isRussian ? 'СЦЕНА' : 'SCENE HEADING')
                            : b.type === 'action'
                            ? (isRussian ? 'ДЕЙСТВИЕ' : 'ACTION')
                            : b.type === 'character'
                            ? (isRussian ? 'ПЕРСОНАЖ' : 'CHARACTER')
                            : b.type === 'dialogue'
                            ? (isRussian ? 'ДИАЛОГ' : 'DIALOGUE')
                            : (b.customTypeName || 'CUSTOM').toUpperCase()}
                        </span>
                      </div>

                      {/* Block Controls */}
                      <div className="flex items-center gap-1">
                        {b.type === 'custom' && (
                          <button
                            onClick={() => setConfiguringCustomBlock(b)}
                            className="p-1 rounded-lg text-[var(--color-text-sec)] hover:opacity-80"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => moveBlock(idx, true)}
                          disabled={idx === 0}
                          className="p-1 rounded-lg text-[var(--color-text-sec)] hover:opacity-80 disabled:opacity-30"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveBlock(idx, false)}
                          disabled={idx === blocks.length - 1}
                          className="p-1 rounded-lg text-[var(--color-text-sec)] hover:opacity-80 disabled:opacity-30"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            const next = new Set(collapsedBlocks);
                            if (next.has(b.id)) next.delete(b.id);
                            else next.add(b.id);
                            setCollapsedBlocks(next);
                          }}
                          className="p-1 rounded-lg text-[var(--color-text-sec)] hover:opacity-80"
                        >
                          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => deleteBlock(idx)}
                          className="p-1 rounded-lg text-rose-500 hover:opacity-80"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Block Content */}
                    {!isCollapsed ? (
                      <div className="space-y-2">
                        {/* Scene Chips Helper */}
                        {b.type === 'scene' && (
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                            {(isRussian
                              ? ['НАТ. ', 'ИНТ. ', 'ИНТ./НАТ. ', ' — ДЕНЬ', ' — НОЧЬ', ' — УТРО', ' — ВЕЧЕР']
                              : ['INT. ', 'EXT. ', 'INT./EXT. ', ' - DAY', ' - NIGHT', ' - MORNING', ' - EVENING']
                            ).map(chip => (
                              <button
                                key={chip}
                                onClick={() => {
                                  let newT = b.text.trim();
                                  if (!newT) newT = chip;
                                  else if (chip.startsWith(' —') || chip.startsWith(' -')) newT += chip;
                                  else if (!newT.startsWith(chip)) newT = chip + newT;
                                  const updated = blocks.map((item, i) => i === idx ? { ...item, text: newT.toUpperCase() } : item);
                                  updateBlocksWithHistory(updated);
                                }}
                                className="px-2 py-0.5 rounded-md border font-semibold shrink-0"
                                style={{ borderColor: `${accentColor}50`, color: accentColor }}
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Dialogue Parenthetical Remark */}
                        {b.type === 'dialogue' && (
                          <div className="flex items-center justify-center gap-1.5 text-xs italic opacity-85">
                            <span>(</span>
                            <input
                              type="text"
                              value={b.parenthetical || ''}
                              onChange={e => {
                                const updated = blocks.map((item, i) => i === idx ? { ...item, parenthetical: e.target.value } : item);
                                updateBlocksWithHistory(updated, false);
                              }}
                              placeholder={isRussian ? 'ремарка (шепотом, в сторону...)' : 'parenthetical remark (whispering...)'}
                              className="text-center bg-transparent border-b border-dashed border-[var(--color-border)] outline-none text-xs"
                            />
                            <span>)</span>
                          </div>
                        )}

                        {/* Text Area Input */}
                        <textarea
                          value={b.text}
                          onChange={e => {
                            let val = e.target.value;
                            // Screenplay uppercase formatting
                            if (b.type === 'scene' || b.type === 'character') {
                              val = val.toUpperCase();
                            }
                            const updated = blocks.map((item, i) => i === idx ? { ...item, text: val } : item);
                            updateBlocksWithHistory(updated, false);
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              // Determine next type
                              let nextType: EditorBlock['type'] = 'action';
                              let nextAlign: EditorBlock['alignment'] = 'LEFT';
                              if (b.type === 'character') {
                                nextType = 'dialogue';
                                nextAlign = 'CENTER';
                              } else if (b.type === 'dialogue') {
                                nextType = 'action';
                              } else if (b.type === 'scene') {
                                nextType = 'action';
                              }

                              const newBlock: EditorBlock = {
                                id: 'b_' + Date.now(),
                                type: nextType,
                                text: '',
                                alignment: nextAlign,
                                style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
                              };
                              const list = [...blocks];
                              list.splice(idx + 1, 0, newBlock);
                              updateBlocksWithHistory(list);
                              setActiveBlockIndex(idx + 1);
                            } else if (e.key === 'Backspace' && !b.text && idx > 0) {
                              e.preventDefault();
                              deleteBlock(idx);
                            }
                          }}
                          rows={Math.max(1, b.text.split('\n').length)}
                          placeholder={
                            b.type === 'scene'
                              ? (isRussian ? 'ИНТ. КОМНАТА - ДЕНЬ' : 'INT. ROOM - DAY')
                              : b.type === 'character'
                              ? (isRussian ? 'ИМЯ ПЕРСОНАЖА' : 'CHARACTER NAME')
                              : b.type === 'dialogue'
                              ? (isRussian ? 'Реплика персонажа...' : 'Dialogue lines...')
                              : (isRussian ? 'Описание действия...' : 'Action description...')
                          }
                          className={`w-full bg-transparent outline-none resize-none text-sm transition-all ${b.style?.isBold ? 'font-bold' : ''} ${b.style?.isItalic ? 'italic' : ''} ${b.style?.isUnderline ? 'underline' : ''}`}
                          style={{
                            textAlign: b.alignment.toLowerCase() as any,
                            fontFamily: ['scene', 'character', 'dialogue'].includes(b.type) ? 'monospace' : 'serif'
                          }}
                        />
                      </div>
                    ) : (
                      <p className="text-xs italic opacity-50 truncate">{b.text || '<Пустой блок>'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pro Mode: Full Script Reading View */}
        {!doc.isPlainText && editorTab === 'DOCUMENT' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Reading Toolbar */}
            <div className="p-2 px-4 border-b border-[var(--color-border)] flex items-center justify-between text-xs shrink-0" style={{ backgroundColor: surfaceContainerLow }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[var(--color-text-sec)]">
                  {isRussian ? 'Размер текста:' : 'Font Size:'}
                </span>
                <button
                  onClick={() => setReadFontSize(s => Math.max(12, s - 1))}
                  className="px-2 py-1 rounded-lg border font-bold"
                >
                  A-
                </button>
                <span className="font-mono text-xs">{readFontSize}pt</span>
                <button
                  onClick={() => setReadFontSize(s => Math.min(24, s + 1))}
                  className="px-2 py-1 rounded-lg border font-bold"
                >
                  A+
                </button>
              </div>

              <button
                onClick={() => setIsReadingMode(!isReadingMode)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold"
                style={{ borderColor: primaryColor, color: primaryColor }}
              >
                {isReadingMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                <span>{isReadingMode ? (isRussian ? 'Свернуть' : 'Exit Fullscreen') : (isRussian ? 'На весь экран' : 'Fullscreen')}</span>
              </button>
            </div>

            {/* Script Paper Sheet */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-3xl mx-auto w-full bg-[var(--color-surface)] shadow-inner font-mono text-sm leading-relaxed space-y-4">
              {blocks.map(b => {
                if (b.type === 'scene') {
                  return (
                    <div key={b.id} className="font-bold uppercase tracking-wider pt-4 pb-1 text-[var(--color-primary)]" style={{ fontSize: `${readFontSize + 1}px` }}>
                      {b.text}
                    </div>
                  );
                }
                if (b.type === 'character') {
                  return (
                    <div key={b.id} className="font-bold uppercase text-center pt-3 pb-0.5 tracking-wide" style={{ fontSize: `${readFontSize}px` }}>
                      {b.text}
                    </div>
                  );
                }
                if (b.type === 'dialogue') {
                  return (
                    <div key={b.id} className="max-w-md mx-auto text-center pb-2" style={{ fontSize: `${readFontSize}px` }}>
                      {b.parenthetical && (
                        <div className="text-xs italic opacity-75 mb-0.5">({b.parenthetical})</div>
                      )}
                      <div>{b.text}</div>
                    </div>
                  );
                }
                if (b.type === 'custom') {
                  return (
                    <div key={b.id} className="py-1" style={{ fontSize: `${readFontSize}px`, textAlign: b.alignment.toLowerCase() as any }}>
                      {b.customPrefix && <span className="font-bold mr-1.5 opacity-80">{b.customPrefix}</span>}
                      <span>{b.text}</span>
                    </div>
                  );
                }
                return (
                  <div key={b.id} className="font-serif py-1" style={{ fontSize: `${readFontSize}px` }}>
                    {b.text}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Basic Mode: Simple TXT Writer Canvas */}
        {doc.isPlainText && (
          <div className="flex-1 flex flex-col h-full overflow-hidden p-4 sm:p-6 max-w-4xl mx-auto w-full">
            {/* Format Bar Toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsBasicFormatOpen(!isBasicFormatOpen)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>{isRussian ? 'Настройки шрифта' : 'Font Settings'}</span>
                </button>
              </div>

              {/* Quick Symbols */}
              <div className="flex items-center gap-1 overflow-x-auto text-xs font-mono">
                {['—', '«', '»', '“', '”', '…', '№', 'Tab'].map(sym => (
                  <button
                    key={sym}
                    onClick={() => {
                      const cur = blocks[0]?.text || '';
                      const append = sym === 'Tab' ? '    ' : sym;
                      updateBlocksWithHistory([{ ...blocks[0], text: cur + append }]);
                    }}
                    className="px-2 py-1 rounded-lg border hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Format Settings Collapsible */}
            {isBasicFormatOpen && (
              <div
                className="p-3 rounded-2xl border mb-3 flex items-center justify-between gap-4 text-xs animate-fadeIn"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-sec)]">{isRussian ? 'Шрифт:' : 'Font:'}</span>
                  {(['SansSerif', 'Serif', 'Monospace'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setBasicFontFamily(f)}
                      className={`px-2 py-1 rounded-lg border font-semibold ${basicFontFamily === f ? 'bg-[var(--color-primary)] text-black' : ''}`}
                    >
                      {f === 'SansSerif' ? 'Sans' : f === 'Serif' ? 'Serif' : 'Mono'}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-sec)]">{isRussian ? 'Размер:' : 'Size:'}</span>
                  <button onClick={() => setBasicFontSize(s => Math.max(12, s - 2))} className="px-2 py-1 rounded-lg border font-bold">-</button>
                  <span>{basicFontSize}sp</span>
                  <button onClick={() => setBasicFontSize(s => Math.min(32, s + 2))} className="px-2 py-1 rounded-lg border font-bold">+</button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-sec)]">{isRussian ? 'Интервал:' : 'Spacing:'}</span>
                  {[1.2, 1.5, 1.8].map(sp => (
                    <button
                      key={sp}
                      onClick={() => setBasicLineSpacing(sp)}
                      className={`px-2 py-1 rounded-lg border font-semibold ${basicLineSpacing === sp ? 'bg-[var(--color-primary)] text-black' : ''}`}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plain Textarea */}
            <div
              className="flex-1 rounded-3xl p-4 sm:p-6 border overflow-hidden flex flex-col shadow-inner"
              style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
            >
              <textarea
                value={blocks[0]?.text || ''}
                onChange={e => {
                  updateBlocksWithHistory([{ ...blocks[0], text: e.target.value }], false);
                }}
                placeholder={l('empty_text', lang)}
                className="w-full flex-1 bg-transparent outline-none resize-none"
                style={{
                  fontSize: `${basicFontSize}px`,
                  lineHeight: basicLineSpacing,
                  fontFamily: basicFontFamily === 'Monospace' ? 'monospace' : basicFontFamily === 'Serif' ? 'serif' : 'sans-serif'
                }}
              />
            </div>
          </div>
        )}

        {/* Snapshots / Versions Side Drawer */}
        {isHistoryOpen && (
          <div
            className="w-72 border-l border-[var(--color-border)] p-4 flex flex-col h-full bg-[var(--color-surface)] z-20 animate-slideLeft shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-[var(--color-text)]">{l('versions_subtitle', lang)}</h3>
              <button onClick={() => setIsHistoryOpen(false)} className="text-[var(--color-text-sec)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <input
                type="text"
                value={snapshotLabel}
                onChange={e => setSnapshotLabel(e.target.value)}
                placeholder={l('save_snapshot_label', lang)}
                className="w-full px-3 py-1.5 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
              />
              <button
                onClick={handleTakeSnapshot}
                disabled={!snapshotLabel.trim()}
                className="w-full py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {l('take_snapshot', lang)}
              </button>
            </div>

            <label className="block text-xs font-semibold text-[var(--color-text-sec)] mb-2">
              {l('saved_revisions', lang)}
            </label>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {historyList.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--color-text-sec)]">
                  {isRussian ? 'Нет сохраненных снимков' : 'No revisions saved'}
                </div>
              ) : (
                historyList.map(h => (
                  <div
                    key={h.id}
                    onClick={() => handleRestoreSnapshot(h)}
                    className="p-2.5 rounded-xl border cursor-pointer hover:border-[var(--color-primary)] transition-all"
                    style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                  >
                    <div className="font-semibold text-xs text-[var(--color-text)] truncate">{h.snapshotName}</div>
                    <div className="text-[10px] text-[var(--color-text-sec)] mt-0.5">
                      {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(h.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sticky Toolbar & Metrics Footer */}
      {!isReadingMode && (
        <footer
          className="border-t border-[var(--color-border)] p-2 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 bg-[var(--color-surface)] z-10"
        >
          {/* Metrics summary */}
          <div className="flex items-center gap-3 text-[11px] text-[var(--color-text-sec)]">
            <span>{l('words', lang)}: <strong className="text-[var(--color-text)]">{metrics.words}</strong></span>
            <span>•</span>
            <span>{l('chars', lang)}: <strong className="text-[var(--color-text)]">{metrics.characters}</strong></span>
            <span>•</span>
            <span>~{metrics.readingTime} {l('min', lang)}</span>
          </div>

          {/* Formatting Controls for Pro Mode */}
          {!doc.isPlainText && editorTab === 'BLOCKS' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndo}
                disabled={undoStack.length === 0}
                className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 disabled:opacity-30"
                title={l('undo', lang)}
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80 disabled:opacity-30"
                title={l('redo', lang)}
              >
                <Redo2 className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

              <button
                onClick={() => {
                  const isB = activeBlock?.style?.isBold;
                  const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isBold: !isB } } : b);
                  updateBlocksWithHistory(updated);
                }}
                className={`p-2 rounded-xl font-bold ${activeBlock?.style?.isBold ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text)]'}`}
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const isI = activeBlock?.style?.isItalic;
                  const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isItalic: !isI } } : b);
                  updateBlocksWithHistory(updated);
                }}
                className={`p-2 rounded-xl italic ${activeBlock?.style?.isItalic ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text)]'}`}
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const isU = activeBlock?.style?.isUnderline;
                  const updated = blocks.map((b, i) => i === activeBlockIndex ? { ...b, style: { ...b.style, isUnderline: !isU } } : b);
                  updateBlocksWithHistory(updated);
                }}
                className={`p-2 rounded-xl underline ${activeBlock?.style?.isUnderline ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text)]'}`}
              >
                <Underline className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-[var(--color-border)] mx-1" />

              <button
                onClick={() => setShowAddBlockModal(true)}
                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRussian ? 'Блок' : 'Add Block'}</span>
              </button>
            </div>
          )}
        </footer>
      )}

      {/* Modal: Gemini AI Assistant */}
      {showGeminiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all flex flex-col max-h-[90vh] space-y-3.5"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-bold text-base text-[var(--color-text)]">
                  {doc.isPlainText
                    ? 'Gemini: Текстовый ассистент'
                    : geminiMode === 'BLOCK'
                    ? 'Gemini: Ассистент блока'
                    : 'Gemini: Ассистент сценария'}
                </h3>
              </div>
              <button onClick={() => setShowGeminiModal(false)} className="text-[var(--color-text-sec)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Context snippet preview */}
            <div
              className="p-3 rounded-2xl border text-xs max-h-24 overflow-y-auto"
              style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
            >
              <div className="font-bold text-[10px] text-[var(--color-primary)] uppercase mb-1">
                {isRussian ? 'Контекст:' : 'Context:'}
              </div>
              <p className="opacity-80">
                {doc.isPlainText
                  ? blocks[0]?.text.slice(0, 200) || '<Пустой текст>'
                  : geminiMode === 'BLOCK'
                  ? blocks[activeBlockIndex]?.text || '<Пустой блок>'
                  : `Весь документ (${metrics.words} слов)`}
              </p>
            </div>

            {/* Preset prompt chips */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {(geminiMode === 'BLOCK' || doc.isPlainText
                ? [
                    { label: isRussian ? 'Продолжить' : 'Continue', prompt: isRussian ? 'Продолжи написание этой сцены, сохраняя тон автора.' : 'Continue writing this scene, preserving the author\'s tone.' },
                    { label: isRussian ? 'Переписать' : 'Rewrite', prompt: isRussian ? 'Перепиши этот фрагмент ярче, кинематографичнее и выразительнее.' : 'Rewrite this fragment to make it more cinematic and expressive.' },
                    { label: isRussian ? 'Расширить' : 'Expand', prompt: isRussian ? 'Добавь больше деталей, атмосферы и ощущений персонажа.' : 'Expand with more atmospheric details and sensory descriptions.' },
                    { label: isRussian ? 'Сократить' : 'Shorten', prompt: isRussian ? 'Сократи до самой сути, убрав лишнее.' : 'Shorten to the absolute essence, removing filler.' },
                    { label: isRussian ? 'На английский' : 'To English', prompt: isRussian ? 'Переведи этот фрагмент сценария на английский язык.' : 'Translate this screenplay fragment into English.' }
                  ]
                : [
                    { label: isRussian ? 'Краткий синопсис' : 'Summarize', prompt: isRussian ? 'Напиши краткое содержание и выдели главные сюжетные линии.' : 'Summarize the plot and outline the main conflict beats.' },
                    { label: isRussian ? 'Анализ темпа' : 'Analyze Pacing', prompt: isRussian ? 'Оцени темп повествования, структуру сцен и драматическое напряжение.' : 'Evaluate the pacing, scene structure and dramatic tension.' },
                    { label: isRussian ? 'Разбор персонажей' : 'Characters', prompt: isRussian ? 'Проанализируй голоса и арки персонажей в этом тексте.' : 'Analyze the character voices and dynamic arcs in this text.' },
                    { label: isRussian ? 'Сюжетные твисты' : 'Plot Twists', prompt: isRussian ? 'Предложи 3 неожиданных сюжетных поворота для продолжения истории.' : 'Propose 3 unexpected creative plot twists to continue.' }
                  ]
              ).map(chip => (
                <button
                  key={chip.label}
                  onClick={() => {
                    setGeminiPrompt(chip.prompt);
                    handleCallGemini(chip.prompt);
                  }}
                  className="px-2.5 py-1 rounded-lg border font-medium shrink-0 transition-colors hover:border-[var(--color-primary)]"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Custom Instruction Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={geminiPrompt}
                onChange={e => setGeminiPrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCallGemini()}
                placeholder={isRussian ? 'Своя инструкция для Gemini...' : 'Custom prompt for Gemini...'}
                className="flex-1 px-3.5 py-2 rounded-xl border text-xs outline-none"
                style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
              />
              <button
                onClick={() => handleCallGemini()}
                disabled={isGeminiLoading || !geminiPrompt.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold shadow-md active:scale-95 disabled:opacity-40"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {isGeminiLoading ? (isRussian ? 'Думает...' : 'Thinking...') : (isRussian ? 'Отправить' : 'Send')}
              </button>
            </div>

            {/* Gemini Output */}
            {geminiError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 text-xs">
                {geminiError}
              </div>
            )}

            {geminiResult && (
              <div
                className="p-3.5 rounded-2xl border text-xs overflow-y-auto max-h-56 space-y-3"
                style={{ backgroundColor: surfaceContainerLow, borderColor: `${primaryColor}40` }}
              >
                <div className="font-bold text-[var(--color-primary)] flex items-center justify-between">
                  <span>{isRussian ? 'Ответ Gemini:' : 'Gemini Response:'}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(geminiResult);
                      alert(isRussian ? 'Скопировано!' : 'Copied!');
                    }}
                    className="p-1 text-[var(--color-text-sec)] hover:opacity-80"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{geminiResult}</p>

                <div className="flex gap-2 pt-2 border-t border-[var(--color-border)]">
                  <button
                    onClick={handleApplyGeminiReplace}
                    className="flex-1 py-1.5 rounded-xl font-bold text-xs"
                    style={{ backgroundColor: primaryColor, color: '#000' }}
                  >
                    {isRussian ? 'Заменить' : 'Replace'}
                  </button>
                  <button
                    onClick={handleApplyGeminiAppend}
                    className="flex-1 py-1.5 rounded-xl font-bold text-xs border"
                    style={{ borderColor: primaryColor, color: primaryColor }}
                  >
                    {isRussian ? 'Добавить' : 'Append'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Add Screenplay Block */}
      {showAddBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all flex flex-col max-h-[85vh] space-y-3.5"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--color-text)]">
                {isRussian ? 'Добавить блок сценария' : 'Add Screenplay Block'}
              </h3>
              <button onClick={() => setShowAddBlockModal(false)} className="text-[var(--color-text-sec)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Block Hero Card */}
            <div
              onClick={() => {
                const newBlock: EditorBlock = {
                  id: 'custom_' + Date.now(),
                  type: 'custom',
                  text: '',
                  alignment: 'LEFT',
                  customTypeName: isRussian ? 'КАСТОМ' : 'CUSTOM',
                  customColorHex: '#E5A93C',
                  customIconName: 'tune|serif',
                  style: { isBold: false, isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
                };
                const list = [...blocks];
                list.splice(activeBlockIndex + 1, 0, newBlock);
                updateBlocksWithHistory(list);
                setActiveBlockIndex(activeBlockIndex + 1);
                setShowAddBlockModal(false);
                setConfiguringCustomBlock(newBlock);
              }}
              className="p-3.5 rounded-2xl border cursor-pointer hover:border-amber-500 transition-all flex items-center justify-between"
              style={{ backgroundColor: 'rgba(229, 169, 60, 0.12)', borderColor: 'rgba(229, 169, 60, 0.4)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/25 flex items-center justify-center text-amber-500">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-[var(--color-text)] flex items-center gap-1.5">
                    <span>{isRussian ? 'Кастомный блок' : 'Custom Block'}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-black font-extrabold">STUDIO</span>
                  </div>
                  <div className="text-[11px] text-[var(--color-text-sec)]">
                    {isRussian ? 'Свой бейдж, цвет, шрифт и выравнивание' : 'Custom badge, color, font & alignment'}
                  </div>
                </div>
              </div>
              <Plus className="w-4 h-4 text-amber-500" />
            </div>

            {/* Standard Screenplay Elements */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[var(--color-text-sec)]">
                {isRussian ? 'Стандартные блоки сценария:' : 'Standard Screenplay Blocks:'}
              </label>

              {[
                { type: 'scene', label: isRussian ? 'Сцена (Scene Heading)' : 'Scene Heading', desc: isRussian ? 'Место и время действия (НАТ. КОМНАТА - ДЕНЬ)' : 'Location and time of scene', icon: <Film className="w-4 h-4 text-blue-500" /> },
                { type: 'action', label: isRussian ? 'Действие (Action)' : 'Action Description', desc: isRussian ? 'Повествование о событиях в кадре' : 'Narrative description of what happens', icon: <FileText className="w-4 h-4 text-emerald-500" /> },
                { type: 'character', label: isRussian ? 'Имя персонажа (Character)' : 'Character Name', desc: isRussian ? 'По центру перед репликой диалога' : 'Centered before dialogue', icon: <User className="w-4 h-4 text-purple-500" /> },
                { type: 'dialogue', label: isRussian ? 'Диалог (Dialogue)' : 'Dialogue', desc: isRussian ? 'Реплика персонажа с ремарками' : 'Speech with optional parentheticals', icon: <MessageSquare className="w-4 h-4 text-orange-500" /> }
              ].map(item => (
                <div
                  key={item.type}
                  onClick={() => {
                    const newBlock: EditorBlock = {
                      id: 'b_' + Date.now(),
                      type: item.type as any,
                      text: item.type === 'scene' ? (isRussian ? 'НАТ. ' : 'INT. ') : '',
                      alignment: (item.type === 'character' || item.type === 'dialogue' ? 'CENTER' : 'LEFT') as any,
                      style: { isBold: item.type === 'scene' || item.type === 'character', isItalic: false, isUnderline: false, isStrikethrough: false, textColorHex: '#000000', bgColorHex: '#00000000', lineSpacing: 1.25, textIndentDp: 0 }
                    };
                    const list = [...blocks];
                    list.splice(activeBlockIndex + 1, 0, newBlock);
                    updateBlocksWithHistory(list);
                    setActiveBlockIndex(activeBlockIndex + 1);
                    setShowAddBlockModal(false);
                  }}
                  className="p-3 rounded-2xl border cursor-pointer hover:border-[var(--color-primary)] transition-all flex items-center justify-between"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-[var(--color-surface-high)]">{item.icon}</div>
                    <div>
                      <div className="font-bold text-xs text-[var(--color-text)]">{item.label}</div>
                      <div className="text-[11px] text-[var(--color-text-sec)]">{item.desc}</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-[var(--color-text-sec)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export Document */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all flex flex-col space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-[var(--color-text)] flex items-center gap-2">
                <Download className="w-4 h-4" style={{ color: primaryColor }} />
                <span>{isRussian ? 'Экспорт документа' : 'Export Document'}</span>
              </h3>
              <button onClick={() => setShowExportModal(false)} className="text-[var(--color-text-sec)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Format Selector */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                {isRussian ? 'Формат файла:' : 'File Format:'}
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['PDF', 'DOCX', 'RTF', 'TXT'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setExportFormat(fmt)}
                    className={`py-2 rounded-xl border text-xs font-bold transition-all ${exportFormat === fmt ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-sec)]'}`}
                    style={{ borderColor: exportFormat === fmt ? primaryColor : 'var(--color-border)' }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* PDF Options */}
            {exportFormat === 'PDF' && (
              <div className="space-y-3 pt-1 border-t border-[var(--color-border)] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-sec)]">{isRussian ? 'Формат листа:' : 'Page Size:'}</span>
                  <div className="flex gap-1.5">
                    {['A4', 'LETTER'].map(sz => (
                      <button
                        key={sz}
                        onClick={() => setExportPageSize(sz)}
                        className={`px-2.5 py-1 rounded-lg border font-semibold ${exportPageSize === sz ? 'bg-[var(--color-primary)] text-black' : ''}`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--color-text-sec)]">{isRussian ? 'Номера страниц:' : 'Page numbers:'}</span>
                  <input
                    type="checkbox"
                    checked={exportPageNumbers}
                    onChange={e => setExportPageNumbers(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-primary)]"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleExport}
              className="w-full py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              <Download className="w-4 h-4" />
              <span>{isRussian ? 'Скачать файл' : 'Download File'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Custom Block Config Modal */}
      {configuringCustomBlock && (
        <CustomBlockConfigDialog
          block={configuringCustomBlock}
          lang={lang}
          onSaveBlock={updated => {
            const list = blocks.map(b => b.id === updated.id ? updated : b);
            updateBlocksWithHistory(list);
            setConfiguringCustomBlock(null);
          }}
          onDismiss={() => setConfiguringCustomBlock(null)}
        />
      )}

      {/* Desktop Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div
            className="w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4"
            style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Keyboard className="w-5 h-5" style={{ color: primaryColor }} />
                <h3 className="font-bold text-base text-[var(--color-text)]">
                  {isRussian ? 'Горячие клавиши (ПК)' : 'Keyboard Shortcuts (PC)'}
                </h3>
              </div>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-[var(--color-text-sec)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: 'Ctrl + S', desc: isRussian ? 'Мгновенное сохранение' : 'Instant Save' },
                { key: 'Ctrl + Z', desc: isRussian ? 'Отменить действие' : 'Undo' },
                { key: 'Ctrl + Y / Ctrl+Shift+Z', desc: isRussian ? 'Повторить действие' : 'Redo' },
                { key: 'Ctrl + B / I / U', desc: isRussian ? 'Жирный / Курсив / Подчеркнутый' : 'Bold / Italic / Underline' },
                { key: 'Ctrl + F', desc: isRussian ? 'Поиск и замена текста' : 'Find & Replace' },
                { key: 'Ctrl + P', desc: isRussian ? 'Запуск телесуфлера' : 'Launch Teleprompter' },
                { key: 'Ctrl + Shift + E', desc: isRussian ? 'Экспорт документа (PDF, DOCX, RTF)' : 'Export Document' },
                { key: 'Enter', desc: isRussian ? 'Создать следующий сценарный блок' : 'Next Screenplay Block' },
                { key: 'Backspace', desc: isRussian ? 'Удалить пустой блок' : 'Delete empty block' },
                { key: 'Alt + ↑ / ↓', desc: isRussian ? 'Переместить блок выше / ниже' : 'Move Block Up / Down' },
                { key: 'Escape', desc: isRussian ? 'Закрыть окно / выйти из режима' : 'Close modal / Exit mode' }
              ].map(item => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-2 rounded-xl"
                  style={{ backgroundColor: surfaceContainerLow }}
                >
                  <span className="text-[var(--color-text-sec)]">{item.desc}</span>
                  <kbd className="px-2 py-1 rounded-md font-mono font-bold text-[11px] bg-black/30 border border-[var(--color-border)] text-[var(--color-text)]">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowShortcutsHelp(false)}
              className="w-full py-2.5 rounded-xl text-xs font-bold shadow-md"
              style={{ backgroundColor: primaryColor, color: '#000' }}
            >
              {l('close', lang)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
