'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';
/** Pointer-only enhancement: no DOM wrappers, no interference with card links. */
export function SurfaceDepth(){const path=usePathname();useEffect(()=>{
 const media=matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
 const selector='.hero-stat-card, [data-depth-card], .profile-hero-avatar';let current:HTMLElement|null=null;let frame=0;
 const reset=()=>{if(current){for(const prop of ['--depth-x','--depth-y','--light-x','--light-y','--shadow-x'])current.style.removeProperty(prop);current.removeAttribute('data-depth-active');current=null;}};
 const move=(event:PointerEvent)=>{if(!media.matches||event.pointerType!=='mouse'){reset();return;}const el=(event.target as Element).closest<HTMLElement>(selector);if(el!==current){reset();current=el;}if(!el)return;const rect=el.getBoundingClientRect();const x=Math.max(0,Math.min(1,(event.clientX-rect.left)/rect.width)),y=Math.max(0,Math.min(1,(event.clientY-rect.top)/rect.height));el.style.setProperty('--depth-x',`${(0.5-y)*8}deg`);el.style.setProperty('--depth-y',`${(x-0.5)*8}deg`);el.style.setProperty('--light-x',`${x*100}%`);el.style.setProperty('--light-y',`${y*100}%`);el.style.setProperty('--shadow-x',`${(0.5-x)*12}px`);el.setAttribute('data-depth-active','');};
 const scroll=()=>{if(frame)return;frame=requestAnimationFrame(()=>{frame=0;const banner=document.querySelector<HTMLElement>('.profile-header-band');if(banner)banner.style.setProperty('--grid-shift',media.matches?`${Math.max(-16,Math.min(16,-banner.getBoundingClientRect().top*.035))}px`:'0px');});};
 const change=()=>{reset();scroll();};document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',reset);window.addEventListener('scroll',scroll,{passive:true});media.addEventListener('change',change);scroll();return()=>{reset();cancelAnimationFrame(frame);document.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',reset);window.removeEventListener('scroll',scroll);media.removeEventListener('change',change);};
 },[path]);return null;}
