'use client';

import React, { createContext, useContext, useState } from 'react';

export type ThemeType = 'Light';

interface ThemeContextProps {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

import { useAuth } from './AuthContext';

export const themes: Record<ThemeType, any> = {
  Light: {
    primary: '#2563eb',
    bg: '#ffffff',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>('Light');
  const { user } = useAuth();

  const setTheme = (t: ThemeType) => setThemeState(t);

  React.useEffect(() => {
    if (user?.branding) {
      const b = user.branding;

      // Ensure that color values exist before setting
      if (b.primary_color) {
        document.documentElement.style.setProperty('--color-primary', b.primary_color);
        document.documentElement.style.setProperty('--color-primary-hover', b.primary_color + 'dd');
      }
      if (b.secondary_color) {
        document.documentElement.style.setProperty('--color-secondary', b.secondary_color);
      }
      if (b.accent_color) {
        // Since globe uses the primary color or you might want an accent color
        document.documentElement.style.setProperty('--color-accent', b.accent_color);
      }
      if (b.background_color) {
        document.documentElement.style.setProperty('--color-background', b.background_color);
      }
      if (b.text_color) {
        document.documentElement.style.setProperty('--color-foreground', b.text_color);
      }

      // Update favicon dynamically
      if (b.logo_url) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = b.logo_url;
      }
    } else {
      // Default reset
      document.documentElement.style.setProperty('--color-primary', '#2563eb');
      document.documentElement.style.setProperty('--color-primary-hover', '#1d4ed8');
      document.documentElement.style.setProperty('--color-secondary', '#7c3aed');
      document.documentElement.style.setProperty('--color-background', '#ffffff');
      document.documentElement.style.setProperty('--color-foreground', '#1a1a1a');
      
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (link) {
        link.href = '/favicon.ico'; // Default
      }
    }
  }, [user]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
