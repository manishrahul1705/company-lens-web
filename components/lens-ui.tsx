'use client';
import {ReactNode} from 'react';
import {Company,Fact,status,text} from '@/lib/lens-data';
import {useLensData} from './lens-provider';
export function SourceButton({company,facts,icon=false}:{company:Company;facts:Fact[];icon?:boolean}){const {openSource}=useLensData();return facts.length ? <button className="source-button" aria-label={`Source for ${text(facts[0].field)||'fact'}`} onClick={()=>openSource(company,facts)}>{icon?'↗':'↗ Source'}</button>:null;}
export function CompareButton({company}:{company:Company}){const {selected,toggle}=useLensData();const active=selected.includes(company.org_number);return <button className={`button ${active?'selected':'secondary'}`} aria-pressed={active} onClick={()=>toggle(company.org_number)}>{active?'✓ Added to Compare':'+ Add to Compare'}</button>;}
export function StatusBadge({company,category}:{company:Company;category:string}){const s=status(company,category);return <span className={`badge ${s==='Found'?'found':s==='Not found'?'absent':'unchecked'}`}>{s}</span>;}
export function Missing(){return <span className="missing">Not found</span>;}
export function Value({value}:{value:unknown}){return text(value)?<>{text(value)}</>:<Missing/>;}
export function Section({title,children,id}:{title:string;children:ReactNode;id?:string}){return <section className="ledger-section" id={id}><h2>{title}</h2>{children}</section>;}
export function DataState(){const {loading,error,retry}=useLensData();return loading?<div className="empty-state" role="status">Loading Company Records…</div>:error?<div className="empty-state" role="alert"><h2>Records Could Not Be Loaded</h2><p>{error}</p><button className="button" onClick={retry}>Try Again</button></div>:null;}
