'use client';
import {useEffect,useState} from 'react';
import {useLensData} from './lens-provider';
type Theme='system'|'light'|'dark';
export function ThemeToggle(){
 const [theme,setTheme]=useState<Theme>('system');const [ready,setReady]=useState(false);const {language}=useLensData();
 useEffect(()=>{try{const saved=localStorage.getItem('ncl-theme');if(saved==='light'||saved==='dark')setTheme(saved);}catch{}setReady(true);},[]);
 useEffect(()=>{if(!ready)return;const media=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const dark=theme==='dark'||theme==='system'&&media.matches;document.documentElement.classList.toggle('dark',dark);document.documentElement.style.colorScheme=dark?'dark':'light';};apply();media.addEventListener('change',apply);return()=>media.removeEventListener('change',apply);},[theme,ready]);
 const labels=language==='no'?{system:'System',light:'Lys',dark:'Mørk'}:{system:'System',light:'Light',dark:'Dark'};
 return <button type="button" className="theme-toggle" title={language==='no'?'Bytt tema: Lys / Mørk / System':'Change theme: Light / Dark / System'} aria-label={`${language==='no'?'Tema':'Theme'}: ${labels[theme]}. ${language==='no'?'Bytt tema':'Change theme'}`} onClick={()=>{const next=theme==='system'?'light':theme==='light'?'dark':'system';setTheme(next);try{localStorage.setItem('ncl-theme',next);}catch{}}}><span className={`theme-glyph theme-${theme}`} aria-hidden="true"><svg className="theme-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></svg><svg className="theme-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/></svg></span><span>{labels[theme]}</span><span className="sr-only" aria-live="polite">{labels[theme]}</span></button>;
}
