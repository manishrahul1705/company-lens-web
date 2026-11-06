'use client';

import Link from 'next/link';
import {useRef,useState, type CSSProperties, type ReactNode} from 'react';
import {ExportActions} from '@/components/export-actions';
import {
  type Company, type Fact, companyHref, date, evidence, financialFact, found, jobs,
  locations, money, number, percent, safeUrl, text, title,
} from '@/lib/lens-data';
import { useLensData } from '@/components/lens-provider';
import { DataState, Missing, SourceButton, StatusBadge } from '@/components/lens-ui';

type Row = { field: string; label: string; category: string };
const rows: Row[] = [
  { field: 'legal_form', label: 'Legal Form', category: 'identity' },
  { field: 'municipality', label: 'Municipality', category: 'identity' },
  { field: 'industry_text', label: 'Industry', category: 'identity' },
  { field: 'founded', label: 'Founded', category: 'identity' },
  { field: 'employees', label: 'Employees', category: 'identity' },
  { field: 'latest_revenue', label: 'Latest Revenue', category: 'financials' },
  { field: 'latest_profit', label: 'Annual Result', category: 'financials' },
  { field: 'revenue_growth', label: 'Revenue Change', category: 'financials' },
  { field: 'ceo', label: 'CEO', category: 'people' },
  { field: 'locations_count', label: 'Locations', category: 'locations' },
  { field: 'jobs_count', label: 'Jobs', category: 'jobs' },
  { field: 'website', label: 'Website', category: 'website' },
];

function ComparisonValue({ company, facts, row }: { company: Company; facts: Fact[]; row: Row }) {
  if (!found(company, row.category)) return <StatusBadge company={company} category={row.category} />;
  const raw = company[row.field];
  let value: ReactNode = <Missing />;
  let hasValue = false;
  let sources: Fact[] = [];

  if (row.field === 'locations_count' || row.field === 'jobs_count') {
    const entries = row.field === 'locations_count' ? locations(company, facts) : jobs(company, facts);
    // Counts describe the same actual entries as the profile, never an unchecked stored total.
    value = entries.length;
    hasValue = true;
    // Show all contributing records so the derived count can be inspected.
    sources = row.field === 'locations_count' ? locations(company, facts).flatMap(place => place.fact ? [place.fact] : evidence(company, facts, 'address')) : jobs(company, facts);
  } else if (row.field === 'latest_revenue' || row.field === 'latest_profit') {
    hasValue = number(raw) !== null;
    if (hasValue) value = money(raw, company.latest_year, company.currency);
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
  } else if (row.field === 'industry_text') {
    const description = text(raw);
    const code = text(company.industry_code);
    hasValue = !!(description || code);
    if (hasValue) value = <>{description || code}{description && code ? <span className="muted" style={{ display: 'block', fontSize: 11 }}>{code}</span> : null}</>;
  } else {
    hasValue = !!text(raw);
    if (hasValue) value = row.field === 'founded' ? date(raw) : row.field === 'municipality' || row.field === 'ceo' ? title(raw) : text(raw);
  }

  if (hasValue && row.field !== 'locations_count' && row.field !== 'jobs_count') {
    sources = evidence(company, facts, row.field).filter(f => f.category === row.category);
    // Financial evidence must agree with the headline it purports to substantiate.
    if (row.field === 'latest_revenue' || row.field === 'latest_profit') {
      sources = sources.filter(f => number(f.amount) === number(raw));
    }
  }

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4, minWidth: 0 }}>
    <span style={{ minWidth: 0, overflowWrap: 'anywhere', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    <SourceButton company={company} facts={sources} icon />
  </div>;
}

function MiniFinancials({company, facts}: {company: Company; facts: Fact[]}) {
  const {language, t} = useLensData();
  const no = language === 'no';
  const entries = (['revenue','annual_result'] as const).map(metric => ({metric, fact:financialFact(company, facts, metric, company.latest_year)}));
  const scale = Math.max(1,...entries.map(entry => Math.abs(number(entry.fact?.amount) ?? 0)));
  return <figure className="compare-mini-chart" style={{margin:'12px 0 0',minWidth:0}}>
    <figcaption className="muted" style={{fontSize:11,marginBottom:8}}>{no ? 'Finansielt øyeblikksbilde' : 'Financial snapshot'}{text(company.latest_year) ? ` · ${text(company.latest_year)}` : ''}</figcaption>
    {!found(company, 'financials') ? <StatusBadge company={company} category="financials"/> : entries.map(({metric,fact}) => <div key={metric} style={{marginBottom:8}}>
      <div style={{fontSize:11,overflowWrap:'anywhere'}}>{t(metric === 'revenue' ? 'Revenue' : 'Annual Result')}</div>
      <div style={{fontSize:11,overflowWrap:'anywhere',fontVariantNumeric:'tabular-nums'}}>{fact ? money(fact.amount, undefined, company.currency) : <Missing/>}{fact && <SourceButton company={company} facts={[fact]} icon/>}</div>
      {fact && <div aria-hidden="true" style={{height:5,background:'var(--rule, #dde5e0)',borderRadius:2,marginTop:4}}><div style={{width:`${Math.abs(number(fact.amount) ?? 0)/scale*100}%`,height:5,background:'var(--primary)',opacity:metric === 'revenue' ? 1 : .55,borderRadius:2}}/></div>}
    </div>)}
    {entries.some(entry => (number(entry.fact?.amount) ?? 0)<0) && <p className="muted" style={{fontSize:10}}>{no ? 'Søylene viser absoluttverdi; negative beløp har minustegn.' : 'Bars show magnitude; negative amounts carry a minus sign.'}</p>}
  </figure>;
}

export default function CompanyComparison() {
  const { companies, facts, loading, error, selected, toggle, openSearch,t,language } = useLensData();
  const [onlyDifferences,setOnlyDifferences]=useState(false);
  const [activeOrg,setActiveOrg]=useState('');
  const touch=useRef<{x:number;y:number}|null>(null);
  // Resolve against current records so stale persisted selections never create invented columns.
  const chosen = [...new Set(selected)].slice(0,3).flatMap(org => {
    const company = companies.find(c => c.org_number === org);
    return company ? [company] : [];
  });
  const active=chosen.some(c=>c.org_number===activeOrg)?activeOrg:chosen[0]?.org_number;
  const shareUrl='/compare?orgs='+chosen.map(c=>c.org_number).join(',');
  const differs=(row:Row)=>new Set(chosen.map(c=>{if(!found(c,row.category))return text(c.sections[row.category]);if(row.field==='locations_count')return String(locations(c,facts).length);if(row.field==='jobs_count')return String(jobs(c,facts).length);return [text(c[row.field]),...(row.category==='financials'?[text(c.latest_year),text(c.currency)]:[])].join('|');})).size>1;
  const visibleRows = onlyDifferences ? rows.filter(differs) : rows;
  const columns: CSSProperties = { gridTemplateColumns: `minmax(120px, .7fr) repeat(${Math.max(chosen.length, 1)}, minmax(0, 1fr))` };

  return <div>
    <Link className="back-link" href="/">← {t('Company Search')}</Link>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 10 }}>{t('Side by Side')}</p>
        <h1 style={{ marginBottom: 8 }}>{t('Compare Companies')}</h1>
        <p className="muted" style={{ marginBottom: 0 }}>{t('The same fields. A clearer perspective.')}</p>
      </div>
      <button className="button secondary" disabled={chosen.length>=3} onClick={openSearch}>+ {t('Add Another Company')}</button>
    </div>

    {loading || error ? <DataState /> : <>
      {chosen.length>0&&<><ExportActions companies={chosen} facts={facts} shareUrl={shareUrl}/><div style={{display:'flex',flexWrap:'wrap',gap:16,alignItems:'center',margin:'16px 0'}}><span className="muted">{t('Differences highlighted')}</span><label className="check-filter"><input type="checkbox" checked={onlyDifferences} onChange={e=>setOnlyDifferences(e.target.checked)}/>{language==='no' ? 'Vis bare forskjeller' : 'Show only differences'}</label><span className="muted text-xs" aria-live="polite">{visibleRows.length} {language==='no' ? 'felt' : 'fields'}</span></div><div className="compare-tabs" role="group" aria-label={t('Compare Companies')}>{chosen.map(c=><button key={c.org_number} className={`button ${active===c.org_number?'selected':'secondary'}`} aria-pressed={active===c.org_number} onClick={()=>setActiveOrg(c.org_number)}>{title(c.legal_name)||c.org_number}</button>)}</div></>}
      
      {chosen.length < 2 && <section className="empty-state" style={{ padding: '24px 20px', marginBottom: 24 }} aria-labelledby="compare-guidance">
        <h2 id="compare-guidance" style={{ fontSize: 20, marginBottom: 8 }}>{t(chosen.length ? 'Choose One More Company' : 'Choose Companies to Compare')}</h2>
        <p style={{ marginBottom: 16 }}>{t('Add at least two companies to see their details side by side.')}</p>
        <button className="button" onClick={openSearch}>{t('Find a Company')}</button>
      </section>}
      {chosen.length > 0 && <div className={`compare-grid compare-count-${chosen.length}`} onTouchStart={e=>{touch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}} onTouchCancel={()=>{touch.current=null;}} onTouchEnd={e=>{if(!touch.current||!e.changedTouches.length)return;const dx=e.changedTouches[0].clientX-touch.current.x,dy=e.changedTouches[0].clientY-touch.current.y;touch.current=null;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)){const index=chosen.findIndex(c=>c.org_number===active);setActiveOrg(chosen[Math.max(0,Math.min(chosen.length-1,index+(dx<0?1:-1)))].org_number);}}} role="table" aria-label={t('Company Comparison')} aria-rowcount={visibleRows.length + 1} aria-colcount={chosen.length + 1}>
        <div className="compare-row compare-header" role="row" style={{...columns,position:'sticky',top:0,zIndex:3,background:'var(--surface, #f6f8f7)'}}> 
          <div className="compare-cell compare-label" role="columnheader" style={{ display: 'flex', alignItems: 'center' }}>{t('Company Details')}</div>
          {chosen.map(company => <div className={`compare-cell compare-company-column ${active===company.org_number?'is-active':''}`} role="columnheader" key={company.org_number}>
            <Link href={companyHref(company)} style={{ display: 'block', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', paddingTop: 4 }}>{title(company.legal_name) || company.org_number}</Link>
            <span className="muted" style={{ display: 'block', fontSize: 11 }}>Org. {company.org_number}</span>
            <button className="button text" style={{ fontSize: 11, minHeight: 44, paddingTop: 4, paddingBottom: 4 }} aria-label={`${t('Remove')} ${title(company.legal_name) || company.org_number}`} onClick={() => toggle(company.org_number)}>{t('Remove')} ×</button>
            <MiniFinancials company={company} facts={facts}/>
          </div>)}
        </div>
        {visibleRows.map(row => <div className={`compare-row ${differs(row)?'compare-different':''}`} role="row" key={row.field} style={columns}>
          <div className="compare-cell compare-label" role="rowheader" style={{ display: 'flex', alignItems: 'center' }}>{t(row.label)}</div>
          {chosen.map(company => <div className={`compare-cell compare-company-column ${active===company.org_number?'is-active':''}`} role="cell" key={company.org_number}>
            <Link className="compare-company-name" href={companyHref(company)}>{title(company.legal_name).split(/\s+/).slice(0, 2).join(' ') || company.org_number}</Link>
            <ComparisonValue company={company} facts={facts} row={row} />
          </div>)}
        </div>)}
      </div>}
      {chosen.length > 1 && onlyDifferences && visibleRows.length === 0 && <p className="empty-state" role="status">{language==='no' ? 'Ingen forskjeller i de sammenlignede feltene.' : 'No differences in the compared fields.'}</p>}
    </>}
  </div>;
}
