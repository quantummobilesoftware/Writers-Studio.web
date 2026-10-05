import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  X,
  Sliders,
  ChevronDown,
  Gauge,
  Type,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2,
  Keyboard
} from 'lucide-react';
import { Document, EditorBlock } from '../types';
import { useTheme } from './ThemeWrapper';

interface PrompterScreenProps {
  document: Document;
  onClose: () => void;
  lang: string;
}

export const PrompterScreen: React.FC<PrompterScreenProps> = ({
  document: doc,
  onClose,
  lang
}) => {
  const { primaryColor } = useTheme();
  const isRussian = lang === 'ru';

  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(10); // 1 to 50
  const [fontSize, setFontSize] = useState(28); // 16 to 72
  const [fontFamily, setFontFamily] = useState<'SERIF' | 'SANS_SERIF' | 'MONO'>('SERIF');
  const [prompterTheme, setPrompterTheme] = useState<'DARK' | 'AMBER' | 'BRIGHT'>('DARK');
  const [mirrorH, setMirrorH] = useState(false);
  const [mirrorV, setMirrorV] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotkeysHint, setShowHotkeysHint] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Extract full manuscript text
  const fullText = React.useMemo(() => {
    try {
      const blocks: EditorBlock[] = JSON.parse(doc.contentBlocksJson);
      return blocks
        .filter(b => b.type !== 'image')
        .map(b => {
          if (b.type === 'scene' || b.type === 'character') return b.text.toUpperCase();
          if (b.type === 'dialogue' && b.parenthetical) return `(${b.parenthetical})\n${b.text}`;
          return b.text;
        })
        .join('\n\n');
    } catch {
      return '';
    }
  }, [doc.contentBlocksJson]);

  // Words count & time estimate
  const wordsCount = React.useMemo(() => {
    return fullText.trim().split(/\s+/).filter(Boolean).length;
  }, [fullText]);

  // VSync Animation Frame Loop
  useEffect(() => {
    let lastTime = performance.now();

    const scrollTick = (now: number) => {
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;

      if (isScrolling && containerRef.current) {
        const step = scrollSpeed * 20 * elapsed;
        containerRef.current.scrollTop += step;
      }
      animFrameRef.current = requestAnimationFrame(scrollTick);
    };

    animFrameRef.current = requestAnimationFrame(scrollTick);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isScrolling, scrollSpeed]);

  // Desktop Keyboard Shortcuts: Space (Play/Pause), Up/Down (Speed), Left/Right (Size), Escape (Exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsScrolling(s => !s);
      } else if (e.code === 'Escape') {
        onClose();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        setScrollSpeed(s => Math.min(50, s + 1));
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        setScrollSpeed(s => Math.max(1, s - 1));
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        setFontSize(s => Math.min(72, s + 2));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setFontSize(s => Math.max(16, s - 2));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const toggleBrowserFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const bgStyle = prompterTheme === 'AMBER'
    ? '#0F0B00'
    : prompterTheme === 'BRIGHT'
    ? '#FFFFFF'
    : '#000000';

  const textStyle = prompterTheme === 'AMBER'
    ? '#FFA500'
    : prompterTheme === 'BRIGHT'
    ? '#000000'
    : '#FFFFFF';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col select-none overflow-hidden"
      style={{ backgroundColor: bgStyle, color: textStyle }}
    >
      {/* Desktop Hotkeys Hint Banner at top */}
      {showHotkeysHint && (
        <div
          className="hidden sm:flex items-center justify-between px-6 py-2.5 z-40 text-xs border-b border-white/10 backdrop-blur-md"
          style={{ backgroundColor: `${bgStyle}D0` }}
        >
          <div className="flex items-center gap-4 text-xs opacity-75 font-mono">
            <span className="flex items-center gap-1">
              <Keyboard className="w-3.5 h-3.5" />
              <span>ПК Горячие клавиши:</span>
            </span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Space</kbd> Старт/Пауза</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">↑/↓</kbd> Скорость ({scrollSpeed})</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">←/→</kbd> Размер ({fontSize}pt)</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">Esc</kbd> Выход</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleBrowserFullscreen}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowHotkeysHint(false)}
              className="p-1.5 rounded-lg text-white/50 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Gradient Ambient Fade */}
      <div
        className="absolute top-0 left-0 right-0 h-28 pointer-events-none z-10"
        style={{
          background: `linear-gradient(to bottom, ${bgStyle} 10%, transparent 100%)`
        }}
      />

      {/* Reading Guide Center Indicator Line */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex items-center px-4 pointer-events-none z-20 opacity-60">
        <div
          className="w-0 h-0 border-y-8 border-y-transparent border-l-12 mr-2 animate-pulse"
          style={{ borderLeftColor: primaryColor }}
        />
        <div
          className="flex-1 h-px"
          style={{
            background: `linear-gradient(to right, transparent, ${primaryColor}, transparent)`
          }}
        />
        <div
          className="w-0 h-0 border-y-8 border-y-transparent border-r-12 ml-2 animate-pulse"
          style={{ borderRightColor: primaryColor }}
        />
      </div>

      {/* Main Text Container with Hardware Mirror Transforms */}
      <div
        ref={containerRef}
        onClick={() => setIsScrolling(s => !s)}
        className="flex-1 overflow-y-auto px-8 sm:px-24 md:px-36 py-40 transition-transform cursor-pointer"
        style={{
          transform: `scale(${mirrorH ? -1 : 1}, ${mirrorV ? -1 : 1})`,
          fontFamily: fontFamily === 'MONO' ? 'monospace' : fontFamily === 'SANS_SERIF' ? 'sans-serif' : 'serif'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          <p
            className="whitespace-pre-wrap leading-relaxed tracking-wide text-center"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.6 }}
          >
            {fullText || (isRussian ? 'Текст отсутствует...' : 'No text content in document...')}
          </p>
          <div className="h-96" />
        </div>
      </div>

      {/* Bottom Gradient Fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-36 pointer-events-none z-10"
        style={{
          background: `linear-gradient(to top, ${bgStyle} 15%, transparent 100%)`
        }}
      />

      {/* Collapsible Floating Controls Drawer */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
        {isSettingsOpen ? (
          <div
            className="rounded-3xl p-4 sm:p-5 shadow-2xl border backdrop-blur-md space-y-3.5 animate-slideUp text-xs"
            style={{
              backgroundColor: prompterTheme === 'BRIGHT' ? 'rgba(240, 242, 248, 0.95)' : 'rgba(22, 22, 26, 0.95)',
              borderColor: 'rgba(255,255,255,0.15)',
              color: prompterTheme === 'BRIGHT' ? '#000' : '#FFF'
            }}
          >
            {/* Header / Play-Pause / Collapse Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsScrolling(s => !s)}
                  className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90"
                  style={{ backgroundColor: primaryColor, color: '#000' }}
                >
                  {isScrolling ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <div>
                  <div className="font-bold text-sm">
                    {isScrolling ? (isRussian ? 'Прокрутка активна' : 'Scrolling') : (isRussian ? 'Пауза (клик / пробел)' : 'Paused (tap / space)')}
                  </div>
                  <div className="text-[11px] opacity-70">
                    {wordsCount} {isRussian ? 'слов' : 'words'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleBrowserFullscreen}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                  title="Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20"
                  title="Collapse"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-rose-600/20 text-rose-500 hover:bg-rose-600/30"
                  title="Exit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sliders: Speed & Font Size */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 font-semibold opacity-80">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>{isRussian ? 'Скорость:' : 'Speed:'}</span>
                  </span>
                  <span className="font-bold font-mono">{scrollSpeed}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={scrollSpeed}
                  onChange={e => setScrollSpeed(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 font-semibold opacity-80">
                    <Type className="w-3.5 h-3.5" />
                    <span>{isRussian ? 'Размер шрифта:' : 'Text Size:'}</span>
                  </span>
                  <span className="font-bold font-mono">{fontSize}pt</span>
                </div>
                <input
                  type="range"
                  min="16"
                  max="72"
                  value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
              </div>
            </div>

            {/* Mirror & Theme Buttons */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              {/* Mirrors */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setMirrorH(m => !m)}
                  className={`p-2 rounded-xl border flex items-center gap-1 font-semibold ${mirrorH ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5'}`}
                  title="Mirror Horizontal"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>H</span>
                </button>
                <button
                  onClick={() => setMirrorV(m => !m)}
                  className={`p-2 rounded-xl border flex items-center gap-1 font-semibold ${mirrorV ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5'}`}
                  title="Mirror Vertical"
                >
                  <FlipVertical className="w-3.5 h-3.5" />
                  <span>V</span>
                </button>
              </div>

              {/* Themes */}
              <div className="flex gap-1">
                {(['DARK', 'AMBER', 'BRIGHT'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setPrompterTheme(t)}
                    className={`px-2.5 py-1 rounded-lg border font-bold ${prompterTheme === t ? 'bg-[var(--color-primary)] text-black' : 'bg-white/5'}`}
                  >
                    {t === 'DARK' ? 'Dark' : t === 'AMBER' ? 'Amber' : 'Bright'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              className="rounded-full px-4 py-2 border shadow-2xl backdrop-blur-md flex items-center gap-3 animate-slideUp"
              style={{
                backgroundColor: 'rgba(22, 22, 26, 0.9)',
                borderColor: 'rgba(255,255,255,0.15)'
              }}
            >
              <button
                onClick={() => setIsScrolling(s => !s)}
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {isScrolling ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-white/80 hover:text-white"
              >
                <Sliders className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 text-rose-500">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
