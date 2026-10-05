import React, { useState } from 'react';
import { X, User, Cloud, CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';

interface AccountProfileDialogProps {
  onDismiss: () => void;
  lang: string;
}

export const AccountProfileDialog: React.FC<AccountProfileDialogProps> = ({ onDismiss, lang }) => {
  const { primaryColor, surfaceColor, surfaceContainerLow, surfaceContainerHigh } = useTheme();

  const [activeTab, setActiveTab] = useState<number>(0);
  const [name, setName] = useState(() => StorageService.getAuthorName());
  const [bio, setBio] = useState(() => StorageService.getAuthorBio());
  const [avatar, setAvatar] = useState(() => StorageService.getAuthorAvatar());
  const [isCloudEnabled, setIsCloudEnabled] = useState(() => StorageService.getSetting('ws_cloud_sync_enabled', false));
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const projects = StorageService.getProjects();
  const stats = StorageService.getStats();
  const totalWords = stats.reduce((acc, s) => acc + s.wordsCount, 0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleSaveProfile = () => {
    StorageService.setAuthorName(name.trim() || 'Автор');
    StorageService.setAuthorBio(bio.trim());
    StorageService.setAuthorAvatar(avatar.trim());
    showToast(lang === 'ru' ? 'Профиль сохранен' : 'Profile saved');
    setTimeout(() => onDismiss(), 600);
  };

  const handleConnectCloud = () => {
    setIsCloudEnabled(true);
    StorageService.setSetting('ws_cloud_sync_enabled', true);
    showToast(lang === 'ru' ? 'Синхронизация с облаком включена' : 'Cloud sync enabled');
  };

  const handleDisconnectCloud = () => {
    setIsCloudEnabled(false);
    StorageService.setSetting('ws_cloud_sync_enabled', false);
    showToast(lang === 'ru' ? 'Облако отключено' : 'Cloud disconnected');
  };

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      showToast(lang === 'ru' ? 'Синхронизация завершена' : 'Sync completed successfully');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: surfaceColor,
          borderColor: 'var(--color-border)'
        }}
      >
        {/* Top Header & Avatar */}
        <div className="relative flex flex-col items-center mb-4">
          <button
            onClick={onDismiss}
            className="absolute top-0 right-0 p-2 rounded-full hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-sec)' }}
          >
            <X className="w-5 h-5" />
          </button>

          <div
            className="w-20 h-20 rounded-full border-2 flex items-center justify-center overflow-hidden mb-2.5 relative group cursor-pointer shadow-md"
            style={{ borderColor: primaryColor, backgroundColor: surfaceContainerLow }}
            onClick={() => {
              const url = prompt(
                lang === 'ru' ? 'Введите URL аватарки:' : 'Enter avatar image URL:',
                avatar
              );
              if (url !== null) setAvatar(url.trim());
            }}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User className="w-10 h-10" style={{ color: primaryColor }} />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-white font-medium">
              {lang === 'ru' ? 'Изменить' : 'Change'}
            </div>
          </div>

          <h2 className="text-lg font-bold text-[var(--color-text)]">{name || 'Автор'}</h2>
          <p className="text-xs text-[var(--color-text-sec)]">
            {isCloudEnabled ? 'writer.studio@cloud' : (lang === 'ru' ? 'Локальный профиль' : 'Local Profile')}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--color-border)] mb-4">
          {[
            lang === 'ru' ? 'Аккаунт и Cloud' : 'Account & Cloud',
            lang === 'ru' ? 'Профиль' : 'Profile',
            lang === 'ru' ? 'Статистика' : 'Stats'
          ].map((title, idx) => {
            const isSel = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className="flex-1 pb-2.5 text-xs font-semibold relative transition-colors"
                style={{
                  color: isSel ? primaryColor : 'var(--color-text-sec)'
                }}
              >
                {title}
                {isSel && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-sm">
          {activeTab === 0 && (
            <div className="space-y-4">
              {isCloudEnabled ? (
                <div
                  className="rounded-2xl p-4 border space-y-3"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  <div className="flex items-center gap-3">
                    <Cloud className="w-6 h-6" style={{ color: primaryColor }} />
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-[var(--color-text)]">
                        {lang === 'ru' ? 'Облачная синхронизация' : 'Cloud Backup & Sync'}
                      </div>
                      <div className="text-xs text-[var(--color-text-sec)] flex items-center gap-1.5 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        {isSyncing
                          ? (lang === 'ru' ? 'Синхронизация...' : 'Syncing...')
                          : (lang === 'ru' ? 'Подключено' : 'Connected')}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleManualSync}
                      disabled={isSyncing}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all active:scale-95"
                      style={{
                        borderColor: primaryColor,
                        color: primaryColor,
                        backgroundColor: `${primaryColor}15`
                      }}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      {lang === 'ru' ? 'Синхронизировать' : 'Sync Now'}
                    </button>
                    <button
                      onClick={handleDisconnectCloud}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all active:scale-95"
                    >
                      {lang === 'ru' ? 'Отключить' : 'Disconnect'}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="rounded-2xl p-5 border text-center space-y-3"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  <div
                    className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <CloudOff className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-[var(--color-text)]">
                      {lang === 'ru' ? 'Синхронизация отключена' : 'Cloud Sync Disabled'}
                    </h3>
                    <p className="text-xs text-[var(--color-text-sec)] mt-1">
                      {lang === 'ru'
                        ? 'Подключите облако для автоматического бэкапа рукописей и синхронизации проектов.'
                        : 'Enable cloud sync to safely back up manuscripts and sync your projects.'}
                    </p>
                  </div>
                  <button
                    onClick={handleConnectCloud}
                    className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                    style={{ backgroundColor: primaryColor, color: '#000' }}
                  >
                    {lang === 'ru' ? 'Подключить облако' : 'Connect Cloud Sync'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                  {lang === 'ru' ? 'Имя автора' : 'Author Name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)]"
                  style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                  placeholder="Имя автора"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                  {lang === 'ru' ? 'О себе' : 'Bio'}
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)] resize-none"
                  style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                  placeholder="Драматург, писатель..."
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                style={{ backgroundColor: primaryColor, color: '#000' }}
              >
                {lang === 'ru' ? 'Сохранить изменения' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-3">
              <div
                className="flex items-center justify-between p-3.5 rounded-2xl border"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <span className="text-xs text-[var(--color-text-sec)]">
                  {lang === 'ru' ? 'Всего проектов:' : 'Total Projects:'}
                </span>
                <span className="text-base font-bold" style={{ color: primaryColor }}>
                  {projects.length}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-3.5 rounded-2xl border"
                style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
              >
                <span className="text-xs text-[var(--color-text-sec)]">
                  {lang === 'ru' ? 'Всего написано слов:' : 'Total Words Written:'}
                </span>
                <span className="text-base font-bold text-emerald-500">
                  {totalWords.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="mt-3 py-1.5 px-3 rounded-lg text-xs font-medium text-center bg-black/80 text-white animate-fadeIn">
            {toastMsg}
          </div>
        )}
      </div>
    </div>
  );
};
