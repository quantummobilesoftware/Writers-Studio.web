import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Download,
  Upload,
  Trash2,
  LogOut,
  HardDrive,
  Clock,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { StorageService } from '../services/storage';
import { l } from '../services/localization';
import { useTheme } from './ThemeWrapper';
import {
  googleSignIn,
  logoutGoogle,
  subscribeAuth,
  getCurrentUser,
  getAccessToken
} from '../services/googleAuth';
import { GoogleDriveSync, SyncStatus, DriveFileInfo } from '../services/googleDriveSync';
import { GoogleSignInButton } from './GoogleSignInButton';
import { CloudConfirmDialog } from './CloudConfirmDialog';

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

  // Google Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [hasToken, setHasToken] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => GoogleDriveSync.getStatus());
  const [remoteFile, setRemoteFile] = useState<DriveFileInfo | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Confirmation modals state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'UPLOAD' | 'RESTORE' | 'DELETE' | 'LOGOUT';
    title: string;
    description: string;
    confirmLabel: string;
    isDestructive: boolean;
  }>({
    isOpen: false,
    type: 'UPLOAD',
    title: '',
    description: '',
    confirmLabel: '',
    isDestructive: false
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const projects = StorageService.getProjects();
  const stats = StorageService.getStats();
  const totalWords = stats.reduce((acc, s) => acc + s.wordsCount, 0);

  const isRu = lang === 'ru';

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Subscribe to Auth changes
  useEffect(() => {
    const unsub = subscribeAuth((user, tokenAvailable) => {
      setCurrentUser(user);
      setHasToken(tokenAvailable);
      if (user && user.displayName && !StorageService.getAuthorName()) {
        StorageService.setAuthorName(user.displayName);
        setName(user.displayName);
      }
      if (user && user.photoURL && !StorageService.getAuthorAvatar()) {
        StorageService.setAuthorAvatar(user.photoURL);
        setAvatar(user.photoURL);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to Drive Sync status
  useEffect(() => {
    const unsub = GoogleDriveSync.subscribe(status => {
      setSyncStatus(status);
    });
    return () => unsub();
  }, []);

  // Check remote file if user is logged in
  useEffect(() => {
    if (currentUser) {
      GoogleDriveSync.findBackupFile()
        .then(f => setRemoteFile(f))
        .catch(err => {
          console.warn('Initial drive check:', err);
        });
    }
  }, [currentUser]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        showToast(
          isRu
            ? `Успешно подключен Google аккаунт: ${res.user.displayName || res.user.email}`
            : `Google account connected: ${res.user.displayName || res.user.email}`
        );
        // Refresh drive file info
        const file = await GoogleDriveSync.findBackupFile();
        setRemoteFile(file);
      }
    } catch (err: any) {
      console.error(err);
      showToast(isRu ? 'Ошибка входа в Google' : 'Google sign-in error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveProfile = () => {
    StorageService.setAuthorName(name.trim() || (isRu ? 'Автор' : 'Author'));
    StorageService.setAuthorBio(bio.trim());
    StorageService.setAuthorAvatar(avatar.trim());
    showToast(isRu ? 'Профиль сохранен' : 'Profile saved');
    setTimeout(() => onDismiss(), 600);
  };

  // Prompt before upload/overwrite to Google Drive
  const requestUploadSync = () => {
    if (remoteFile) {
      setConfirmModal({
        isOpen: true,
        type: 'UPLOAD',
        title: isRu ? 'Перезаписать копию в Google Диске?' : 'Overwrite Google Drive backup?',
        description: isRu
          ? 'Файл writers_studio_backup.json на вашем Google Диске будет обновлен текущими данными вашей локальной библиотеки (проекты, документы, настройки).'
          : 'The writers_studio_backup.json file on your Google Drive will be updated with your local workspace data (projects, documents, settings).',
        confirmLabel: isRu ? 'Обновить в Диске' : 'Update on Drive',
        isDestructive: false
      });
    } else {
      executeUpload();
    }
  };

  const executeUpload = async () => {
    setIsActionLoading(true);
    try {
      const file = await GoogleDriveSync.uploadBackup();
      setRemoteFile(file);
      showToast(isRu ? 'Синхронизация с Google Диском завершена!' : 'Synced to Google Drive successfully!');
    } catch (err: any) {
      showToast(isRu ? `Ошибка выгрузки: ${err.message}` : `Upload error: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Prompt before restoring from Google Drive
  const requestRestore = () => {
    setConfirmModal({
      isOpen: true,
      type: 'RESTORE',
      title: isRu ? 'Восстановить данные из Google Диска?' : 'Restore from Google Drive?',
      description: isRu
        ? 'Внимание! Ваши локальные проекты и рукописи будут заменены версией из резервной копии Google Диска. Несохраненные локальные данные могут быть перезаписаны.'
        : 'Warning! Your local projects and manuscripts will be replaced with the version from Google Drive backup. Any unsaved local edits may be overwritten.',
      confirmLabel: isRu ? 'Восстановить' : 'Restore',
      isDestructive: true
    });
  };

  const executeRestore = async () => {
    setIsActionLoading(true);
    try {
      await GoogleDriveSync.restoreBackup();
      showToast(isRu ? 'Проекты успешно восстановлены из Google Диска!' : 'Workspace successfully restored from Google Drive!');
      setTimeout(() => onDismiss(), 1000);
    } catch (err: any) {
      showToast(isRu ? `Ошибка восстановления: ${err.message}` : `Restore error: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  // Prompt before deleting Google Drive backup
  const requestDeleteBackup = () => {
    setConfirmModal({
      isOpen: true,
      type: 'DELETE',
      title: isRu ? 'Удалить копию из Google Диска?' : 'Delete Google Drive backup?',
      description: isRu
        ? 'Резервная копия writers_studio_backup.json будет безвозвратно удалена из вашего Google Диска. Ваши локальные файлы останутся на устройстве.'
        : 'The writers_studio_backup.json file will be deleted from your Google Drive. Your local device files will remain intact.',
      confirmLabel: isRu ? 'Удалить из Диска' : 'Delete from Drive',
      isDestructive: true
    });
  };

  const executeDelete = async () => {
    setIsActionLoading(true);
    try {
      await GoogleDriveSync.deleteBackup();
      setRemoteFile(null);
      showToast(isRu ? 'Резервная копия удалена из Google Диска' : 'Backup deleted from Google Drive');
    } catch (err: any) {
      showToast(isRu ? `Ошибка удаления: ${err.message}` : `Delete error: ${err.message}`);
    } finally {
      setIsActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const executeLogout = async () => {
    setIsActionLoading(true);
    try {
      await logoutGoogle();
      setRemoteFile(null);
      showToast(isRu ? 'Вы вышли из Google аккаунта' : 'Signed out from Google');
    } catch (err: any) {
      showToast(isRu ? 'Ошибка выхода' : 'Sign out error');
    } finally {
      setIsActionLoading(false);
      setConfirmModal(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleModalConfirm = () => {
    if (confirmModal.type === 'UPLOAD') executeUpload();
    else if (confirmModal.type === 'RESTORE') executeRestore();
    else if (confirmModal.type === 'DELETE') executeDelete();
    else if (confirmModal.type === 'LOGOUT') executeLogout();
  };

  const formatFileSize = (bytes?: number | string | null) => {
    if (!bytes) return '—';
    const num = Number(bytes);
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatSyncTime = (timestamp?: number | string | null) => {
    if (!timestamp) return isRu ? 'Никогда' : 'Never';
    const d = new Date(timestamp);
    return d.toLocaleString(isRu ? 'ru-RU' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
        <div
          className="w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all flex flex-col max-h-[92vh] animate-popIn"
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
                  isRu ? 'Введите URL аватарки:' : 'Enter avatar image URL:',
                  currentUser?.photoURL || avatar
                );
                if (url !== null) setAvatar(url.trim());
              }}
            >
              {currentUser?.photoURL || avatar ? (
                <img
                  src={currentUser?.photoURL || avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10" style={{ color: primaryColor }} />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-white font-medium">
                {isRu ? 'Изменить' : 'Change'}
              </div>
            </div>

            <h2 className="text-lg font-bold text-[var(--color-text)]">
              {currentUser?.displayName || name || (isRu ? 'Автор' : 'Author')}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              {currentUser ? (
                <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{currentUser.email}</span>
                </span>
              ) : (
                <span className="text-xs text-[var(--color-text-sec)]">
                  {isRu ? 'Локальный профиль (не синхронизирован)' : 'Local profile (not synced)'}
                </span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[var(--color-border)] mb-4">
            {[
              isRu ? 'Google Cloud & Диск' : 'Google Cloud & Drive',
              isRu ? 'Профиль' : 'Profile',
              isRu ? 'Статистика' : 'Stats'
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
            {/* TAB 0: Google Cloud & Drive Sync */}
            {activeTab === 0 && (
              <div className="space-y-4">
                {currentUser ? (
                  // Connected State
                  <div className="space-y-4">
                    {/* User connection card */}
                    <div
                      className="rounded-2xl p-4 border space-y-3.5"
                      style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                          >
                            <Cloud className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-bold text-sm text-[var(--color-text)] flex items-center gap-2">
                              <span>Google Drive Sync</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                                {isRu ? 'Активно' : 'Active'}
                              </span>
                            </div>
                            <div className="text-xs text-[var(--color-text-sec)]">
                              {currentUser.email}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              type: 'LOGOUT',
                              title: isRu ? 'Выйти из Google аккаунта?' : 'Sign out from Google?',
                              description: isRu
                                ? 'Облачная синхронизация будет приостановлена до повторного входа.'
                                : 'Cloud sync will be paused until you sign in again.',
                              confirmLabel: isRu ? 'Выйти' : 'Sign out',
                              isDestructive: false
                            });
                          }}
                          className="p-1.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title={isRu ? 'Выйти' : 'Sign out'}
                        >
                          <LogOut className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Drive Backup Status Information */}
                      <div className="pt-2 border-t border-[var(--color-border)] space-y-2 text-xs">
                        <div className="flex items-center justify-between text-[var(--color-text-sec)]">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isRu ? 'Последняя синхронизация:' : 'Last Synced:'}</span>
                          </span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {formatSyncTime(syncStatus.lastSyncedAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[var(--color-text-sec)]">
                          <span className="flex items-center gap-1.5">
                            <HardDrive className="w-3.5 h-3.5" />
                            <span>{isRu ? 'Файл в Google Диске:' : 'Drive Backup File:'}</span>
                          </span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {remoteFile ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <FileCheck className="w-3.5 h-3.5" />
                                <span>writers_studio_backup.json ({formatFileSize(remoteFile.size)})</span>
                              </span>
                            ) : (
                              <span className="opacity-60">{isRu ? 'Еще не создан' : 'Not created yet'}</span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Sync Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <button
                          onClick={requestUploadSync}
                          disabled={syncStatus.state === 'SYNCING' || isActionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                          style={{
                            backgroundColor: primaryColor,
                            color: '#000'
                          }}
                        >
                          <Upload className={`w-3.5 h-3.5 ${syncStatus.state === 'SYNCING' ? 'animate-bounce' : ''}`} />
                          <span>
                            {syncStatus.state === 'SYNCING'
                              ? (isRu ? 'Синхронизация...' : 'Syncing...')
                              : (isRu ? 'Выгрузить в Диск' : 'Upload to Drive')}
                          </span>
                        </button>

                        <button
                          onClick={requestRestore}
                          disabled={!remoteFile || syncStatus.state === 'SYNCING' || isActionLoading}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 disabled:opacity-40"
                          style={{
                            borderColor: primaryColor,
                            color: primaryColor,
                            backgroundColor: `${primaryColor}15`
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>{isRu ? 'Восстановить из Диска' : 'Restore from Drive'}</span>
                        </button>
                      </div>

                      {/* Delete Remote Backup Option */}
                      {remoteFile && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={requestDeleteBackup}
                            disabled={isActionLoading}
                            className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{isRu ? 'Удалить копию с Google Диска' : 'Delete cloud backup'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Security & Scope Info Note */}
                    <div
                      className="rounded-2xl p-3.5 border flex items-start gap-2.5 text-xs"
                      style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                    >
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-[11px] leading-relaxed text-[var(--color-text-sec)]">
                        {isRu
                          ? 'Приложение имеет доступ исключительно к файлам, созданным самой программой (scope drive.file). Ваши личные файлы на Google Диске остаются конфиденциальными.'
                          : 'The app only has access to files created by the application itself (drive.file scope). Your other Google Drive files remain completely private.'}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Not Connected State: Google Sign In Prompt
                  <div
                    className="rounded-2xl p-6 border text-center space-y-4"
                    style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-inner"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <Cloud className="w-7 h-7" style={{ color: primaryColor }} />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-base text-[var(--color-text)]">
                        {isRu ? 'Google аккаунт и синхронизация' : 'Google Account & Cloud Sync'}
                      </h3>
                      <p className="text-xs text-[var(--color-text-sec)] mt-1.5 leading-relaxed max-w-sm mx-auto">
                        {isRu
                          ? 'Авторизуйтесь через Google для безопасного сохранения ваших рукописей, сценариев и настроек на Google Диске и доступа к ним с любого компьютера.'
                          : 'Sign in with your Google account to automatically back up your screenplays, novels, and studio settings to Google Drive and access them from any computer.'}
                      </p>
                    </div>

                    <div className="pt-2 flex flex-col items-center">
                      <GoogleSignInButton
                        onClick={handleGoogleLogin}
                        isLoading={isLoggingIn}
                        text={isRu ? 'Войти через Google' : 'Sign in with Google'}
                        className="w-full max-w-xs shadow-md"
                      />
                    </div>

                    <div className="pt-2 text-[11px] text-[var(--color-text-sec)] opacity-70">
                      {isRu
                        ? 'Требуется разрешение на создание резервных копий в Google Диске'
                        : 'Requires permission to create backups in Google Drive'}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: Author Profile */}
            {activeTab === 1 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                    {isRu ? 'Имя автора' : 'Author Name'}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)]"
                    style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                    placeholder={isRu ? 'Имя автора' : 'Author name'}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-[var(--color-text-sec)]">
                    {isRu ? 'О себе' : 'Bio'}
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2 rounded-xl border text-sm outline-none transition-all focus:border-[var(--color-primary)] resize-none"
                    style={{ backgroundColor: surfaceContainerHigh, borderColor: 'var(--color-border)' }}
                    placeholder={isRu ? 'Драматург, писатель, сценарист...' : 'Playwright, novelist, screenwriter...'}
                  />
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="w-full py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
                  style={{ backgroundColor: primaryColor, color: '#000' }}
                >
                  {isRu ? 'Сохранить изменения' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* TAB 2: Stats */}
            {activeTab === 2 && (
              <div className="space-y-3">
                <div
                  className="flex items-center justify-between p-3.5 rounded-2xl border"
                  style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                >
                  <span className="text-xs text-[var(--color-text-sec)]">
                    {isRu ? 'Всего проектов:' : 'Total Projects:'}
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
                    {isRu ? 'Всего написано слов:' : 'Total Words Written:'}
                  </span>
                  <span className="text-base font-bold text-emerald-500">
                    {totalWords.toLocaleString()}
                  </span>
                </div>

                {currentUser && (
                  <div
                    className="flex items-center justify-between p-3.5 rounded-2xl border"
                    style={{ backgroundColor: surfaceContainerLow, borderColor: 'var(--color-border)' }}
                  >
                    <span className="text-xs text-[var(--color-text-sec)]">
                      {isRu ? 'Синхронизация с аккаунтом:' : 'Synced Account:'}
                    </span>
                    <span className="text-xs font-semibold text-[var(--color-text)] truncate max-w-[200px]">
                      {currentUser.email}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Toast Feedback */}
          {toastMsg && (
            <div className="mt-3 py-1.5 px-3 rounded-lg text-xs font-medium text-center bg-black/85 text-white border border-white/10 animate-fadeIn">
              {toastMsg}
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Destructive Operation Confirmation Dialog */}
      <CloudConfirmDialog
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmLabel={confirmModal.confirmLabel}
        cancelLabel={isRu ? 'Отмена' : 'Cancel'}
        isDestructive={confirmModal.isDestructive}
        isLoading={isActionLoading}
        onConfirm={handleModalConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};
