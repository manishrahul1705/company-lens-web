'use client';
import {useEffect,useRef,useState} from 'react';
import {Company,Fact,text,companyHref} from '@/lib/lens-data';
import {useLensData} from './lens-provider';
export function CopyLink({url}:{url:string}){
  const [state,setState]=useState(''),[fallback,setFallback]=useState(''),[ready,setReady]=useState(false);
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const manualInput=useRef<HTMLInputElement>(null);
  const {language}=useLensData();
  useEffect(()=>{setReady(true);return()=>{if(timer.current)clearTimeout(timer.current);};},[]);
  useEffect(()=>{if(fallback){manualInput.current?.focus();manualInput.current?.select();}},[fallback]);
  const copy=async()=>{
    const full=new URL(url||window.location.href,window.location.href).href;
    if(timer.current)clearTimeout(timer.current);
    setState('');
    let copied=false;
    try{await navigator.clipboard.writeText(full);copied=true;}catch{
      const input=document.createElement('input');
      const focused=document.activeElement;
      input.value=full;
      input.readOnly=true;
      input.style.cssText='position:fixed;left:-9999px;top:0;opacity:0;';
      document.body.appendChild(input);
      try{input.focus();input.select();input.setSelectionRange(0,full.length);copied=document.execCommand('copy');}catch{copied=false;}finally{input.remove();if(focused instanceof HTMLElement)focused.focus({preventScroll:true});}
    }
    if(copied){setFallback('');setState(language==='no'?'Lenke kopiert':'Link copied');timer.current=setTimeout(()=>setState(''),2200);}
    else{setFallback(full);manualInput.current?.focus();manualInput.current?.select();}
  };
  return <span className="copy-action"><button className="button secondary" disabled={!ready} aria-busy={!ready} onClick={copy}>{!ready?(language==='no'?'Laster…':'Loading…'):(language==='no'?'Kopier lenke':'Copy link')}</button>{state&&<span role="status" className="link-toast">{state}</span>}{fallback&&<span className="copy-result" role="status">{language==='no'?'Kunne ikke kopiere. Kopier denne lenken:':'Could not copy. Copy this link:'} <input ref={manualInput} aria-label={language==='no'?'Lenke til kopiering':'Link to copy'} value={fallback} readOnly onFocus={e=>e.target.select()}/></span>}</span>;
}
export function ExportActions({companies,facts,shareUrl}:{companies:Company[];facts:Fact[];shareUrl?:string}){const {t}=useLensData();const [error,setError]=useState('');const url=shareUrl||(companies.length===1?companyHref(companies[0]):'/compare?orgs='+companies.map(c=>c.org_number).join(','));const download=(format:'csv'|'json')=>{try{const records=companies.map(c=>({company:c,facts:facts.filter(f=>f.org_number===c.org_number)}));const quote=(v:unknown)=>{let s=text(v);if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};const fields=['org_number','category','field','value','metric','year','amount','source_name','source_url','retrieved_at','reporting_period','excerpt'];const body=format==='json'?JSON.stringify(records,null,2):'\uFEFF'+fields.join(',')+'\r\n'+records.flatMap(r=>r.facts.map(f=>fields.map(k=>quote(f[k])).join(','))).join('\r\n');const object=URL.createObjectURL(new Blob([body],{type:format==='json'?'application/json':'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=object;a.download='nordic-company-lens.'+format;a.click();setTimeout(()=>URL.revokeObjectURL(object),1000);setError('');}catch{setError('Download unavailable. Please try again.');}};return <div className="export-actions"><CopyLink url={url}/><button className="button secondary" disabled={!companies.length} onClick={()=>download('csv')}>{t('Export CSV')}</button><button className="button secondary" disabled={!companies.length} onClick={()=>download('json')}>{t('Export JSON')}</button>{error&&<span role="alert">{t(error)}</span>}</div>;}
