import { useState } from 'react';

/**
 * 라이트 / 다크 테마용 훅
 * @returns 
 */
const useTheme = () => {

  const isBrowser = typeof window !== "undefined"
  
  let prefersColorScheme = null;
  let localTheme = null;

  if(isBrowser){
    prefersColorScheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? 'dark'
    : 'light';
    localTheme = localStorage.getItem('theme');
  }

  
  const initialTheme = localTheme || prefersColorScheme;
  const [theme, setTheme] = useState(initialTheme);
  
  //TODO: 타입을 유니언 타입으로 바꾸자
  const setMode = (mode: string) => {
    if(isBrowser){
      localStorage.setItem('theme', mode);
    }
    
    setTheme(mode);
  };
  const themeToggler = () => {
    theme === 'light' ? setMode('dark') : setMode('light');
  };
  return [theme, themeToggler] as const;
};

export default useTheme;