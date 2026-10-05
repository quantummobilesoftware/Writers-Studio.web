import React, { useState, useMemo } from 'react';
import {
  X,
  Palette,
  Sparkles,
  Bookmark,
  Check,
  RotateCcw,
  Copy,
  Sliders,
  Paintbrush,
  Eye,
  EyeOff
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { CustomPaletteItem } from '../types';
import { l } from '../services/localization';
import { useTheme, isColorBright } from './ThemeWrapper';

interface CustomPaletteDialogProps {
  onDismiss: () => void;
  lang: string;
}

const PRESET_THEMES = [
  { name: 'Золотой Век', nameEn: 'Golden Age', desc: 'Теплый классический стиль писательской студии', descEn: 'Warm classic writer studio style', primary: '#E5A93C', bg: '#0E1015', icon: '📜' },
  { name: 'Киберпанк', nameEn: 'Cyberpunk', desc: 'Яркий неоновый акцент на полуночном холсте', descEn: 'Vivid neon pink on midnight backdrop', primary: '#FF007F', bg: '#0A0A12', icon: '⚡' },
  { name: 'Изумрудный Лес', nameEn: 'Emerald Forest', desc: 'Глубокий сосновый оттенок для фокуса', descEn: 'Deep pine green for deep focus', primary: '#10B981', bg: '#08140F', icon: '🌲' },
  { name: 'Северный Океан', nameEn: 'Nordic Ocean', desc: 'Ледяной циан и арктическая ночь', descEn: 'Glacier cyan accent and arctic midnight', primary: '#06B6D4', bg: '#091224', icon: '🌊' },
  { name: 'Эспрессо и Книги', nameEn: 'Espresso & Books', desc: 'Уютная кофейно-карамельная эстетика', descEn: 'Cozy caramel and coffeehouse aesthetic', primary: '#D97706', bg: '#17120F', icon: '☕' },
  { name: 'Королевский Аметист', nameEn: 'Royal Amethyst', desc: 'Благородный фиолетовый для фэнтези', descEn: 'Noble violet for fantasy and mystery novels', primary: '#A78BFA', bg: '#0D0A18', icon: '🔮' },
  { name: 'Закат на Ривьере', nameEn: 'Riviera Sunset', desc: 'Мягкий персиково-коралловый закат', descEn: 'Warm coral peach sunset gradient', primary: '#FF6B6B', bg: '#161821', icon: '🌅' },
  { name: 'Матрица', nameEn: 'Matrix', desc: 'Классический зеленый хакерский терминал', descEn: 'Iconic hacker green terminal', primary: '#22C55E', bg: '#000000', icon: '💻' },
  { name: 'Цветение Сакуры', nameEn: 'Sakura Bloom', desc: 'Нежный романтический цветочный тон', descEn: 'Gentle romantic floral pink', primary: '#FB7185', bg: '#160F14', icon: '🌸' },
  { name: 'Классическая Бумага', nameEn: 'Paper Classic', desc: 'Традиционные типографские чернила', descEn: 'Traditional typographic ink on bright linen', primary: '#1E40AF', bg: '#F8F8FA', icon: '📄' },
  { name: 'Теплый Пергамент', nameEn: 'Warm Parchment', desc: 'Винтажный оттенок старинных рукописей', descEn: 'Soft vintage look of classic manuscripts', primary: '#B45309', bg: '#FFFDF7', icon: '📜' },
  { name: 'Космический Индиго', nameEn: 'Cosmic Indigo', desc: 'Глубокий индиго и чернила созвездий', descEn: 'Deep celestial indigo and ink cosmos', primary: '#818CF8', bg: '#0B0F19', icon: '✨' }
];

const CANVAS_TONES = [
  { id: 'oled', nameRu: 'OLED Черный', nameEn: 'OLED Black', hex: '#000000', isDark: true },
  { id: 'obsidian', nameRu: 'Обсидиан', nameEn: 'Obsidian', hex: '#0E1015', isDark: true },
  { id: 'midnight', nameRu: 'Индиго Ночь', nameEn: 'Midnight Indigo', hex: '#0B132B', isDark: true },
  { id: 'charcoal', nameRu: 'Угольный Сланец', nameEn: 'Charcoal Slate', hex: '#181A20', isDark: true },
  { id: 'espresso', nameRu: 'Теплый Эспрессо', nameEn: 'Warm Espresso', hex: '#1A1615', isDark: true },
  { id: 'forest', nameRu: 'Глухой Бор', nameEn: 'Emerald Forest', hex: '#0A1913', isDark: true },
  { id: 'white', nameRu: 'Чистый Белый', nameEn: 'Pure White', hex: '#FFFFFF', isDark: false },
  { id: 'linen', nameRu: 'Светлый Лен', nameEn: 'Light Linen', hex: '#F8F8FA', isDark: false },
  { id: 'parchment', nameRu: 'Теплый Пергамент', nameEn: 'Warm Parchment', hex: '#FFFDF7', isDark: false },
  { id: 'mist', nameRu: 'Ледяной Туман', nameEn: 'Ice Mist', hex: '#F0F4F8', isDark: false },
];

const QUICK_SWATCHES = [
  '#D0BCFF', '#E5A93C', '#F59E0B', '#F97316',
  '#EF4444', '#FF6B6B', '#FF007F', '#FB7185',
  '#D946EF', '#A78BFA', '#818CF8', '#60A5FA',
  '#38BDF8', '#06B6D4', '#2DD4BF', '#10B981',
  '#22C55E', '#84CC16', '#EAB308', '#FB923C',
  '#94A3B8', '#64748B', '#B45309', '#1E40AF'
];

export const CustomPaletteDialog: React.FC<CustomPaletteDialogProps> = ({ onDismiss, lang }) => {
  const {
    customPrimaryHex,
    setCustomPrimaryHex,
    customBgHex,
    setCustomBgHex,
    setColorPalette,
    surfaceColor,
    surfaceContainerLow,
    surfaceContainerHigh
  } = useTheme();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [activePrimary, setActivePrimary] = useState(customPrimaryHex || '#E5A93C');
  const [activeBg, setActiveBg] = useState(customBgHex || '#0E1015');
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [savedPalettes, setSavedPalettes] = useState<CustomPaletteItem[]>(() => StorageService.getSavedCustomPalettes());
  const [newPaletteName, setNewPaletteName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [customBgInput, setCustomBgInput] = useState(customBgHex || '#0E1015');

  const isRussian = lang === 'ru';
  const isPrimaryBright = isColorBright(activePrimary);
  const isBgLight = isColorBright(activeBg);

  const handleApply = (prim: string, bg: string) => {
    setCustomPrimaryHex(prim);
    setCustomBgHex(bg);
    setColorPalette('CUSTOM');
    onDismiss();
  };

  const handleSavePalette = () => {
    const name = newPaletteName.trim() || (isRussian ? `Палитра #${savedPalettes.length + 1}` : `Palette #${savedPalettes.length + 1}`);
    const newItem: CustomPaletteItem = {
      id: Date.now().toString(),
      name,
      primaryHex: activePrimary,
      bgHex: activeBg,
      surfaceHex: ''
    };
    const updated = [newItem, ...savedPalettes];
    setSavedPalettes(updated);
    StorageService.saveCustomPalettes(updated);
    setShowSaveModal(false);
    setNewPaletteName('');
  };

  const handleDeletePalette = (id: string) => {
    const updated = savedPalettes.filter(p => p.id !== id);
    setSavedPalettes(updated);
    StorageService.saveCustomPalettes(updated);
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
        {/* Top Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${activePrimary}25` }}
            >
              <Palette className="w-5 h-5" style={{ color: activePrimary }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--color-text)]">
                {l('palette_studio', lang)}
              </h2>
              <p className="text-xs text-[var(--color-text-sec)]">
                {l('customize_palette_desc', lang)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPreviewOpen(!isPreviewOpen)}
              className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80"
              title="Toggle preview"
            >
              {isPreviewOpen ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={onDismiss} className="p-2 rounded-xl text-[var(--color-text-sec)] hover:opacity-80">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Interactive Preview Card */}
        {isPreviewOpen && (
          <div
            className="rounded-2xl p-4 mb-4 border transition-all shadow-md relative overflow-hidden"
            style={{
              backgroundColor: activeBg,
              borderColor: `${activePrimary}50`,
              color: isBgLight ? '#111' : '#F7F5F0'
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                {/* 3-Tone Split Circle Swatch */}
                <div
                  className="w-8 h-8 rounded-full border-2 overflow-hidden relative shadow-inner"
                  style={{ borderColor: activePrimary }}
                >
                  <div className="w-full h-1/2" style={{ backgroundColor: activePrimary }} />
                  <div className="w-full h-1/2 flex">
                    <div className="w-1/2 h-full" style={{ backgroundColor: `${activePrimary}40` }} />
                    <div className="w-1/2 h-full" style={{ backgroundColor: activeBg }} />
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">
                    {isRussian ? 'Предпросмотр темы Material 3' : 'Material 3 Live Preview'}
                  </div>
                  <div className="text-[10px] font-mono opacity-70">
                    {activePrimary} • {activeBg}
                  </div>
                </div>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: `${activePrimary}30`, color: activePrimary }}
              >
                LIVE
              </span>
            </div>

            {/* Miniature Manuscript Card */}
            <div
              className="rounded-xl p-3 border flex items-center justify-between shadow-xs"
              style={{
                backgroundColor: isBgLight ? '#FFFFFF' : '#1F2230',
                borderColor: `${activePrimary}35`
              }}
            >
              <div>
                <div className="font-bold text-xs">{l('sample_book_title', lang)}</div>
                <div className="text-[11px] opacity-75">{l('sample_chapter', lang)}</div>
              </div>
              <button
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-transform active:scale-95 shadow-sm"
                style={{
                  backgroundColor: activePrimary,
                  color: isPrimaryBright ? '#000' : '#FFF'
                }}
              >
                {l('sample_btn_action', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Studio Navigation Tabs */}
        <div className="flex rounded-2xl p-1 gap-1 border mb-4" style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}>
          {[
            { id: 0, label: l('primary_accent', lang), icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 1, label: l('background_canvas', lang), icon: <Paintbrush className="w-3.5 h-3.5" /> },
            { id: 2, label: l('presets_gallery', lang), icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 3, label: `${l('saved_palettes', lang)} (${savedPalettes.length})`, icon: <Bookmark className="w-3.5 h-3.5" /> }
          ].map(tab => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  backgroundColor: isSel ? `${activePrimary}25` : 'transparent',
                  color: isSel ? activePrimary : 'var(--color-text-sec)'
                }}
              >
                {tab.icon}
                <span className="hidden sm:inline truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 0: Primary Accent Config */}
        {activeTab === 0 && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Quick Swatches Grid */}
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-2">
                {l('quick_swatches', lang)}
              </label>
              <div className="grid grid-cols-8 gap-2">
                {QUICK_SWATCHES.map(hex => {
                  const isSel = activePrimary.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      onClick={() => setActivePrimary(hex)}
                      className="aspect-square rounded-full flex items-center justify-center transition-transform active:scale-90 shadow-sm"
                      style={{
                        backgroundColor: hex,
                        border: isSel ? '2.5px solid var(--color-text)' : '1px solid transparent'
                      }}
                    >
                      {isSel && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom HEX Code */}
            <div
              className="p-3.5 rounded-2xl border flex items-center gap-3"
              style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl border shrink-0 shadow-inner"
                style={{ backgroundColor: activePrimary, borderColor: 'var(--color-border)' }}
              />
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[var(--color-text-sec)]">
                  {l('hex_code', lang)}
                </label>
                <input
                  type="text"
                  value={activePrimary}
                  onChange={e => {
                    const val = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                    setActivePrimary(val);
                  }}
                  className="w-full bg-transparent text-sm font-mono font-bold outline-none uppercase"
                  placeholder="#E5A93C"
                />
              </div>
              <input
                type="color"
                value={activePrimary}
                onChange={e => setActivePrimary(e.target.value)}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Tab 1: Background & Canvas Tone */}
        {activeTab === 1 && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text)] mb-2">
                {isRussian ? 'Тонированные поверхности холста' : 'Canvas Background Presets'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CANVAS_TONES.map(item => {
                  const isSel = activeBg.toLowerCase() === item.hex.toLowerCase();
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveBg(item.hex)}
                      className="flex items-center justify-between p-3 rounded-2xl border text-xs font-semibold transition-all active:scale-98"
                      style={{
                        backgroundColor: item.hex,
                        borderColor: isSel ? activePrimary : 'var(--color-border)',
                        color: item.isDark ? '#FFF' : '#000'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: `${activePrimary}60`, borderColor: activePrimary }}
                        />
                        <span>{isRussian ? item.nameRu : item.nameEn}</span>
                      </div>
                      {isSel && <Check className="w-4 h-4" style={{ color: activePrimary }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Background Input */}
            <div
              className="p-3.5 rounded-2xl border flex items-center gap-3"
              style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
            >
              <div
                className="w-10 h-10 rounded-xl border shrink-0 shadow-inner"
                style={{ backgroundColor: activeBg, borderColor: 'var(--color-border)' }}
              />
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-[var(--color-text-sec)]">
                  {l('custom_bg_option', lang)}
                </label>
                <input
                  type="text"
                  value={customBgInput}
                  onChange={e => {
                    const val = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                    setCustomBgInput(val);
                    if (val.length === 7) setActiveBg(val);
                  }}
                  className="w-full bg-transparent text-sm font-mono font-bold outline-none uppercase"
                  placeholder="#0E1015"
                />
              </div>
              <input
                type="color"
                value={activeBg}
                onChange={e => {
                  setActiveBg(e.target.value);
                  setCustomBgInput(e.target.value);
                }}
                className="w-9 h-9 rounded-lg border-0 cursor-pointer bg-transparent"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Presets Gallery */}
        {activeTab === 2 && (
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {PRESET_THEMES.map(theme => {
              const isCurr = activePrimary.toLowerCase() === theme.primary.toLowerCase() && activeBg.toLowerCase() === theme.bg.toLowerCase();
              return (
                <div
                  key={theme.nameEn}
                  onClick={() => {
                    setActivePrimary(theme.primary);
                    setActiveBg(theme.bg);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all hover:scale-[1.01] active:scale-98"
                  style={{
                    backgroundColor: isCurr ? `${activePrimary}15` : surfaceContainerLow,
                    borderColor: isCurr ? activePrimary : 'var(--color-border)'
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{theme.icon}</span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[var(--color-text)] truncate">
                        {isRussian ? theme.name : theme.nameEn}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-sec)] truncate">
                        {isRussian ? theme.desc : theme.descEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className="w-6 h-6 rounded-full border shadow-xs"
                      style={{ backgroundColor: theme.primary, borderColor: 'var(--color-border)' }}
                    />
                    <div
                      className="w-6 h-6 rounded-full border shadow-xs"
                      style={{ backgroundColor: theme.bg, borderColor: 'var(--color-border)' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 3: Saved Palettes */}
        {activeTab === 3 && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <button
              onClick={() => setShowSaveModal(true)}
              className="w-full py-2.5 rounded-xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 hover:opacity-80 transition-opacity"
              style={{ borderColor: activePrimary, color: activePrimary }}
            >
              <Bookmark className="w-4 h-4" />
              <span>{l('save_as_new', lang)}</span>
            </button>

            {savedPalettes.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--color-text-sec)]">
                {isRussian ? 'Нет сохраненных палитр' : 'No saved palettes yet'}
              </div>
            ) : (
              savedPalettes.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl border"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  <div
                    className="flex items-center gap-3 cursor-pointer min-w-0 flex-1"
                    onClick={() => {
                      setActivePrimary(item.primaryHex);
                      if (item.bgHex) setActiveBg(item.bgHex);
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full border shrink-0"
                      style={{ backgroundColor: item.primaryHex, borderColor: 'var(--color-border)' }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[var(--color-text)] truncate">{item.name}</div>
                      <div className="text-[10px] font-mono text-[var(--color-text-sec)]">
                        {item.primaryHex} {item.bgHex && `• ${item.bgHex}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleApply(item.primaryHex, item.bgHex || '#0E1015')}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: item.primaryHex, color: isColorBright(item.primaryHex) ? '#000' : '#FFF' }}
                    >
                      {l('apply_palette', lang)}
                    </button>
                    <button
                      onClick={() => handleDeletePalette(item.id)}
                      className="p-1.5 text-rose-500 hover:opacity-80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal: Save Theme */}
        {showSaveModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
            <div
              className="w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-4"
              style={{ backgroundColor: surfaceColor, borderColor: 'var(--color-border)' }}
            >
              <h3 className="font-bold text-sm text-[var(--color-text)]">
                {l('enter_palette_name', lang)}
              </h3>
              <input
                type="text"
                autoFocus
                value={newPaletteName}
                onChange={e => setNewPaletteName(e.target.value)}
                placeholder={isRussian ? 'Например: Ночной Изумруд' : 'e.g. Midnight Emerald'}
                className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none"
                style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="flex-1 py-2 rounded-xl border text-xs font-semibold"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  {l('cancel', lang)}
                </button>
                <button
                  onClick={handleSavePalette}
                  className="flex-1 py-2 rounded-xl text-xs font-bold shadow-md"
                  style={{ backgroundColor: activePrimary, color: isPrimaryBright ? '#000' : '#FFF' }}
                >
                  {l('save_as_new', lang)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center gap-2.5 pt-4 mt-2 border-t border-[var(--color-border)]">
          <button
            onClick={() => {
              setActivePrimary('#E5A93C');
              setActiveBg('#0E1015');
              StorageService.resetPaletteToDefault();
            }}
            className="p-2.5 rounded-xl border text-[var(--color-text-sec)] hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border)' }}
            title={l('reset_palette', lang)}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            className="px-4 py-2.5 rounded-xl border text-xs font-semibold hover:opacity-80 transition-opacity"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
          >
            {l('save_as_new', lang)}
          </button>
          <button
            onClick={() => handleApply(activePrimary, activeBg)}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            style={{ backgroundColor: activePrimary, color: isPrimaryBright ? '#000' : '#FFF' }}
          >
            {l('apply_palette', lang)}
          </button>
        </div>
      </div>
    </div>
  );
};
