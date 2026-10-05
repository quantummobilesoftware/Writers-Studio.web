import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';

interface AppLockScreenProps {
  onUnlocked: () => void;
  lang: string;
}

export const AppLockScreen: React.FC<AppLockScreenProps> = ({ onUnlocked, lang }) => {
  const { primaryColor, surfaceContainerHigh, surfaceContainerLow } = useTheme();
  const [pin, setPin] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (pin.length === 4) {
      const stored = StorageService.getAppPin();
      if (stored === pin) {
        onUnlocked();
      } else {
        setIsShaking(true);
        const timer = setTimeout(() => {
          setPin('');
          setIsShaking(false);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [pin, onUnlocked]);

  const handleKeyClick = (key: string) => {
    if (key === 'C') {
      setPin('');
    } else if (key === '⌫') {
      setPin(prev => prev.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(prev => prev + key);
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['C', '0', '⌫']
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[var(--color-bg)]">
      <div className="flex flex-col items-center max-w-sm w-full">
        {/* Lock Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5 shadow-lg"
          style={{ backgroundColor: `${primaryColor}25` }}
        >
          <Lock className="w-10 h-10" style={{ color: primaryColor }} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-1 text-center">
          {l('my_studio', lang)}
        </h1>
        <p className="text-sm text-[var(--color-text-sec)] mb-8 text-center">
          {l('security_sub', lang)}
        </p>

        {/* 4 Dots */}
        <div className={`flex items-center gap-4 mb-8 ${isShaking ? 'animate-shake' : ''}`}>
          {[1, 2, 3, 4].map(idx => {
            const filled = pin.length >= idx;
            return (
              <div
                key={idx}
                className="w-4 h-4 rounded-full transition-all duration-200 border"
                style={{
                  backgroundColor: filled ? primaryColor : surfaceContainerHigh,
                  borderColor: filled ? primaryColor : 'var(--color-border)'
                }}
              />
            );
          })}
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-3">
          {keys.map((row, rIdx) => (
            <div key={rIdx} className="flex gap-4">
              {row.map(key => {
                const isAction = key === 'C' || key === '⌫';
                return (
                  <button
                    key={key}
                    onClick={() => handleKeyClick(key)}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full flex items-center justify-center text-xl font-semibold transition-transform active:scale-95 shadow-sm hover:opacity-90"
                    style={{
                      backgroundColor: isAction ? surfaceContainerHigh : surfaceContainerLow,
                      color: isAction ? primaryColor : 'var(--color-text)'
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
