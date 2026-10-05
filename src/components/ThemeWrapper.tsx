import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { StorageService } from '../services/storage';
import { ThemeMode, ColorPalette } from '../types';

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colorPalette: ColorPalette;
  setColorPalette: (palette: ColorPalette) => void;
  customPrimaryHex: string;
  setCustomPrimaryHex: (hex: string) => void;
  customBgHex: string;
  setCustomBgHex: (hex: string) => void;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  surfaceContainerLow: string;
  surfaceContainerHigh: string;
  textColor: string;
  textSecondary: string;
  borderColor: string;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export function isColorBright(hex: string): boolean {
  try {
    const clean = hex.replace('#', '');
    const num = parseInt(clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    return lum > 140;
  } catch {
    return false;
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => StorageService.getThemeMode());
  const [colorPalette, setColorPaletteState] = useState<ColorPalette>(() => StorageService.getColorPalette());
  const [customPrimaryHex, setCustomPrimaryHexState] = useState<string>(() => StorageService.getCustomPrimaryColor());
  const [customBgHex, setCustomBgHexState] = useState<string>(() => StorageService.getCustomBgColor());

  useEffect(() => {
    return StorageService.subscribe(() => {
      setThemeModeState(StorageService.getThemeMode());
      setColorPaletteState(StorageService.getColorPalette());
      setCustomPrimaryHexState(StorageService.getCustomPrimaryColor());
      setCustomBgHexState(StorageService.getCustomBgColor());
    });
  }, []);

  const setThemeMode = (m: ThemeMode) => {
    StorageService.setThemeMode(m);
    setThemeModeState(m);
  };

  const setColorPalette = (p: ColorPalette) => {
    StorageService.setColorPalette(p);
    setColorPaletteState(p);
  };

  const setCustomPrimaryHex = (hex: string) => {
    StorageService.setCustomPrimaryColor(hex);
    setCustomPrimaryHexState(hex);
  };

  const setCustomBgHex = (hex: string) => {
    StorageService.setCustomBgColor(hex);
    setCustomBgHexState(hex);
  };

  // Derive active colors based on themeMode & colorPalette
  const isDark = themeMode !== 'LIGHT';

  const primaryColor = useMemo(() => {
    if (colorPalette === 'CUSTOM') return customPrimaryHex || '#E5A93C';
    switch (colorPalette) {
      case 'BLUE': return isDark ? '#8AB4F8' : '#165EC0';
      case 'GREEN': return isDark ? '#81C995' : '#0F6D2E';
      case 'ORANGE': return isDark ? '#FFB066' : '#D35400';
      case 'RED': return isDark ? '#FF8A80' : '#962D22';
      case 'CORAL': return isDark ? '#FE8B77' : '#D85D4E';
      case 'YELLOW': return isDark ? '#FAD02C' : '#B57C00';
      case 'PINK': return isDark ? '#FF80AC' : '#D81B60';
      case 'AMBER': return isDark ? '#D0BCFF' : '#5D3FD3';
      case 'GREY':
      default:
        return isDark ? '#94A3B8' : '#475569';
    }
  }, [colorPalette, customPrimaryHex, isDark]);

  const backgroundColor = useMemo(() => {
    if (colorPalette === 'CUSTOM' && customBgHex) return customBgHex;
    if (themeMode === 'LIGHT') return '#F8F9FC';
    if (themeMode === 'BLACK') return '#000000';
    return '#11121C';
  }, [colorPalette, customBgHex, themeMode]);

  const isBgLight = isColorBright(backgroundColor);

  const surfaceColor = useMemo(() => {
    if (themeMode === 'LIGHT') return '#FFFFFF';
    if (themeMode === 'BLACK') return '#0A0A0D';
    return '#1B1C26';
  }, [themeMode]);

  const surfaceContainerLow = useMemo(() => {
    if (isBgLight) return '#F2F4F8';
    if (themeMode === 'BLACK') return '#101116';
    return '#171822';
  }, [isBgLight, themeMode]);

  const surfaceContainerHigh = useMemo(() => {
    if (isBgLight) return '#E5E8F0';
    if (themeMode === 'BLACK') return '#1F2029';
    return '#262837';
  }, [isBgLight, themeMode]);

  const textColor = isBgLight ? '#111111' : '#F7F5F0';
  const textSecondary = isBgLight ? '#555A68' : '#94A3B8';
  const borderColor = isBgLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)';

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);
    root.style.setProperty('--color-bg', backgroundColor);
    root.style.setProperty('--color-surface', surfaceColor);
    root.style.setProperty('--color-surface-low', surfaceContainerLow);
    root.style.setProperty('--color-surface-high', surfaceContainerHigh);
    root.style.setProperty('--color-text', textColor);
    root.style.setProperty('--color-text-sec', textSecondary);
    root.style.setProperty('--color-border', borderColor);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [primaryColor, backgroundColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh, textColor, textSecondary, borderColor, isDark]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        colorPalette,
        setColorPalette,
        customPrimaryHex,
        setCustomPrimaryHex,
        customBgHex,
        setCustomBgHex,
        primaryColor,
        backgroundColor,
        surfaceColor,
        surfaceContainerLow,
        surfaceContainerHigh,
        textColor,
        textSecondary,
        borderColor,
        isDark
      }}
    >
      <div
        className="min-h-screen w-full transition-colors duration-200 select-none overflow-x-hidden font-sans"
        style={{ backgroundColor, color: textColor }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
