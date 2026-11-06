'use client';
import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import compare from './company-comparison.module.css';

type Card={element:HTMLElement;max:number;rect:DOMRect|null;original:string;transition:string};
const cards = '.hero-stat-card,.lens-company-card,.profile-summary-grid>div,.profile-key-figure,.profile-hero-avatar';
const flat='perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
const clamp=(n:number)=>Math.max(-1,Math.min(1,n));
export function SurfaceDepth(){
 const router=useRouter();
 useEffect(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fine=matchMedia('(hover: hover) and (pointer: fine)');
  const registry=new Map<HTMLElement,Card>();
  const seen=new WeakSet<Element>();
  const animations=new Set<Animation>();
  const elementAnimations=new Map<HTMLElement,Animation>();
  let active:Card|undefined,band:HTMLElement|null=null,bandRect:DOMRect|null=null;
  let x=0,y=0,frame=0,scanFrame=0,disposed=false;
  let recede:Animation|undefined;
  const enabled=()=>!reduced.matches&&fine.matches;
  const play=(element:HTMLElement,keyframes:Keyframe[],duration=550,delay=0)=>{
   if(!enabled()||!element.animate)return;
   const animation=element.animate(keyframes,{duration,delay,easing:'ease-out',fill:'backwards'});
   animations.add(animation);elementAnimations.set(element,animation);
   const finish=()=>{animations.delete(animation);if(elementAnimations.get(element)===animation)elementAnimations.delete(element);};
   animation.onfinish=finish;animation.oncancel=finish;
   return animation;
  };
  const restore=(card:Card)=>{
   delete card.element.dataset.motionActive;
   card.element.style.transform=card.original;
   card.element.style.transition=card.transition;
   card.element.style.removeProperty('--mx');card.element.style.removeProperty('--my');
  };
  const resetBand=()=>{
   if(band){band.style.setProperty('--parallax-x','0px');band.style.setProperty('--parallax-y','0px');}
   band=null;bandRect=null;
  };
  const leave=()=>{
   if(active){const card=active;active=undefined;delete card.element.dataset.motionActive;
    card.element.style.transition='transform 300ms ease-out';
    card.element.style.transform=card.original;
    card.element.style.setProperty('--mx','0px');card.element.style.setProperty('--my','0px');
   }
  };
  const observer:IntersectionObserver|null=window.IntersectionObserver?new IntersectionObserver(entries=>{
   for(const entry of entries){if(!entry.isIntersecting)continue;
    const el=entry.target as HTMLElement;observer?.unobserve(el);
    if(seen.has(el))continue;seen.add(el);
    const type=el.dataset.motionEntrance;
    const index=+(el.dataset.motionIndex||0);
    let from='perspective(900px) rotateX(10deg) translateY(16px)';
    const to=el.classList.contains(compare.vs)?getComputedStyle(el).transform:flat;let duration=550,delay=(index%6)*60;
    if(type==='hero'){from='perspective(900px) rotateX(-25deg) translateY(20px)';delay=index%4*80;}
    if(type==='list')from='perspective(900px) translateZ(-60px) rotateX(12deg)';
    if(type==='compare'){from=`perspective(900px) translateX(${index%2?24:-24}px) rotateY(${index%2?-25:25}deg)`;delay=index*80;}
    if(type==='vs'){from=`${to==='none'?'':to} perspective(900px) rotateY(-360deg) scale(.8)`;duration=650;}
    if(type==='winner'){from='perspective(900px) scale(1) translateZ(0px)';play(el,[{transform:from,opacity:0},{transform:'perspective(900px) scale(1.08) translateZ(12px)',opacity:1,offset:.65},{transform:to,opacity:1}],400);continue;}
    if(type==='word'){from='perspective(900px) translateY(12px) rotateX(40deg)';delay=index*45;}
    play(el,[{transform:from,opacity:0},{transform:to,opacity:1}],duration,delay);
   }
  },{threshold:.08}):null;
  const observe=(el:HTMLElement,type:string,index:number)=>{
   if(seen.has(el)||!enabled())return;
   el.dataset.motionEntrance=type;el.dataset.motionIndex=String(index);
   observer?.observe(el);
  };
  const scan=()=>{
   scanFrame=0;if(disposed)return;
   for(const [el,card] of registry)if(!el.isConnected){restore(card);registry.delete(el);}
   document.querySelectorAll<HTMLElement>(cards).forEach((el,index)=>{
    let kind='metric',max=5;
    if(el.matches('.hero-stat-card')){kind='hero';max=8;}
    else if(el.matches('.lens-company-card')){kind='list';max=6;}
    else if(el.matches('.profile-hero-avatar')){kind='avatar';max=10;}
    if(!registry.has(el)){registry.set(el,{element:el,max,rect:null,original:el.style.transform,transition:el.style.transition});el.dataset.motionCard=kind;}
    if(kind!=='avatar')observe(el,kind,index);
   });
   const groups:[string,string][]=[
    ['.profile-main-column>section>h2,.profile-main-column>section>div','section'],
    [`.${compare.heroCard}`,'compare'],[`.${compare.vs}`,'vs'],[`.${compare.winner}`,'winner'],
    [`.${compare.group}>h2`,'section'],['[data-motion-word]','word']
   ];
   groups.forEach(([selector,type])=>document.querySelectorAll<HTMLElement>(selector).forEach((el,i)=>observe(el,type,i)));
   document.querySelectorAll<HTMLElement>('.page-transition').forEach(el=>{
    if(!seen.has(el)&&enabled()){seen.add(el);play(el,[{transform:'perspective(1200px) rotateX(-4deg)',opacity:0},{transform:'none',opacity:1}],230);}
   });
   syncDrawer();
  };
  const scheduleScan=()=>{if(!disposed&&!scanFrame)scanFrame=requestAnimationFrame(scan);};
  const update=()=>{
   frame=0;if(!enabled())return;
   if(active?.rect){const {element,rect,max}=active;
    const nx=clamp((x-rect.left)/rect.width*2-1),ny=clamp((y-rect.top)/rect.height*2-1);
    element.style.transform=`perspective(900px) rotateX(${-ny*max}deg) rotateY(${nx*max}deg)`;
    element.style.setProperty('--mx',`${nx*45}px`);element.style.setProperty('--my',`${ny*45}px`);
   }
   if(band&&bandRect){const max=band.matches('.ledger-first-screen')?12:10;
    const nx=clamp((x-bandRect.left)/bandRect.width*2-1),ny=clamp((y-bandRect.top)/bandRect.height*2-1);
    band.style.setProperty('--parallax-x',`${nx*max}px`);band.style.setProperty('--parallax-y',`${ny*max}px`);
   }
  };
  const move=(event:PointerEvent)=>{
   if(!enabled()||event.pointerType==='touch')return;
   x=event.clientX;y=event.clientY;
   if((active||band)&&!frame)frame=requestAnimationFrame(update);
  };
  const over=(event:PointerEvent)=>{
   if(!enabled()||event.pointerType==='touch'||!(event.target instanceof Element))return;
   const element=event.target.closest<HTMLElement>(cards);
   if(element!==active?.element){leave();const card=element?registry.get(element):undefined;
    if(card){elementAnimations.get(card.element)?.cancel();card.rect=card.element.getBoundingClientRect();card.element.style.transition='transform 90ms ease-out';card.element.dataset.motionActive='true';active=card;}
   }
   const next=event.target.closest<HTMLElement>('.ledger-first-screen,.profile-header-band');
   if(next!==band){resetBand();band=next;if(band)bandRect=band.getBoundingClientRect();}
   move(event);
  };
  const out=(event:PointerEvent)=>{
   const t=event.relatedTarget;
   if(active&&(!(t instanceof Node)||!active.element.contains(t)))leave();
   if(band&&(!(t instanceof Node)||!band.contains(t)))resetBand();
  };
  const tap=(event:PointerEvent)=>{
   if(reduced.matches||fine.matches||!(event.target instanceof Element))return;
   const el=event.target.closest<HTMLElement>(cards+',button,.button');
   if(!el?.animate)return;
   const animation=el.animate([{transform:'scale(1)'},{transform:'scale(.98)'},{transform:'scale(1)'}],180);
   animations.add(animation);animation.onfinish=()=>animations.delete(animation);
  };
  const click=(event:MouseEvent)=>{
   if(!enabled()||event.defaultPrevented||!(event.target instanceof Element))return;
   const link=event.target.closest<HTMLAnchorElement>('a[href]');
   if(link&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&event.button===0&&!link.target&&!link.hasAttribute('download')){
    const url=new URL(link.href,location.href);
    if(url.origin===location.origin&&(url.pathname!==location.pathname||url.search!==location.search)){
     const page=document.querySelector<HTMLElement>('.page-transition');
     if(page){event.preventDefault();event.stopPropagation();const exit=play(page,[{transform:'none',opacity:1},{transform:'perspective(1200px) rotateX(4deg)',opacity:0}],220);if(exit){exit.finished.then(()=>{if(!disposed)router.push(url.pathname+url.search+url.hash);},()=>{if(!disposed)router.push(url.pathname+url.search+url.hash);});return;}}
    }
   }
   const glyph=event.target.closest('.theme-toggle')?.querySelector<HTMLElement>('.theme-glyph');
   if(glyph)play(glyph,[{transform:'perspective(900px) rotateY(0deg)'},{transform:'perspective(900px) rotateY(180deg)'}],400);
  };
  function syncDrawer(){
   const drawer=document.querySelector<HTMLElement>('.source-dialog[open]');
   const page=document.querySelector<HTMLElement>('#main-content .page-transition');
   if(!drawer){recede?.cancel();recede=undefined;return;}
   if(!enabled()||drawer.dataset.motionOpen==='true')return;
   drawer.dataset.motionOpen='true';
   if(page){recede=play(page,[{transform:'scale(1)'},{transform:'scale(.98)'}],250);if(recede)recede.effect?.updateTiming({fill:'forwards'});}
  }
  const mutations=new MutationObserver(records=>{
   let changed=false;
   for(const record of records){
    if(record.type==='childList'){if([...record.addedNodes,...record.removedNodes].some(n=>n.nodeType===1))changed=true;continue;}
    const el=record.target as HTMLElement;
    if(record.attributeName==='open'){
     if(!el.hasAttribute('open'))delete el.dataset.motionOpen;
     syncDrawer();
    }
    if(record.attributeName==='aria-pressed'&&el.matches('.card-compare-action')&&el.getAttribute('aria-pressed')==='true'){
     const card=el.closest<HTMLElement>('.lens-company-card');
     if(card){if(active?.element===card)leave();play(card,[{transform:flat},{transform:'perspective(900px) rotateY(8deg)'},{transform:flat}],400);}
    }
   }
   if(changed)scheduleScan();
  });
  const reset=()=>{
   cancelAnimationFrame(frame);frame=0;leave();resetBand();observer?.disconnect();
   recede?.cancel();animations.forEach(animation=>animation.cancel());animations.clear();recede=undefined;
   registry.forEach(restore);
   document.querySelectorAll<HTMLElement>('[data-motion-open]').forEach(el=>delete el.dataset.motionOpen);
   document.documentElement.dataset.motionEnabled=enabled()?'true':'false';
   if(enabled())scheduleScan();
  };
  const invalidate=()=>{leave();resetBand();};
  document.documentElement.dataset.motionEnabled=enabled()?'true':'false';
  scan();mutations.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','aria-pressed']});
  document.addEventListener('pointerover',over,{passive:true});document.addEventListener('pointerout',out,{passive:true});
  document.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerdown',tap,{passive:true});
  document.addEventListener('click',click,true);
  window.addEventListener('scroll',invalidate,{passive:true,capture:true});window.addEventListener('resize',invalidate,{passive:true});
  reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
  return()=>{
   disposed=true;reset();cancelAnimationFrame(scanFrame);mutations.disconnect();observer?.disconnect();
   document.removeEventListener('pointerover',over);document.removeEventListener('pointerout',out);document.removeEventListener('pointermove',move);document.removeEventListener('pointerdown',tap);document.removeEventListener('click',click,true);
   window.removeEventListener('scroll',invalidate,true);window.removeEventListener('resize',invalidate);
   reduced.removeEventListener('change',reset);fine.removeEventListener('change',reset);
   registry.forEach(card=>{restore(card);delete card.element.dataset.motionCard;});
   delete document.documentElement.dataset.motionEnabled;
  };
 },[router]);
 return null;
}

