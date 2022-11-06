import { useState } from 'react';

const useTheme = () => {
  const prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
            ? 'dark'
            : 'light';

  const localTheme = localStorage.getItem('theme');
  const initialTheme = localTheme || prefersColorScheme;
  const [theme, setTheme] = useState(initialTheme);
  
  //TODO: 타입을 유니언 타입으로 바꾸자
  const setMode = (mode: string) => {
    localStorage.setItem('theme', mode);
    setTheme(mode);
  };
  const themeToggler = () => {
    theme === 'light' ? setMode('dark') : setMode('light');
  };
  return [theme, themeToggler];
};

export default useTheme;