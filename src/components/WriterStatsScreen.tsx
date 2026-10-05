import React, { useMemo } from 'react';
import { Flame, FileText, Type, BarChart2, Sparkles } from 'lucide-react';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';

interface WriterStatsScreenProps {
  lang: string;
}

export const WriterStatsScreen: React.FC<WriterStatsScreenProps> = ({ lang }) => {
  const { primaryColor, surfaceContainerLow } = useTheme();
  const isRussian = lang === 'ru';

  const stats = useMemo(() => StorageService.getStats(), []);
  const totalWords = useMemo(() => stats.reduce((acc, s) => acc + s.wordsCount, 0), [stats]);
  const totalChars = useMemo(() => stats.reduce((acc, s) => acc + s.charsCount, 0), [stats]);

  // Calculate Streak
  const streak = useMemo(() => {
    let count = 0;
    const activeDates = new Set(stats.filter(s => s.wordsCount > 0).map(s => s.dateString));
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    let start = activeDates.has(todayStr) ? today : activeDates.has(yesterdayStr) ? yesterday : null;
    if (start) {
      const cur = new Date(start);
      while (true) {
        const ds = cur.toISOString().split('T')[0];
        if (activeDates.has(ds)) {
          count++;
          cur.setDate(cur.getDate() - 1);
        } else {
          break;
        }
      }
    }
    return count;
  }, [stats]);

  // Last 7 days stats
  const last7Days = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const match = stats.find(s => s.dateString === ds);
      list.push({
        date: ds,
        words: match ? match.wordsCount : 0,
        daysAgo: i
      });
    }
    return list;
  }, [stats]);

  const maxWords = Math.max(...last7Days.map(d => d.words), 100);
  const midWords = Math.round(maxWords / 2);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 max-w-3xl mx-auto w-full space-y-4 pb-28">
      {/* Title */}
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
        {l('stats_title', lang)}
      </h1>

      {/* 1. Streak Card */}
      <div
        className="rounded-3xl p-5 border flex items-center gap-4 shadow-xs"
        style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Flame className="w-7 h-7" style={{ color: primaryColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[var(--color-text-sec)]">
            {l('stats_streak', lang).replace(':', '')}
          </div>
          <div className="text-2xl font-bold" style={{ color: primaryColor }}>
            {streak} {l('days_short', lang)} 🔥
          </div>
        </div>
      </div>

      {/* 2. Total Words & Chars Combined Card */}
      <div
        className="rounded-3xl border overflow-hidden shadow-xs divide-y divide-[var(--color-border)]"
        style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
      >
        {/* Words Row */}
        <div className="p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-sm text-[var(--color-text-sec)]">
              {l('stats_words', lang).replace(':', '')}
            </span>
          </div>
          <span className="text-base font-bold text-[var(--color-text)] font-mono">
            {totalWords.toLocaleString()} {l('words_suffix', lang)}
          </span>
        </div>

        {/* Chars Row */}
        <div className="p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
            >
              <Type className="w-5 h-5" />
            </div>
            <span className="text-sm text-[var(--color-text-sec)]">
              {l('stats_chars', lang).replace(':', '')}
            </span>
          </div>
          <span className="text-base font-bold text-[var(--color-text)] font-mono">
            {totalChars.toLocaleString()} {l('chars_suffix', lang)}
          </span>
        </div>
      </div>

      {/* 3. Productivity Header */}
      <div className="flex items-center gap-2 pt-2">
        <BarChart2 className="w-4 h-4" style={{ color: primaryColor }} />
        <h3 className="font-bold text-sm text-[var(--color-text)]">
          {isRussian ? 'Продуктивность' : 'Productivity'}
        </h3>
        <span className="text-xs text-[var(--color-text-sec)]">
          ({isRussian ? 'Последние 7 дней' : 'Last 7 days'})
        </span>
      </div>

      {/* 4. Productivity Graph Card (SVG Bar Chart) */}
      <div
        className="rounded-3xl p-5 border shadow-xs space-y-3"
        style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-end gap-3 h-44 pt-2">
          {/* Y Axis scale */}
          <div className="flex flex-col justify-between h-full text-[10px] font-mono text-[var(--color-text-sec)] pr-1 select-none">
            <span>{maxWords}</span>
            <span>{midWords}</span>
            <span>0</span>
          </div>

          {/* SVG Canvas Bars */}
          <div className="flex-1 h-full flex items-end justify-between gap-2 relative">
            {/* Horizontal Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-b border-dashed border-[var(--color-border)] w-full opacity-40" />
              <div className="border-b border-dashed border-[var(--color-border)] w-full opacity-40" />
              <div className="border-b border-dashed border-[var(--color-border)] w-full opacity-40" />
            </div>

            {/* Bars */}
            {last7Days.map(item => {
              const heightPct = Math.max(4, Math.round((item.words / maxWords) * 100));
              return (
                <div key={item.date} className="flex-1 flex flex-col items-center justify-end h-full z-10 group">
                  <div
                    className="w-full max-w-[28px] rounded-t-lg transition-all duration-300 group-hover:opacity-80 relative shadow-sm"
                    style={{
                      height: `${heightPct}%`,
                      backgroundColor: item.words > 0 ? primaryColor : 'var(--color-border)'
                    }}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-mono font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                      {item.words}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X Axis Labels */}
        <div className="flex justify-between pl-8 text-[10px] text-[var(--color-text-sec)]">
          {last7Days.map(item => {
            const label = item.daysAgo === 0
              ? (isRussian ? 'Сегодня' : 'Today')
              : `${item.daysAgo} ${isRussian ? 'дн.' : 'd'}`;
            return (
              <span key={item.date} className="flex-1 text-center truncate">
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* 5. Motivational Card */}
      <div
        className="rounded-3xl p-5 border flex items-center gap-4 shadow-xs"
        style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
          style={{ backgroundColor: `${primaryColor}20` }}
        >
          <Sparkles className="w-6 h-6" style={{ color: primaryColor }} />
        </div>
        <div>
          <h4 className="font-bold text-sm text-[var(--color-text)]">
            {isRussian ? 'Так держать!' : 'Keep it up!'}
          </h4>
          <p className="text-xs text-[var(--color-text-sec)] mt-0.5">
            {isRussian
              ? 'Постоянство — ключ к великим историям.'
              : 'Consistency is the key to great stories.'}
          </p>
        </div>
      </div>
    </div>
  );
};
