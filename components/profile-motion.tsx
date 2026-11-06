'use client';

import {useEffect,useRef,useState,type MouseEvent} from 'react';

/** Keeps the final formatted fact in the accessibility tree throughout animation. */
export function CountUp({value,formatted,format}:{value:number;formatted:string;format:(value:number)=>string}) {
  const ref=useRef<HTMLSpanElement>(null);
  const [display,setDisplay]=useState(formatted);
  const formatter=useRef(format);
  formatter.current=format;
  useEffect(()=>{
    const element=ref.current;
    if(!element)return;
    let frame=0;
    const motion=matchMedia('(prefers-reduced-motion: reduce)');
    const finish=()=>{cancelAnimationFrame(frame);setDisplay(formatted);};
    // Keep static final values for reduced motion and older/embedded browsers.
    if(motion.matches||!('IntersectionObserver' in window)){finish();return;}
    let stopped=false;
    const stop=()=>{stopped=true;finish();};
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      if(motion.matches||stopped){finish();return;}
      const start=performance.now();
      const tick=(now:number)=>{if(stopped||motion.matches){finish();return;}const progress=Math.min((now-start)/850,1);setDisplay(formatter.current(value*(1-Math.pow(1-progress,3))));if(progress<1)frame=requestAnimationFrame(tick);else finish();};
      frame=requestAnimationFrame(tick);
    },{threshold:.25});
    observer.observe(element);
    motion.addEventListener('change',stop);
    return()=>{observer.disconnect();cancelAnimationFrame(frame);motion.removeEventListener('change',stop);};
  },[value,formatted]);
  return <span ref={ref}><span className="sr-only">{formatted}</span><span aria-hidden="true">{display}</span></span>;
}

export function useProfileSections(companyId:string,language:string) {
  const [items,setItems]=useState<{id:string;name:string}[]>([]);
  const [active,setActive]=useState('');
  useEffect(()=>{
    const main=document.querySelector('.company-profile-surface .profile-main-column');
    if(!main)return;
    const sections=Array.from(main.querySelectorAll<HTMLElement>(':scope > section[id]'));
    setItems(sections.map(section=>({id:section.id,name:section.querySelector('h2')?.textContent?.trim()||section.id})));
    const update=()=>{
      const passed=sections.filter(section=>section.getBoundingClientRect().top<=140);
      setActive((passed[passed.length-1]||sections[0])?.id||'');
    };
    const spy=new IntersectionObserver(update,{rootMargin:'-100px 0px -60% 0px',threshold:[0,1]});
    sections.forEach(section=>spy.observe(section));
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const reveal=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('profile-revealed');reveal.unobserve(entry.target);}}),{threshold:.04});
    if(!reduced.matches)sections.forEach(section=>{section.classList.add('profile-reveal');reveal.observe(section);});
    const finish=()=>sections.forEach(section=>section.classList.add('profile-revealed'));
    reduced.addEventListener('change',finish);
    window.addEventListener('hashchange',update);
    update();
    return()=>{spy.disconnect();reveal.disconnect();reduced.removeEventListener('change',finish);window.removeEventListener('hashchange',update);sections.forEach(section=>section.classList.remove('profile-reveal','profile-revealed'));};
  },[companyId,language]);
  const navigate=(event:MouseEvent<HTMLAnchorElement>,id:string)=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const section=document.getElementById(id);
    if(!section)return;
    event.preventDefault();
    history.pushState(history.state,'',`#${encodeURIComponent(id)}`);
    section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    section.tabIndex=-1;section.focus({preventScroll:true});setActive(id);
  };
  return {items,active,navigate};
}
