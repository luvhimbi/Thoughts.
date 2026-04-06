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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('thoughts_darkMode');
    return saved ? JSON.parse(saved) : false;
  });

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

  // Apply dark mode theme to document body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [isDarkMode]);

  // Apply font family to document body
  useEffect(() => {
    document.documentElement.setAttribute('data-font', fontFamily);
  }, [fontFamily]);

  // Persist settings
  useEffect(() => {
    localStorage.setItem('thoughts_darkMode', JSON.stringify(isDarkMode));
    localStorage.setItem('thoughts_compactView', JSON.stringify(isCompact));
    localStorage.setItem('thoughts_voiceTone', voiceTone);
    localStorage.setItem('thoughts_fontFamily', fontFamily);
  }, [isDarkMode, isCompact, voiceTone, fontFamily]);

  const value = {
    isDarkMode,
    setIsDarkMode,
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
