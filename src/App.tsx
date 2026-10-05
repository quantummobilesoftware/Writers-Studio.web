import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeWrapper';
import { AppLockScreen } from './components/AppLockScreen';
import { ProjectsDashboard } from './components/ProjectsDashboard';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { PrompterScreen } from './components/PrompterScreen';
import { WriterStatsScreen } from './components/WriterStatsScreen';
import { AppSettingsScreen } from './components/AppSettingsScreen';
import { NavigationBar } from './components/NavigationBar';
import { AccountProfileDialog } from './components/AccountProfileDialog';
import { StorageService } from './services/storage';
import { WorkspaceProject, Document } from './types';

function MainApp() {
  const [lang, setLang] = useState<string>(() => StorageService.getAppLanguage());
  const [isLocked, setIsLocked] = useState<boolean>(() => StorageService.isPinEnabled());

  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'STATS' | 'SETTINGS'>('PROJECTS');
  const [selectedProject, setSelectedProject] = useState<WorkspaceProject | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [isPrompterMode, setIsPrompterMode] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);

  const bottomBarStyle = StorageService.getBottomBarStyle();

  useEffect(() => {
    return StorageService.subscribe(() => {
      setLang(StorageService.getAppLanguage());
    });
  }, []);

  // Desktop global shortcuts: Alt+1 (Projects), Alt+2 (Stats), Alt+3 (Settings)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        setActiveTab('PROJECTS');
        setSelectedProject(null);
        setSelectedDoc(null);
      } else if (e.altKey && e.key === '2') {
        e.preventDefault();
        setActiveTab('STATS');
        setSelectedProject(null);
        setSelectedDoc(null);
      } else if (e.altKey && e.key === '3') {
        e.preventDefault();
        setActiveTab('SETTINGS');
        setSelectedProject(null);
        setSelectedDoc(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLanguageChange = (newLang: string) => {
    StorageService.setAppLanguage(newLang);
    setLang(newLang);
  };

  if (isLocked) {
    return <AppLockScreen onUnlocked={() => setIsLocked(false)} lang={lang} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden select-none bg-[var(--color-bg)]">
      {/* Side rail on desktop (hidden when teleprompter is active) */}
      {!isPrompterMode && (
        <NavigationBar
          activeTab={activeTab}
          onSelectTab={tab => {
            setActiveTab(tab);
            setSelectedProject(null);
            setSelectedDoc(null);
          }}
          style={bottomBarStyle}
          lang={lang}
          onOpenProfile={() => setShowProfileModal(true)}
        />
      )}

      {/* Main Content Stage */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {isPrompterMode && selectedDoc ? (
          <PrompterScreen
            document={selectedDoc}
            onClose={() => setIsPrompterMode(false)}
            lang={lang}
          />
        ) : selectedProject ? (
          <ProjectWorkspace
            project={selectedProject}
            onBack={() => {
              setSelectedDoc(null);
              setSelectedProject(null);
            }}
            selectedDoc={selectedDoc}
            onSelectDocument={doc => setSelectedDoc(doc)}
            onCloseDocument={() => setSelectedDoc(null)}
            onLaunchPrompter={() => setIsPrompterMode(true)}
            lang={lang}
          />
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            {activeTab === 'PROJECTS' && (
              <ProjectsDashboard
                onSelectProject={proj => {
                  setSelectedProject(proj);
                  setSelectedDoc(null);
                }}
                lang={lang}
              />
            )}
            {activeTab === 'STATS' && <WriterStatsScreen lang={lang} />}
            {activeTab === 'SETTINGS' && (
              <AppSettingsScreen
                lang={lang}
                onLanguageChange={handleLanguageChange}
              />
            )}
          </div>
        )}
      </main>

      {/* Account Profile Dialog */}
      {showProfileModal && (
        <AccountProfileDialog
          lang={lang}
          onDismiss={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
