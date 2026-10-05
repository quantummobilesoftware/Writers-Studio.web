import React, { useState } from 'react';
import {
  X,
  Sliders,
  Sparkles,
  Bookmark,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Mic,
  Subtitles,
  Volume2,
  Lightbulb,
  History,
  Video,
  Zap,
  Music,
  Brain,
  Smartphone,
  Tag,
  Eye
} from 'lucide-react';
import { EditorBlock, BlockTemplate } from '../types';
import { StorageService } from '../services/storage';
import { useTheme, isColorBright } from './ThemeWrapper';

interface CustomBlockConfigDialogProps {
  block: EditorBlock;
  lang: string;
  onSaveBlock: (updated: EditorBlock) => void;
  onDismiss: () => void;
}

const CUSTOM_BLOCK_SWATCHES = [
  '#E5A93C', '#7B1FA2', '#0288D1', '#2E7D32',
  '#E65100', '#D32F2F', '#00897B', '#3949AB',
  '#C2185B', '#0097A7', '#F57C00', '#388E3C',
  '#5E35B1', '#6D4C41', '#455A64', '#546E7A'
];

const ICONS = [
  { id: 'tune', label: 'Кастом', labelEn: 'Custom', icon: <Sliders className="w-4 h-4" /> },
  { id: 'mic', label: 'Голос', labelEn: 'V.O.', icon: <Mic className="w-4 h-4" /> },
  { id: 'subtitles', label: 'Титр', labelEn: 'Title', icon: <Subtitles className="w-4 h-4" /> },
  { id: 'sfx', label: 'Звук', labelEn: 'SFX', icon: <Volume2 className="w-4 h-4" /> },
  { id: 'note', label: 'Заметка', labelEn: 'Note', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'flashback', label: 'Флэшбек', labelEn: 'Flashback', icon: <History className="w-4 h-4" /> },
  { id: 'camera', label: 'Камера', labelEn: 'Camera', icon: <Video className="w-4 h-4" /> },
  { id: 'vfx', label: 'VFX', labelEn: 'VFX', icon: <Zap className="w-4 h-4" /> },
  { id: 'music', label: 'Музыка', labelEn: 'Music', icon: <Music className="w-4 h-4" /> },
  { id: 'thought', label: 'Мысль', labelEn: 'Thought', icon: <Brain className="w-4 h-4" /> },
  { id: 'screen', label: 'Экран', labelEn: 'Screen', icon: <Smartphone className="w-4 h-4" /> },
];

const PRESETS = [
  { id: 'vo', titleRu: 'Голос за кадром', titleEn: 'Voiceover (V.O.)', badge: 'З.К.', badgeEn: 'V.O.', prefix: '[З.К.]', prefixEn: '[V.O.]', color: '#7B1FA2', icon: 'mic', font: 'monospace', align: 'CENTER', italic: true },
  { id: 'title', titleRu: 'Титр на экране', titleEn: 'On-Screen Title', badge: 'ТИТР', badgeEn: 'TITLE', prefix: 'ТИТР:', prefixEn: 'TITLE:', color: '#0288D1', icon: 'subtitles', font: 'monospace', align: 'CENTER', bold: true },
  { id: 'sfx', titleRu: 'Звуковой эффект', titleEn: 'Sound Effect (SFX)', badge: 'SFX', badgeEn: 'SFX', prefix: 'SFX:', prefixEn: 'SFX:', color: '#E65100', icon: 'sfx', font: 'monospace', align: 'LEFT', bold: true },
  { id: 'note', titleRu: 'Режиссерская заметка', titleEn: 'Director\'s Note', badge: 'ПРИМЕЧАНИЕ', badgeEn: 'NOTE', prefix: '//', prefixEn: '//', color: '#E5A93C', icon: 'note', font: 'sans', align: 'LEFT', italic: true },
  { id: 'flashback', titleRu: 'Флэшбек', titleEn: 'Flashback', badge: 'ФЛЭШБЕК', badgeEn: 'FLASHBACK', prefix: '[ФЛЭШБЕК]', prefixEn: '[FLASHBACK]', color: '#00897B', icon: 'flashback', font: 'serif', align: 'LEFT', bold: true, italic: true },
  { id: 'camera', titleRu: 'План камеры', titleEn: 'Camera / Shot', badge: 'КАМЕРА', badgeEn: 'CAMERA', prefix: 'ПЛАН:', prefixEn: 'ANGLE:', color: '#3949AB', icon: 'camera', font: 'monospace', align: 'RIGHT', bold: true },
  { id: 'vfx', titleRu: 'Спецэффект', titleEn: 'Visual Effect (VFX)', badge: 'VFX', badgeEn: 'VFX', prefix: '[VFX]', prefixEn: '[VFX]', color: '#D32F2F', icon: 'vfx', font: 'monospace', align: 'LEFT', bold: true },
  { id: 'music', titleRu: 'Музыка', titleEn: 'Music Cue', badge: 'МУЗЫКА', badgeEn: 'MUSIC', prefix: '♫', prefixEn: '♫', color: '#C2185B', icon: 'music', font: 'serif', align: 'LEFT', italic: true }
];

export const CustomBlockConfigDialog: React.FC<CustomBlockConfigDialogProps> = ({
  block,
  lang,
  onSaveBlock,
  onDismiss
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const isRussian = lang === 'ru';

  const [activeTab, setActiveTab] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState<'EDITOR' | 'SCRIPT'>('EDITOR');

  const [customTypeName, setCustomTypeName] = useState(block.customTypeName || (isRussian ? 'КАСТОМ' : 'CUSTOM'));
  const [customPrefix, setCustomPrefix] = useState(block.customPrefix || '');
  const [customColorHex, setCustomColorHex] = useState(block.customColorHex || '#E5A93C');
  const [alignment, setAlignment] = useState<EditorBlock['alignment']>((block.alignment as EditorBlock['alignment']) || 'LEFT');
  const [blockText, setBlockText] = useState(block.text || '');

  const rawIcon = block.customIconName?.split('|')[0] || 'tune';
  const rawFont = block.customIconName?.split('|')[1] || (block.alignment === 'CENTER' ? 'monospace' : 'serif');

  const [selectedIcon, setSelectedIcon] = useState(rawIcon);
  const [selectedFont, setSelectedFont] = useState(rawFont);

  const [isBold, setIsBold] = useState(block.style?.isBold || false);
  const [isItalic, setIsItalic] = useState(block.style?.isItalic || false);
  const [isUnderline, setIsUnderline] = useState(block.style?.isUnderline || false);
  const [isStrikethrough, setIsStrikethrough] = useState(block.style?.isStrikethrough || false);

  const [templates, setTemplates] = useState<BlockTemplate[]>(() => StorageService.getBlockTemplates());
  const [templateName, setTemplateName] = useState('');

  const activeIconObj = ICONS.find(i => i.id === selectedIcon) || ICONS[0];
  const isColorLight = isColorBright(customColorHex);

  const handleApply = () => {
    const updated: EditorBlock = {
      ...block,
      type: 'custom',
      text: blockText,
      alignment: alignment as any,
      customTypeName: customTypeName.trim() || (isRussian ? 'КАСТОМ' : 'CUSTOM'),
      customPrefix: customPrefix.trim() || null,
      customColorHex,
      customIconName: `${selectedIcon}|${selectedFont}`,
      style: {
        ...block.style,
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough
      }
    };
    onSaveBlock(updated);
  };

  const handleSaveAsTemplate = () => {
    const name = templateName.trim() || customTypeName || (isRussian ? 'Мой шаблон' : 'My Template');
    const newTmpl: BlockTemplate = {
      id: Date.now().toString(),
      name,
      typeId: 'custom',
      customTypeName: customTypeName || 'CUSTOM',
      customColorHex,
      customIconName: `${selectedIcon}|${selectedFont}`,
      customPrefix: customPrefix || null,
      alignment: alignment as any,
      style: {
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough,
        textColorHex: '#000000',
        bgColorHex: '#00000000',
        lineSpacing: 1.25,
        textIndentDp: 0
      }
    };
    const updated = [newTmpl, ...templates];
    setTemplates(updated);
    StorageService.saveBlockTemplates(updated);
    setTemplateName('');
    alert(isRussian ? `Шаблон "${name}" сохранен!` : `Template "${name}" saved!`);
  };

  const handleDeleteTemplate = (id: string) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    StorageService.saveBlockTemplates(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-2xl rounded-3xl p-5 sm:p-6 shadow-2xl border transition-all flex flex-col max-h-[92vh]"
        style={{
          backgroundColor: surfaceColor,
          borderColor: 'var(--color-border)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-xs"
              style={{ backgroundColor: `${customColorHex}25`, borderColor: `${customColorHex}60` }}
            >
              <span style={{ color: customColorHex }}>{activeIconObj.icon}</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {isRussian ? 'Студия Кастомных Блоков' : 'Custom Block Studio'}
              </h2>
              <p className="text-xs text-[var(--color-text-sec)]">
                {isRussian ? 'Настройка бейджа, шрифта, цвета и шаблонов' : 'Badge, typography, accent & templates'}
              </p>
            </div>
          </div>
          <button onClick={onDismiss} className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Block Preview Card */}
        <div
          className="rounded-2xl p-4 mb-4 border transition-all relative overflow-hidden"
          style={{ backgroundColor: surfaceContainerLow, borderColor: `${customColorHex}40` }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: customColorHex }}>
              <Eye className="w-3.5 h-3.5" />
              <span>{isRussian ? 'Предпросмотр блока' : 'Live Preview'}</span>
            </div>
            <div className="flex rounded-lg p-0.5 border text-[11px]" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setPreviewMode('EDITOR')}
                className={`px-2 py-0.5 rounded-md font-semibold ${previewMode === 'EDITOR' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-sec)]'}`}
              >
                {isRussian ? 'В редакторе' : 'Editor'}
              </button>
              <button
                onClick={() => setPreviewMode('SCRIPT')}
                className={`px-2 py-0.5 rounded-md font-semibold ${previewMode === 'SCRIPT' ? 'bg-[var(--color-primary)] text-black' : 'text-[var(--color-text-sec)]'}`}
              >
                {isRussian ? 'На странице' : 'Script Page'}
              </button>
            </div>
          </div>

          {previewMode === 'EDITOR' ? (
            <div
              className="rounded-xl p-3 border pl-4 relative"
              style={{
                backgroundColor: `${customColorHex}10`,
                borderColor: `${customColorHex}40`
              }}
            >
              {/* Left Accent Stripe */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl"
                style={{ backgroundColor: customColorHex }}
              />

              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span style={{ color: customColorHex }}>{activeIconObj.icon}</span>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: customColorHex }}
                  >
                    {customTypeName || (isRussian ? 'КАСТОМ' : 'CUSTOM')}
                  </span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--color-border)]">
                  {alignment} • {selectedFont.toUpperCase()}
                </span>
              </div>

              {customPrefix && (
                <div
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1"
                  style={{ backgroundColor: `${customColorHex}25`, color: customColorHex }}
                >
                  {customPrefix}
                </div>
              )}

              <div
                className={`text-sm ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''} ${isStrikethrough ? 'line-through' : ''}`}
                style={{
                  textAlign: alignment.toLowerCase() as any,
                  fontFamily: selectedFont === 'monospace' ? 'monospace' : selectedFont === 'sans' ? 'sans-serif' : 'serif'
                }}
              >
                {blockText || (isRussian ? 'Пример текста кастомного сценарного блока...' : 'Sample text of your custom screenplay block...')}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
              {customTypeName && (
                <div
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mb-1"
                  style={{ backgroundColor: `${customColorHex}20`, color: customColorHex }}
                >
                  {customTypeName.toUpperCase()}
                </div>
              )}
              <div
                className={`text-sm ${isBold ? 'font-bold' : ''} ${isItalic ? 'italic' : ''} ${isUnderline ? 'underline' : ''} ${isStrikethrough ? 'line-through' : ''}`}
                style={{
                  textAlign: alignment.toLowerCase() as any,
                  fontFamily: selectedFont === 'monospace' ? 'monospace' : selectedFont === 'sans' ? 'sans-serif' : 'serif'
                }}
              >
                {customPrefix ? `${customPrefix} ` : ''}{blockText || (isRussian ? 'Пример текста...' : 'Sample text...')}
              </div>
            </div>
          )}
        </div>

        {/* Tabs Bar */}
        <div className="flex rounded-2xl p-1 gap-1 border mb-4" style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}>
          {[
            { id: 0, label: isRussian ? 'Идентичность' : 'Identity', icon: <Tag className="w-3.5 h-3.5" /> },
            { id: 1, label: isRussian ? 'Стиль и Цвет' : 'Style & Color', icon: <Sliders className="w-3.5 h-3.5" /> },
            { id: 2, label: `${isRussian ? 'Шаблоны' : 'Templates'} (${templates.length})`, icon: <Bookmark className="w-3.5 h-3.5" /> }
          ].map(tab => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isSel ? `${customColorHex}25` : 'transparent',
                  color: isSel ? customColorHex : 'var(--color-text-sec)'
                }}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Tab 0: Identity & Quick Presets */}
          {activeTab === 0 && (
            <div className="space-y-4">
              {/* Presets Carousel */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isRussian ? 'Быстрые сценарные пресеты' : 'Quick Screenplay Presets'}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {PRESETS.map(preset => {
                    return (
                      <button
                        key={preset.id}
                        onClick={() => {
                          setCustomTypeName(isRussian ? preset.badge : preset.badgeEn);
                          setCustomPrefix(isRussian ? preset.prefix : preset.prefixEn);
                          setCustomColorHex(preset.color);
                          setSelectedIcon(preset.icon);
                          setSelectedFont(preset.font);
                          setAlignment(preset.align as EditorBlock['alignment']);
                          setIsBold(preset.bold || false);
                          setIsItalic(preset.italic || false);
                        }}
                        className="p-3 rounded-2xl border text-left shrink-0 w-36 transition-all active:scale-95"
                        style={{
                          backgroundColor: surfaceContainerLow,
                          borderColor: `${preset.color}60`
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center mb-1.5 text-white shadow-xs"
                          style={{ backgroundColor: preset.color }}
                        >
                          {ICONS.find(i => i.id === preset.icon)?.icon}
                        </div>
                        <div className="font-bold text-xs truncate text-[var(--color-text)]">
                          {isRussian ? preset.titleRu : preset.titleEn}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-sec)] truncate">
                          {isRussian ? preset.badge : preset.badgeEn}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Badge & Prefix Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                    {isRussian ? 'Бейдж (название типа)' : 'Badge Label'}
                  </label>
                  <input
                    type="text"
                    value={customTypeName}
                    onChange={e => setCustomTypeName(e.target.value)}
                    placeholder="V.O., ТИТР, SFX..."
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                    style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                    {isRussian ? 'Авто-префикс' : 'Auto-Prefix'}
                  </label>
                  <input
                    type="text"
                    value={customPrefix}
                    onChange={e => setCustomPrefix(e.target.value)}
                    placeholder="[З.К.], ТИТР:, SFX:..."
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none"
                    style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                  {isRussian ? 'Иконка блока' : 'Block Icon'}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {ICONS.map(i => {
                    const isSel = selectedIcon === i.id;
                    return (
                      <button
                        key={i.id}
                        onClick={() => setSelectedIcon(i.id)}
                        className="p-2.5 rounded-xl border flex flex-col items-center gap-1 shrink-0 transition-transform active:scale-95"
                        style={{
                          backgroundColor: isSel ? `${customColorHex}20` : surfaceContainerHigh,
                          borderColor: isSel ? customColorHex : 'var(--color-border)',
                          color: isSel ? customColorHex : 'var(--color-text-sec)'
                        }}
                      >
                        {i.icon}
                        <span className="text-[10px] font-semibold">{isRussian ? i.label : i.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                  {isRussian ? 'Содержимое блока' : 'Block Content'}
                </label>
                <textarea
                  value={blockText}
                  onChange={e => setBlockText(e.target.value)}
                  rows={2}
                  placeholder={isRussian ? 'Введите текст...' : 'Enter text...'}
                  className="w-full px-3 py-2 rounded-xl border text-xs outline-none resize-none"
                  style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>
          )}

          {/* Tab 1: Style & Color */}
          {activeTab === 1 && (
            <div className="space-y-4">
              {/* Typography / Font Family */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                  {isRussian ? 'Шрифт' : 'Font Family'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'serif', label: isRussian ? 'С засечками' : 'Serif', sample: 'Aa' },
                    { id: 'sans', label: isRussian ? 'Без засечек' : 'Sans-Serif', sample: 'Aa' },
                    { id: 'monospace', label: isRussian ? 'Моноширинный' : 'Monospace', sample: 'Aa' }
                  ].map(f => {
                    const isSel = selectedFont === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFont(f.id)}
                        className="p-3 rounded-2xl border flex flex-col items-center transition-all active:scale-95"
                        style={{
                          backgroundColor: isSel ? `${customColorHex}20` : surfaceContainerHigh,
                          borderColor: isSel ? customColorHex : 'var(--color-border)'
                        }}
                      >
                        <span
                          className="text-lg font-bold mb-0.5"
                          style={{
                            fontFamily: f.id === 'monospace' ? 'monospace' : f.id === 'sans' ? 'sans-serif' : 'serif'
                          }}
                        >
                          {f.sample}
                        </span>
                        <span className="text-[11px] font-semibold">{f.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alignment & Styles */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                    {isRussian ? 'Выравнивание' : 'Alignment'}
                  </label>
                  <div className="flex gap-1.5">
                    {[
                      { id: 'LEFT', icon: <AlignLeft className="w-4 h-4" /> },
                      { id: 'CENTER', icon: <AlignCenter className="w-4 h-4" /> },
                      { id: 'RIGHT', icon: <AlignRight className="w-4 h-4" /> }
                    ].map(a => {
                      const isSel = alignment === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setAlignment(a.id as EditorBlock['alignment'])}
                          className="flex-1 py-2 rounded-xl border flex items-center justify-center transition-all active:scale-95"
                          style={{
                            backgroundColor: isSel ? `${customColorHex}20` : surfaceContainerHigh,
                            borderColor: isSel ? customColorHex : 'var(--color-border)',
                            color: isSel ? customColorHex : 'var(--color-text-sec)'
                          }}
                        >
                          {a.icon}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                    {isRussian ? 'Стили' : 'Styles'}
                  </label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setIsBold(!isBold)}
                      className={`flex-1 py-2 rounded-xl border flex items-center justify-center font-bold ${isBold ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-high)] text-[var(--color-text-sec)]'}`}
                      style={{ borderColor: isBold ? primaryColor : 'var(--color-border)' }}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsItalic(!isItalic)}
                      className={`flex-1 py-2 rounded-xl border flex items-center justify-center italic ${isItalic ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-high)] text-[var(--color-text-sec)]'}`}
                      style={{ borderColor: isItalic ? primaryColor : 'var(--color-border)' }}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsUnderline(!isUnderline)}
                      className={`flex-1 py-2 rounded-xl border flex items-center justify-center underline ${isUnderline ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-high)] text-[var(--color-text-sec)]'}`}
                      style={{ borderColor: isUnderline ? primaryColor : 'var(--color-border)' }}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsStrikethrough(!isStrikethrough)}
                      className={`flex-1 py-2 rounded-xl border flex items-center justify-center line-through ${isStrikethrough ? 'bg-[var(--color-primary)] text-black' : 'bg-[var(--color-surface-high)] text-[var(--color-text-sec)]'}`}
                      style={{ borderColor: isStrikethrough ? primaryColor : 'var(--color-border)' }}
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Color Accent */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-[var(--color-text-sec)]">
                  {isRussian ? 'Цвет маркера' : 'Marker Accent Color'}
                </label>
                <div className="grid grid-cols-8 gap-2 mb-2">
                  {CUSTOM_BLOCK_SWATCHES.map(hex => {
                    const isSel = customColorHex.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={hex}
                        onClick={() => setCustomColorHex(hex)}
                        className="aspect-square rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-xs"
                        style={{
                          backgroundColor: hex,
                          border: isSel ? '2.5px solid var(--color-text)' : '1px solid transparent'
                        }}
                      >
                        {isSel && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="p-2.5 rounded-xl border flex items-center gap-3"
                  style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                >
                  <input
                    type="color"
                    value={customColorHex}
                    onChange={e => setCustomColorHex(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={customColorHex}
                    onChange={e => setCustomColorHex(e.target.value)}
                    className="flex-1 bg-transparent font-mono text-xs uppercase font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Saved Templates */}
          {activeTab === 2 && (
            <div className="space-y-3">
              {/* Save template inline */}
              <div
                className="p-3.5 rounded-2xl border space-y-2.5"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <label className="block text-xs font-bold text-[var(--color-text)]">
                  {isRussian ? 'Сохранить как шаблон' : 'Save current as template'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={templateName}
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder={customTypeName || (isRussian ? 'Имя шаблона' : 'Template name')}
                    className="flex-1 px-3 py-1.5 rounded-xl border text-xs outline-none"
                    style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                  />
                  <button
                    onClick={handleSaveAsTemplate}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95"
                    style={{ backgroundColor: customColorHex, color: isColorLight ? '#000' : '#FFF' }}
                  >
                    {isRussian ? 'Сохранить' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Templates List */}
              <div className="space-y-2">
                {templates.map(tmpl => {
                  const tIcon = ICONS.find(i => i.id === tmpl.customIconName?.split('|')[0]) || ICONS[0];
                  return (
                    <div
                      key={tmpl.id}
                      className="p-3 rounded-2xl border flex items-center justify-between"
                      style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                    >
                      <div
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                        onClick={() => {
                          setCustomTypeName(tmpl.customTypeName || tmpl.name);
                          setCustomPrefix(tmpl.customPrefix || '');
                          setCustomColorHex(tmpl.customColorHex || '#E5A93C');
                          setSelectedIcon(tmpl.customIconName?.split('|')[0] || 'tune');
                          setSelectedFont(tmpl.customIconName?.split('|')[1] || 'serif');
                          setAlignment(tmpl.alignment || 'LEFT');
                          setIsBold(tmpl.style?.isBold || false);
                          setIsItalic(tmpl.style?.isItalic || false);
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${tmpl.customColorHex}25`, color: tmpl.customColorHex || primaryColor }}
                        >
                          {tIcon.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate text-[var(--color-text)]">{tmpl.name}</div>
                          <div className="text-[10px] text-[var(--color-text-sec)]">
                            {tmpl.customTypeName} {tmpl.customPrefix && `• ${tmpl.customPrefix}`}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTemplate(tmpl.id)}
                        className="p-1.5 text-rose-500 hover:opacity-80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="flex gap-2.5 pt-4 mt-2 border-t border-[var(--color-border)]">
          <button
            onClick={onDismiss}
            className="flex-1 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {isRussian ? 'Отмена' : 'Cancel'}
          </button>
          <button
            onClick={() => {
              handleApply();
              onDismiss();
            }}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            style={{ backgroundColor: customColorHex, color: isColorLight ? '#000' : '#FFF' }}
          >
            {isRussian ? 'Применить блок' : 'Apply Block'}
          </button>
        </div>
      </div>
    </div>
  );
};
