import { createContext, useContext } from 'react';

type Theme = 'dark' | 'light';

const ThemeContext = createContext<Theme>('dark');

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export default ThemeContext;
