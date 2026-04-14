import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const THEME_LIGHT = "light";
const THEME_DARK = "dark";

const ThemeContext = createContext(undefined);

const isValidTheme = (value) => value === THEME_LIGHT || value === THEME_DARK;

const resolveInitialTheme = () => {
  if (typeof window === "undefined") {
    return THEME_LIGHT;
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (isValidTheme(storedTheme)) {
    return storedTheme;
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return THEME_DARK;
  }

  return THEME_LIGHT;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(resolveInitialTheme);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const isDark = theme === THEME_DARK;
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === THEME_DARK,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === THEME_DARK ? THEME_LIGHT : THEME_DARK)),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
};
