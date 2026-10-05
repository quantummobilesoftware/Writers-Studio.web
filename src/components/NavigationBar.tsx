import React, { useState } from 'react';
import {
  Book,
  BarChart2,
  Settings,
  PenTool,
  ChevronLeft,
  ChevronRight,
  User,
  Sparkles
} from 'lucide-react';
import { BottomBarStyle } from '../types';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';
import { StorageService } from '../services/storage';

interface NavigationBarProps {
  activeTab: 'PROJECTS' | 'STATS' | 'SETTINGS';
  onSelectTab: (tab: 'PROJECTS' | 'STATS' | 'SETTINGS') => void;
  style: BottomBarStyle;
  lang: string;
  onOpenProfile?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onSelectTab,
  style,
  lang,
  onOpenProfile
}) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });

  const authorName = StorageService.getAuthorName();
  const authorAvatar = StorageService.getAuthorAvatar();

  const tabs: { id: 'PROJECTS' | 'STATS' | 'SETTINGS'; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'PROJECTS', label: l('cabinet', lang), icon: <Book className="w-5 h-5 shrink-0" />, shortcut: 'Alt+1' },
    { id: 'STATS', label: l('progress', lang), icon: <BarChart2 className="w-5 h-5 shrink-0" />, shortcut: 'Alt+2' },
    { id: 'SETTINGS', label: l('options', lang), icon: <Settings className="w-5 h-5 shrink-0" />, shortcut: 'Alt+3' }
  ];

  return (
    <>
      {/* Desktop Side Navigation Bar (Collapsible or Compact) */}
      <aside
        className={`hidden md:flex flex-col py-5 px-3 border-r border-[var(--color-border)] shrink-0 z-40 transition-all duration-300 ${
          isExpanded ? 'w-60' : 'w-20 items-center'
        }`}
        style={{ backgroundColor: surfaceContainerLow }}
      >
        {/* Top Branding / Logo */}
        <div className={`flex items-center gap-3 mb-6 ${isExpanded ? 'px-2 justify-between' : 'justify-center'}`}>
          <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => onSelectTab('PROJECTS')}>
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0"
              style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
            >
              <PenTool className="w-5 h-5" />
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <span className="font-extrabold text-sm tracking-tight text-[var(--color-text)] truncate block">
                  Writer's Studio
                </span>
                <span className="text-[10px] text-[var(--color-text-sec)] flex items-center gap-1 font-medium">
                  <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                  <span>Desktop Edition</span>
                </span>
              </div>
            )}
          </div>

          {/* Toggle Expand/Collapse Button */}
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1.5 rounded-xl text-[var(--color-text-sec)] hover:bg-[var(--color-border)] transition-colors"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {!isExpanded && (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-1.5 rounded-xl text-[var(--color-text-sec)] hover:bg-[var(--color-border)] mb-4 transition-colors"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 flex flex-col gap-1.5 w-full">
          {tabs.map(tab => {
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full flex items-center gap-3.5 py-3 rounded-2xl transition-all active:scale-98 group ${
                  isExpanded ? 'px-3.5 text-left' : 'flex-col justify-center px-1'
                }`}
                style={{
                  backgroundColor: isSel ? `${primaryColor}22` : 'transparent',
                  color: isSel ? primaryColor : 'var(--color-text-sec)'
                }}
              >
                <div
                  className={`p-1.5 rounded-xl transition-colors ${
                    isSel ? 'bg-[var(--color-primary)] text-black' : 'group-hover:bg-[var(--color-border)]'
                  }`}
                >
                  {tab.icon}
                </div>

                {isExpanded ? (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className={`text-xs font-bold truncate ${isSel ? 'text-[var(--color-text)]' : ''}`}>
                      {tab.label}
                    </span>
                    <span className="text-[10px] opacity-40 font-mono hidden xl:inline">
                      {tab.shortcut}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] font-bold mt-0.5 max-w-[64px] truncate">{tab.label}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom User Profile Card */}
        {onOpenProfile && (
          <div className="pt-4 border-t border-[var(--color-border)] w-full">
            <button
              onClick={onOpenProfile}
              className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all hover:bg-[var(--color-border)] text-left ${
                isExpanded ? 'px-2.5' : 'justify-center px-1'
              }`}
            >
              <div
                className="w-9 h-9 rounded-full border flex items-center justify-center shrink-0 overflow-hidden shadow-xs"
                style={{ borderColor: primaryColor, backgroundColor: surfaceContainerHigh }}
              >
                {authorAvatar ? (
                  <img src={authorAvatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4" style={{ color: primaryColor }} />
                )}
              </div>

              {isExpanded && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-[var(--color-text)] truncate">{authorName || 'Автор'}</div>
                  <div className="text-[10px] text-[var(--color-text-sec)] truncate">
                    {lang === 'ru' ? 'Настройки профиля' : 'Profile Settings'}
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 pointer-events-none pb-safe">
        {/* Style: CAPSULE (Floating Rounded Pill) */}
        {style === 'CAPSULE' && (
          <div className="px-5 py-3 flex justify-center pointer-events-auto">
            <nav
              className="w-full max-w-sm rounded-full p-1.5 px-3 flex items-center justify-around shadow-2xl border backdrop-blur-md"
              style={{
                backgroundColor: surfaceContainerHigh,
                borderColor: 'var(--color-border)'
              }}
            >
              {tabs.map(tab => {
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onSelectTab(tab.id)}
                    className="flex items-center gap-2 py-2 px-3 rounded-full transition-all active:scale-95"
                    style={{
                      backgroundColor: isSel ? primaryColor : 'transparent',
                      color: isSel ? '#000' : 'var(--color-text-sec)'
                    }}
                  >
                    {tab.icon}
                    {isSel && (
                      <span className="text-xs font-bold whitespace-nowrap animate-fadeIn">
                        {tab.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Style: SEGMENTED (Discrete Floating Capsules) */}
        {style === 'SEGMENTED' && (
          <div className="px-4 py-2.5 flex gap-2.5 max-w-md mx-auto pointer-events-auto">
            {tabs.map(tab => {
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className="flex-1 py-2 px-1 rounded-2xl flex flex-col items-center justify-center gap-1 border shadow-lg transition-all active:scale-95 backdrop-blur-md"
                  style={{
                    backgroundColor: isSel ? `${primaryColor}25` : surfaceContainerHigh,
                    borderColor: isSel ? primaryColor : 'var(--color-border)',
                    color: isSel ? primaryColor : 'var(--color-text-sec)'
                  }}
                >
                  {tab.icon}
                  <span className="text-[10px] font-bold truncate max-w-full">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Style: STANDARD (Full-width Material 3 Navigation Bar) */}
        {style === 'STANDARD' && (
          <nav
            className="w-full border-t border-[var(--color-border)] flex items-center justify-around py-1.5 px-2 pointer-events-auto shadow-md"
            style={{ backgroundColor: surfaceColor }}
          >
            {tabs.map(tab => {
              const isSel = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className="flex-1 flex flex-col items-center py-1 transition-all"
                  style={{ color: isSel ? primaryColor : 'var(--color-text-sec)' }}
                >
                  <div
                    className="w-12 h-7 rounded-full flex items-center justify-center transition-all"
                    style={{ backgroundColor: isSel ? `${primaryColor}20` : 'transparent' }}
                  >
                    {tab.icon}
                  </div>
                  <span className="text-[10px] font-semibold mt-0.5">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </>
  );
};
