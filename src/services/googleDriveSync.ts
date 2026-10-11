import { getAccessToken } from './googleAuth';
import { StorageService } from './storage';

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string | number;
}

export type SyncState = 'IDLE' | 'CHECKING' | 'SYNCING' | 'SUCCESS' | 'ERROR';

export interface SyncStatus {
  state: SyncState;
  lastSyncedAt: number | null;
  remoteModifiedAt: string | null;
  remoteFileSize: number | null;
  message: string | null;
}

const BACKUP_FILENAME = 'writers_studio_backup.json';
const LAST_SYNC_KEY = 'ws_last_cloud_sync_timestamp';

let currentStatus: SyncStatus = {
  state: 'IDLE',
  lastSyncedAt: Number(localStorage.getItem(LAST_SYNC_KEY)) || null,
  remoteModifiedAt: null,
  remoteFileSize: null,
  message: null
};

const listeners = new Set<(status: SyncStatus) => void>();

function setStatus(update: Partial<SyncStatus>) {
  currentStatus = { ...currentStatus, ...update };
  listeners.forEach(cb => {
    try {
      cb(currentStatus);
    } catch (e) {
      console.error(e);
    }
  });
}

export const GoogleDriveSync = {
  subscribe(callback: (status: SyncStatus) => void) {
    listeners.add(callback);
    callback(currentStatus);
    return () => {
      listeners.delete(callback);
    };
  },

  getStatus(): SyncStatus {
    return currentStatus;
  },

  /**
   * Search for existing Writer's Studio backup in Google Drive
   */
  async findBackupFile(): Promise<DriveFileInfo | null> {
    const token = await getAccessToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');

    setStatus({ state: 'CHECKING', message: 'Checking Google Drive...' });

    try {
      const q = encodeURIComponent(`name = '${BACKUP_FILENAME}' and trashed = false`);
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime,size)&pageSize=1`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('AUTH_EXPIRED');
        }
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Drive API error: ${res.status}`);
      }

      const data = await res.json();
      const files: DriveFileInfo[] = data.files || [];
      if (files.length > 0) {
        const file = files[0];
        setStatus({
          state: 'IDLE',
          remoteModifiedAt: file.modifiedTime || null,
          remoteFileSize: file.size ? Number(file.size) : null,
          message: null
        });
        return file;
      }

      setStatus({ state: 'IDLE', remoteModifiedAt: null, remoteFileSize: null, message: null });
      return null;
    } catch (err: any) {
      setStatus({ state: 'ERROR', message: err.message });
      throw err;
    }
  },

  /**
   * Upload and sync full local workspace backup to Google Drive
   */
  async uploadBackup(): Promise<DriveFileInfo> {
    const token = await getAccessToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');

    setStatus({ state: 'SYNCING', message: 'Uploading workspace to Google Drive...' });

    try {
      const existing = await this.findBackupFile();
      const backupJson = StorageService.exportBackupJson();

      let resultFile: DriveFileInfo;

      if (existing) {
        // Update existing file content
        const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`;
        const res = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: backupJson
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed to update backup on Drive: ${res.status}`);
        }

        resultFile = await res.json();
      } else {
        // Create new file with multipart upload
        const boundary = '-------314159265358979323846';
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadata = {
          name: BACKUP_FILENAME,
          mimeType: 'application/json',
          description: "Writer's Studio Workspace Backup"
        };

        const multipartRequestBody =
          delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/json\r\n\r\n' +
          backupJson +
          closeDelimiter;

        const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        const res = await fetch(createUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`
          },
          body: multipartRequestBody
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Failed to create backup on Drive: ${res.status}`);
        }

        resultFile = await res.json();
      }

      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, String(now));

      setStatus({
        state: 'SUCCESS',
        lastSyncedAt: now,
        remoteModifiedAt: new Date(now).toISOString(),
        remoteFileSize: new Blob([backupJson]).size,
        message: 'Successfully synced to Google Drive'
      });

      return resultFile;
    } catch (err: any) {
      setStatus({ state: 'ERROR', message: err.message });
      throw err;
    }
  },

  /**
   * Download and restore workspace backup from Google Drive
   */
  async restoreBackup(): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');

    setStatus({ state: 'SYNCING', message: 'Restoring backup from Google Drive...' });

    try {
      const existing = await this.findBackupFile();
      if (!existing) {
        throw new Error('No backup file found in your Google Drive');
      }

      const downloadUrl = `https://www.googleapis.com/drive/v3/files/${existing.id}?alt=media`;
      const res = await fetch(downloadUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Failed to download backup: ${res.status}`);
      }

      const jsonText = await res.text();
      const success = StorageService.importBackupJson(jsonText);

      if (!success) {
        throw new Error('Invalid backup file format');
      }

      const now = Date.now();
      localStorage.setItem(LAST_SYNC_KEY, String(now));

      setStatus({
        state: 'SUCCESS',
        lastSyncedAt: now,
        remoteModifiedAt: existing.modifiedTime || null,
        message: 'Workspace successfully restored from Google Drive'
      });

      return true;
    } catch (err: any) {
      setStatus({ state: 'ERROR', message: err.message });
      throw err;
    }
  },

  /**
   * Delete backup file from Google Drive
   */
  async deleteBackup(): Promise<boolean> {
    const token = await getAccessToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');

    setStatus({ state: 'SYNCING', message: 'Deleting backup from Google Drive...' });

    try {
      const existing = await this.findBackupFile();
      if (!existing) {
        setStatus({ state: 'IDLE', message: null });
        return true;
      }

      const deleteUrl = `https://www.googleapis.com/drive/v3/files/${existing.id}`;
      const res = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok && res.status !== 404) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `Failed to delete backup: ${res.status}`);
      }

      localStorage.removeItem(LAST_SYNC_KEY);
      setStatus({
        state: 'IDLE',
        lastSyncedAt: null,
        remoteModifiedAt: null,
        remoteFileSize: null,
        message: 'Backup deleted from Google Drive'
      });

      return true;
    } catch (err: any) {
      setStatus({ state: 'ERROR', message: err.message });
      throw err;
    }
  },

  /**
   * Save an individual file (script, book chapter, or text) directly to Google Drive
   */
  async saveFileToDrive(fileName: string, content: string, mimeType: string = 'text/plain'): Promise<DriveFileInfo> {
    const token = await getAccessToken();
    if (!token) throw new Error('NOT_AUTHENTICATED');

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: fileName,
      mimeType: mimeType,
      description: "Created by Writer's Studio"
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Failed to upload file to Google Drive: ${res.status}`);
    }

    return await res.json();
  }
};
