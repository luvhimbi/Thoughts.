import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // Load initial settings from localStorage or use defaults
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('thoughts_themeMode');
    if (saved) return saved;
    
    // Fallback to older setting if it exists
    const oldSaved = localStorage.getItem('thoughts_darkMode');
    if (oldSaved !== null) {
      return JSON.parse(oldSaved) ? 'dark' : 'light';
    }
    
    return 'system';
  });

  const [activeTheme, setActiveTheme] = useState('light');

  const [isCompact, setIsCompact] = useState(() => {
    const saved = localStorage.getItem('thoughts_compactView');
    return saved ? JSON.parse(saved) : false;
  });

  const [voiceTone, setVoiceTone] = useState(() => {
    return localStorage.getItem('thoughts_voiceTone') || 'Friendly';
  });

  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('thoughts_fontFamily') || 'Poppins';
  });

  // Apply dark mode theme to document body and listen for system changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'system') {
        isDark = mediaQuery.matches;
      }

      setActiveTheme(isDark ? 'dark' : 'light');
      
      if (isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };

    applyTheme();

    // Listen for system preference changes
    const listener = () => {
      if (themeMode === 'system') applyTheme();
    };
    
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [themeMode]);

  // Apply font family to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontFamily);
  }, [fontFamily]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('thoughts_themeMode', themeMode);
    localStorage.setItem('thoughts_compactView', JSON.stringify(isCompact));
    localStorage.setItem('thoughts_voiceTone', voiceTone);
    localStorage.setItem('thoughts_fontFamily', fontFamily);
  }, [themeMode, isCompact, voiceTone, fontFamily]);

  const value = {
    themeMode,
    setThemeMode,
    isDarkMode: activeTheme === 'dark',
    setIsDarkMode: (val) => setThemeMode(val ? 'dark' : 'light'), // Backwards compatibility
    isCompact,
    setIsCompact,
    voiceTone,
    setVoiceTone,
    fontFamily,
    setFontFamily
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
