'use client';

import Link from 'next/link';
import {useEffect,useRef,useState, type CSSProperties, type ReactNode} from 'react';
import {ArrowIcon} from '@/components/arrow-icon';
import {ExportActions} from '@/components/export-actions';
import {
  type Company, type Fact, companyHref, date, evidence, financialFact, found, jobs,
  locations, money, number, percent, safeUrl, text, title,
} from '@/lib/lens-data';
import { useLensData } from '@/components/lens-provider';
import { DataState, Missing, StatusBadge } from '@/components/lens-ui';
import styles from './company-comparison.module.css';

type Row = { field: string; label: string; category: string; metric?: string }; 
const rows: Row[] = [
  { field: 'legal_form', label: 'Legal Form', category: 'identity' },
  { field: 'municipality', label: 'Municipality', category: 'identity' },
  { field: 'industry_text', label: 'Industry', category: 'identity' },
  { field: 'founded', label: 'Founded', category: 'identity' },
  { field: 'employees', label: 'Employees', category: 'identity' },
  { field: 'locations_count', label: 'Registered workplaces', category: 'locations' },
  { field: 'latest_revenue', label: 'Revenue', category: 'financials', metric: 'revenue' },
  { field: 'operating_result', label: 'Operating result', category: 'financials', metric: 'operating_result' },
  { field: 'latest_profit', label: 'Annual Result', category: 'financials', metric: 'annual_result' },
  { field: 'revenue_growth', label: 'Revenue Change', category: 'financials' },
  { field: 'ceo', label: 'CEO', category: 'people' },
  { field: 'board_chair', label: 'Board chair', category: 'people' },
  { field: 'website', label: 'Website', category: 'website' },
  { field: 'social', label: 'Social', category: 'social' },
  { field: 'jobs_count', label: 'Jobs', category: 'jobs' },
  { field: 'news', label: 'News', category: 'news' },
];

function ComparisonValue({ company, facts, row, scale }: { company: Company; facts: Fact[]; row: Row; scale?: {min:number;max:number} }) {
  if (!found(company, row.category)) return <StatusBadge company={company} category={row.category} />;
  const metricFact = row.metric ? financialFact(company, facts, row.metric, company.latest_year) : undefined;
  const raw = row.metric ? metricFact?.amount ?? (row.field==='operating_result' ? undefined : company[row.field]) : company[row.field] ?? evidence(company,facts,row.field)[0]?.value;
  let value: ReactNode = <Missing />;
  let hasValue = false;
  let sources: Fact[] = [];

  if (row.field === 'locations_count' || row.field === 'jobs_count') {
    const entries = row.field === 'locations_count' ? locations(company, facts) : jobs(company, facts);
    // Counts describe the same actual entries as the profile, never an unchecked stored total.
    value = entries.length.toLocaleString('en-US');
    hasValue = true;
    // Show all contributing records so the derived count can be inspected.
    sources = row.field === 'locations_count' ? locations(company, facts).flatMap(place => place.fact ? [place.fact] : evidence(company, facts, 'address')) : jobs(company, facts);
  } else if (row.metric) {
    hasValue = number(raw) !== null;
    if (hasValue) value = compactMoney(number(raw)!, company.currency);
  } else if (row.field === 'revenue_growth') {
    hasValue = number(raw) !== null;
    if (hasValue) value = percent(raw);
  } else if (row.field === 'employees') {
    const count = number(raw);
    hasValue = count !== null && count >= 0;
    if (hasValue) value = count!.toLocaleString('en-US');
  } else if (row.field === 'website') {
    const url = safeUrl(raw);
    hasValue = !!url;
    if (url) value = <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', textUnderlineOffset: 3 }}>{text(raw)}</a>;
  } else if (row.field === 'social' || row.field === 'news') {
    sources = facts.filter(f=>f.org_number===company.org_number && f.category===row.category && text(f.value));
    hasValue = sources.length>0;
    if(hasValue) value = <span className={styles.links}>{sources.map((f,i)=>safeUrl(f.source_url)?<a key={i} href={safeUrl(f.source_url)} target="_blank" rel="noopener noreferrer">{text(f.value)}</a>:<span key={i}>{text(f.value)}</span>)}</span>;
  } else if (row.field === 'industry_text') {
    const description = text(company.industry_text_en) || text(raw);
    const code = text(company.industry_code);
    hasValue = !!(description || code);
    if (hasValue) value = <>{description || code}{text(company.industry_text_en) && text(raw) && <small className="muted" lang="nb" style={{display:'block'}}>{text(raw)}</small>}{description && code ? <span className="muted" style={{ display: 'block', fontSize: 11 }}>{code}</span> : null}</>;
  } else {
    hasValue = !!text(raw);
    if (hasValue) value = row.field === 'founded' ? date(raw) : row.field === 'municipality' || row.field === 'ceo' ? title(raw) : text(raw);
  }

  if (hasValue && row.field !== 'locations_count' && row.field !== 'jobs_count') {
    if(row.metric) sources = metricFact ? [metricFact] : [];
    else if(row.field!=='social' && row.field!=='news') sources = evidence(company, facts, row.field).filter(f => f.category === row.category);
    // Financial evidence must agree with the headline it purports to substantiate.
    if (row.field === 'latest_revenue' || row.field === 'latest_profit') {
      sources = sources.filter(f => number(f.amount) === number(raw));
    }
  }

  const amount = number(raw);
  const numeric = row.category==='financials' && amount!==null;
  return <div className={styles.valueBlock}><div className={styles.valueLine}>
    <span className={numeric?styles.numeric:styles.value} title={numeric ? (row.metric?money(raw,company.latest_year,company.currency):percent(raw)) : undefined}>{value}</span>
    <DocumentSource company={company} facts={sources}/>
  </div>{numeric && scale && <FinancialBar value={amount!} scale={scale}/>}</div>;
}

function compactMoney(n:number,currency:unknown){const abs=Math.abs(n);const unit=abs>=1e9?1e9:abs>=1e6?1e6:abs>=1e3?1e3:1;return `${text(currency)||'NOK'} ${new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(n/unit)}${unit===1e9?' bn':unit===1e6?' m':unit===1e3?' K':''}`;}
function DocumentSource({company,facts}:{company:Company;facts:Fact[]}){const {openSource,t}=useLensData();return facts.length?<button className={styles.source} aria-label={`${t('Source for')} ${text(facts[0].metric)||text(facts[0].field)||'fact'}`} onClick={()=>openSource(company,facts)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6"/></svg></button>:null;}
function FinancialBar({value,scale}:{value:number;scale:{min:number;max:number}}){const span=scale.max-scale.min||1;const zero=-scale.min/span*100;const start=(Math.min(value,0)-scale.min)/span*100;return <svg className={styles.bar} viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true"><rect width="100" height="8" rx="2" fill="var(--border)"/><rect x={start} width={Math.abs(value)/span*100} height="8" rx="2" fill={value<0?'#b57777':'var(--primary)'}/><line x1={Math.min(99.7,Math.max(.3,zero))} x2={Math.min(99.7,Math.max(.3,zero))} y1="0" y2="8" stroke="var(--foreground)" strokeWidth=".5"/></svg>;}
function rowNumber(c:Company,facts:Fact[],row:Row){return row.metric?number(financialFact(c,facts,row.metric,c.latest_year)?.amount)??number(row.field==='operating_result'?undefined:c[row.field]):number(c[row.field]);}

export default function CompanyComparison() {
  const { companies, facts, loading, error, selected, toggle, openSearch,t,language } = useLensData();
  const [onlyDifferences,setOnlyDifferences]=useState(false);
  const [activeOrg,setActiveOrg]=useState('');
  const [backHref,setBackHref]=useState('/');
  useEffect(()=>{try{const saved=sessionStorage.getItem('ncl-search-url');if(saved && (saved==='/' || saved.startsWith('/?')))setBackHref(saved);}catch{}},[]);
  const tabs=useRef<HTMLDivElement>(null);
  useEffect(()=>{const button=tabs.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');button?.scrollIntoView({block:'nearest',inline:'nearest'});},[activeOrg]);
  const touch=useRef<{x:number;y:number}|null>(null);
  // Resolve against current records so stale persisted selections never create invented columns.
  const chosen = [...new Set(selected)].slice(0,3).flatMap(org => {
    const company = companies.find(c => c.org_number === org);
    return company ? [company] : [];
  });
  const scales = Object.fromEntries(rows.filter(r=>r.category==='financials').map(row=>{const values=chosen.flatMap(c=>{const n=rowNumber(c,facts,row);return n===null?[]:[n];});return [row.field,{min:Math.min(0,...values),max:Math.max(0,...values)}];}));
  const active=chosen.some(c=>c.org_number===activeOrg)?activeOrg:chosen[0]?.org_number;
  const shareUrl='/compare?orgs='+chosen.map(c=>c.org_number).join(',');
  const differs=(row:Row)=>new Set(chosen.map(c=>{if(!found(c,row.category))return text(c.sections[row.category]);if(row.field==='locations_count')return String(locations(c,facts).length);if(row.field==='jobs_count')return String(jobs(c,facts).length);if(row.category==='financials')return [rowNumber(c,facts,row),text(c.latest_year),text(c.currency)].join('|');if(row.field==='social'||row.field==='news')return facts.filter(f=>f.org_number===c.org_number&&f.category===row.category).map(f=>text(f.value)).join('|');return text(c[row.field]);})).size>1;
  const visibleRows = onlyDifferences ? rows.filter(differs) : rows;
  // Parent stylesheet switches this shared desktop track definition to labelled mobile values.
  const columns = { '--compare-columns': `200px repeat(${Math.max(chosen.length, 1)}, minmax(0, 1fr))` } as CSSProperties;

  return <div className={styles.page} style={columns}>
    <Link className="back-link" href={backHref}><ArrowIcon direction="left"/> {t('Company Search')}</Link>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 10 }}>{t('Side by Side')}</p>
        <h1 style={{ marginBottom: 8 }}>{t('Compare Companies')}</h1>
        <p className="muted" style={{ marginBottom: 0 }}>{t('The same fields. A clearer perspective.')}</p>
      </div>
    </div>

    <div className="compare-toolbar" role="group" aria-label={language==='no'?'Sammenligningsverktøy':'Comparison tools'}>
      <button className="button secondary" disabled={loading||chosen.length>=3} onClick={openSearch}>+ {language==='no'?'Legg til selskap':'Add company'}</button>
      <label className="check-filter"><input type="checkbox" disabled={loading||!chosen.length} checked={onlyDifferences} onChange={e=>setOnlyDifferences(e.target.checked)}/>{language==='no' ? 'Vis bare forskjeller' : 'Show only differences'}</label>
      {!loading&&!error&&chosen.length>0&&<><span className="muted compare-field-count" aria-live="polite">{visibleRows.length} {language==='no' ? 'felt' : 'fields'}</span><details className="compare-utilities"><summary>{language==='no'?'Eksport og deling':'Exports & sharing'}</summary><div className="compare-utilities-content"><ExportActions companies={chosen} facts={facts} shareUrl={shareUrl}/></div></details></>}
    </div>
    {loading || error ? <DataState /> : <>
      {chosen.length>0&&<><div ref={tabs} className={styles.tabs} role="group" aria-label={t('Compare Companies')}>{chosen.map(c=><button key={c.org_number} className={`button ${active===c.org_number?'selected':'secondary'}`} style={{minHeight:44,overflowWrap:'anywhere'}} aria-pressed={active===c.org_number} onClick={()=>setActiveOrg(c.org_number)}>{title(c.legal_name)||c.org_number}</button>)}</div><p id="compare-scale-note" className="muted compare-scale-note">{language==='no' ? 'Finansielle diagrammer: felles skala per måltall på tvers av selskapene. Streken viser null; negative beløp går mot venstre.' : 'Financial charts: shared scale per metric across companies. The line marks zero; negative values extend left.'}</p></>}
      
      {chosen.length < 2 && <section className="empty-state" style={{ padding: '24px 20px', marginBottom: 24 }} aria-labelledby="compare-guidance">
        <h2 id="compare-guidance" style={{ fontSize: 20, marginBottom: 8 }}>{t(chosen.length ? 'Choose One More Company' : 'Choose Companies to Compare')}</h2>
        <p style={{ marginBottom: 16 }}>{t('Add at least two companies to see their details side by side.')}</p>
        <button className="button" onClick={openSearch}>{t('Find a Company')}</button>
      </section>}
      {chosen.length > 0 && <div className={styles.tables} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchCancel={()=>{touch.current=null;}} onTouchEnd={e=>{if(!touch.current||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){const index=chosen.findIndex(c=>c.org_number===active);setActiveOrg(chosen[Math.max(0,Math.min(chosen.length-1,index+(dx<0?1:-1)))].org_number);}}} aria-label={t('Company Comparison')} aria-describedby="compare-scale-note">
        <div className={`${styles.row} ${styles.header}`}>  
          <div className={styles.label}>{t('Company Details')}</div>
          {chosen.map(company => <div className={`${styles.company} ${active===company.org_number?styles.active:''}`} key={company.org_number}>
            <span className={styles.avatar} aria-hidden="true">{text(company.legal_name).slice(0,1)}</span><Link href={companyHref(company)} className={styles.companyLink}>{title(company.legal_name) || company.org_number}</Link>
            <span className="muted" style={{ display: 'block', fontSize: 11 }}>Org. {company.org_number}</span>
            <button className={styles.remove} aria-label={`${t('Remove')} ${title(company.legal_name) || company.org_number}`} onClick={() => toggle(company.org_number)}>{t('Remove')} ×</button>
          </div>)}
        </div>
        {([{name:'Identity',categories:['identity','locations']},{name:'Financials',categories:['financials']},{name:'People',categories:['people']},{name:'Online presence',categories:['website','social','jobs','news']}] as const).map(group=>{const groupRows=visibleRows.filter(r=>(group.categories as readonly string[]).includes(r.category));return groupRows.length>0&&<section className={styles.group} key={group.name}><h2>{t(group.name)}{group.name==='Financials'&&<small>{[...new Set(chosen.map(c=>text(c.latest_year)).filter(Boolean))].join(' / ')}</small>}</h2><div role="table" aria-label={t(group.name)}>{groupRows.map(row=><div className={styles.row} role="row" key={row.field}><div className={styles.label} role="rowheader">{t(row.label)}{differs(row)&&<span className={styles.different} title={language==='no'?'Ulike':'Different'}><span className="sr-only">{language==='no'?'Ulike':'Different'}</span></span>}</div>{chosen.map(company=><div className={`${styles.cell} ${active===company.org_number?styles.active:''}`} role="cell" key={company.org_number}><span className={styles.mobileName}>{title(company.legal_name)}</span><ComparisonValue company={company} facts={facts} row={row} scale={scales[row.field]}/></div>)}</div>)}</div></section>;})}
      </div>}
      {chosen.length > 1 && onlyDifferences && visibleRows.length === 0 && <p className="empty-state" role="status">{language==='no' ? 'Ingen forskjeller i de sammenlignede feltene.' : 'No differences in the compared fields.'}</p>}
    </>}
  </div>;
}
