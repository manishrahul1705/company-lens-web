'use client';
import {ReactNode} from 'react';
import {Company,Fact,status,text} from '@/lib/lens-data';
import {useLensData} from './lens-provider';
export function SourceButton({company,facts,icon=false}:{company:Company;facts:Fact[];icon?:boolean}){const {openSource,t}=useLensData();return facts.length ? <button className="source-button" aria-label={`${t('Source for')} ${t(text(facts[0].field)||'fact')}`} onClick={()=>openSource(company,facts)}>{icon?'↗':`↗ ${t('Source')}`}</button>:null;}
export function CompareButton({company}:{company:Company}){const {selected,toggle,t}=useLensData();const active=selected.includes(company.org_number);return <button className={`button ${active?'selected':'secondary'}`} aria-pressed={active} disabled={!active&&selected.length>=3} title={!active&&selected.length>=3?t('Maximum 3 companies'):undefined} onClick={()=>toggle(company.org_number)}>{t(active?'✓ Added to Compare':'+ Add to Compare')}</button>;}
export function StatusBadge({company,category}:{company:Company;category:string}){const {t}=useLensData();const s=status(company,category);return <span className={`badge ${s==='Found'?'found':s==='Not found'?'absent':'unchecked'}`}>{t(s)}</span>;}
export function Missing(){const {t}=useLensData();return <span className="missing">{t('Not found')}</span>;}
export function Value({value}:{value:unknown}){return text(value)?<>{text(value)}</>:<Missing/>;}
export function Section({title,children,id}:{title:string;children:ReactNode;id?:string}){return <section className="ledger-section" id={id}><h2>{title}</h2>{children}</section>;}
export function DataState(){const {loading,error,retry,t}=useLensData();return loading?<div className="empty-state skeleton-state" role="status"><span>{t('Loading Company Records…')}</span><div className="skeleton"/><div className="skeleton"/><div className="skeleton"/></div>:error?<div className="empty-state" role="alert"><h2>{t('Records Could Not Be Loaded')}</h2><p>{t(error)}</p><button className="button" onClick={retry}>{t('Try Again')}</button></div>:null;}
