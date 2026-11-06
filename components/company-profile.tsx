'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { ExportActions } from '@/components/export-actions';
import { useLensData } from '@/components/lens-provider';
import { CompareButton, DataState, Missing, Section, SourceButton, StatusBadge } from '@/components/lens-ui';
import { categories, companyFacts, date, evidence, financialFact, found, jobs, locations, money, number, percent, safeUrl, status, text, title, type Company, type Fact } from '@/lib/lens-data';

const sectionNames: Record<string, string> = { identity: 'Identity', financials: 'Financials', people: 'People', locations: 'Locations', website: 'Website', social: 'Social', jobs: 'Jobs', news: 'News' };
const metrics = [ ['revenue', 'Revenue'], ['operating_result', 'Operating Result'], ['profit_before_tax', 'Profit before Tax'], ['annual_result', 'Annual Result'], ['assets', 'Total Assets'], ['equity', 'Equity'], ['debt', 'Debt'] ] as const;
const label = (v: unknown) => title(v).replace(/\b(Of|The|And|In|To|Before)\b/g, x => x.toLowerCase());
function Display({ value }: { value: unknown }) { return text(value) && text(value) !== 'Not found' ? <>{text(value)}</> : <Missing />; }
function Unchecked({ company, category }: { company: Company; category: string }) {
  const { t } = useLensData();
  return <div className="section-empty"><p className="missing">{t(status(company, category))}</p><p className="muted text-sm">{t(status(company, category) === 'Not found' ? 'The dataset records no result for this section. This does not mean the information does not exist.' : 'The source could not be checked. No conclusion can be drawn about this section.')}</p></div>;
}
function Checked({ company, facts, category }: { company: Company; facts: Fact[]; category: string }) {
  const { t } = useLensData();
  const records = facts.filter(f => f.org_number === company.org_number && f.category === category);
  const dates = records.map(f => text(f.retrieved_at)).filter(v => v && Number.isFinite(Date.parse(v))).sort((a, b) => Date.parse(b) - Date.parse(a));
  return <div className="section-check-context"><p className="section-checked muted text-xs">{dates.length ? <>{t('Checked')} <time dateTime={dates[0]}>{date(dates[0])}</time></> : t('Check date not recorded')}{records.length > 0 && <SourceButton company={company} facts={records} />}</p>{records.length === 0 && <p className="muted text-sm">{t('No source records are included for this section. Its check date and checked sources are unavailable.')}</p>}</div>;
}
function FactRow({ company, name, value, facts = [] }: { company: Company; name: string; value: ReactNode; facts?: Fact[] }) {
  const { t } = useLensData();
  return <div className="data-row"><dt>{t(name)}</dt><dd className="min-w-0 break-words">{value}<SourceButton company={company} facts={facts} /></dd></div>;
}
function Field({ company, facts, field, name, category, format = text }: { company: Company; facts: Fact[]; field: string; name: string; category: string; format?: (v: unknown) => string }) {
  return <FactRow company={company} name={name} value={<Display value={found(company, category) ? format(company[field]) : ''} />} facts={found(company, category) && text(company[field]) ? evidence(company, facts, field) : []} />;
}
function Financials({ company: c, facts }: { company: Company; facts: Fact[] }) {
  const { t } = useLensData();
  if (!found(c, 'financials')) return <Unchecked company={c} category="financials" />;
  const financials = companyFacts(c, facts, 'financials');
  const years = [...new Set(financials.filter(f => metrics.some(([metric]) => metric === text(f.metric)) && /^\d{4}$/.test(text(f.year)) && number(f.amount) !== null).map(f => text(f.year)))].sort((a, b) => Number(b) - Number(a));
  const chartYears = [...years].reverse();
  const chartFacts = financials.filter(f => ['revenue', 'annual_result'].includes(text(f.metric)) && number(f.amount) !== null && /^\d{4}$/.test(text(f.year)));
  const scale = Math.max(...chartFacts.map(f => Math.abs(number(f.amount)!)), 1);
  return <>
    <div className="metric-grid">{[
      ['Latest Revenue', money(c.latest_revenue, c.latest_year, c.currency), 'latest_revenue'],
      ['Annual Result', money(c.latest_profit, c.latest_year, c.currency), 'latest_profit'],
      ['Revenue Change', percent(c.revenue_growth), 'revenue_growth'],
    ].map(([name, value, field]) => <div className="metric" key={field}><p className="muted text-xs mb-2">{t(name)}</p><div className="value break-words"><Display value={value} /></div><SourceButton company={c} facts={value === 'Not found' ? [] : evidence(c, facts, field)} /></div>)}</div>
    <figure className="financial-chart mb-7 rounded-md border border-[#dde5e0] p-4 sm:p-5" aria-labelledby="financial-chart-title">
      <figcaption id="financial-chart-title" className="mb-4 font-medium">{t('Revenue')} & {t('Annual Result')} · {text(c.currency) || 'NOK'}</figcaption>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs muted mb-5"><span><span className="inline-block h-2 w-2 mr-2 rounded-sm bg-[#087f5b]" />{t('Revenue')}</span><span><span className="inline-block h-2 w-2 mr-2 rounded-sm bg-[#94b8a7]" />{t('Annual Result')}</span></div>
      {chartFacts.length ? chartYears.map(year => <div key={year} className="mb-5 last:mb-0"><p className="mb-2 text-xs font-semibold">{year}</p>{(['revenue', 'annual_result'] as const).map(metric => {
        const f = financialFact(c, facts, metric, year);
        const value = f ? number(f.amount) : null;
        return <div key={metric} className="mb-3"><div className="flex flex-wrap items-center justify-between gap-x-3 text-xs mb-1"><span className="muted">{t(metric === 'revenue' ? 'Revenue' : 'Annual Result')}</span><span><Display value={value === null ? '' : money(value, undefined, c.currency)} />{f && <SourceButton company={c} facts={[f]} />}</span></div>{value !== null && <div className="h-3 rounded-sm bg-[#edf2ee]" aria-hidden="true"><div className="h-3 rounded-sm" style={{ width: `${Math.abs(value) / scale * 100}%`, background: metric === 'revenue' ? '#087f5b' : '#94b8a7' }} /></div>}</div>;
      })}</div>) : <Missing />}
      {chartFacts.some(f => (number(f.amount) ?? 0) < 0) && <p className="muted text-xs mt-4">{t('Bar lengths show magnitude; negative amounts are labelled with a minus sign.')}</p>}
    </figure>
    {years.length ? <div className="financial-table-wrap" role="region" aria-label={t('Annual Financial Figures')} tabIndex={0}><table><caption className="text-left px-4 py-3 text-xs muted">{t('Annual Financial Figures')} · {text(c.currency) || 'NOK'}</caption><thead><tr><th scope="col">{t('Metric')}</th>{years.map(year => <th scope="col" key={year}>{year}</th>)}</tr></thead><tbody>{metrics.map(([metric, name]) => <tr key={metric}><th scope="row">{t(name)}</th>{years.map(year => { const f = financialFact(c, facts, metric, year); return <td key={year}><Display value={f ? money(f.amount, undefined, c.currency) : ''} />{f && <SourceButton company={c} facts={[f]} />}</td>; })}</tr>)}</tbody></table></div> : <p className="missing">{t('Not found')}</p>}
  </>;
}
function People({ company: c, facts }: { company: Company; facts: Fact[] }) {
  if (!found(c, 'people')) return <Unchecked company={c} category="people" />;
  const people = companyFacts(c, facts, 'people');
  const included = new Set([...(text(c.ceo) ? evidence(c, facts, 'ceo') : []), ...(text(c.board_chair) ? evidence(c, facts, 'board_chair') : [])]);
  return <dl><Field company={c} facts={facts} field="ceo" name="CEO" category="people" format={title} /><Field company={c} facts={facts} field="board_chair" name="Board Chair" category="people" format={title} />{people.filter(f => !included.has(f)).map((f, i) => <FactRow key={i} company={c} name={label(f.field) || 'Person'} value={<Display value={title(f.value)} />} facts={[f]} />)}</dl>;
}
function WebSection({ company: c, facts, category }: { company: Company; facts: Fact[]; category: 'website' | 'social' }) {
  if (!found(c, category)) return <Unchecked company={c} category={category} />;
  const items = companyFacts(c, facts, category);
  const website = category === 'website' ? safeUrl(c.website) : '';
  const link = (url: string, name: string) => <a className="underline decoration-[#b8ccc0] underline-offset-4 break-all" href={url} target="_blank" rel="noopener noreferrer">{name} ↗</a>;
  return <dl>{category === 'website' && <FactRow company={c} name="Website" value={website ? link(website, website) : <Missing />} facts={website ? evidence(c, facts, 'website') : []} />}{items.filter(f => !(website && safeUrl(f.value) === website)).map((f, i) => <FactRow key={i} company={c} name={label(f.field) || sectionNames[category]} value={safeUrl(f.value) ? link(safeUrl(f.value), text(f.value)) : <Display value={f.value} />} facts={[f]} />)}{category === 'social' && !items.length && <Missing />}</dl>;
}
function sectionReason(c: Company, facts: Fact[], category: string, no: boolean) {
  const reasons = c.section_reasons && typeof c.section_reasons === 'object' ? c.section_reasons as Record<string, unknown> : {};
  const explicit = text(reasons[category]) || facts.filter(f => f.org_number === c.org_number && f.category === category).map(f => text(f.reason) || text(f.error_reason)).filter(Boolean).join(' · ');
  return explicit || (no ? 'Årsak er ikke registrert i datasettet.' : 'Reason not recorded in the dataset.');
}
function Profile({ company: c, facts }: { company: Company; facts: Fact[] }) {
  const { t, openSource, language } = useLensData();
  const no = language === 'no';
  const local = (en: string, nb: string) => no ? nb : en;
  const sourced = (value: ReactNode, sources: Fact[], name: string) => sources.length ? <button className="summary-fact" style={{textAlign:'left',overflowWrap:'anywhere'}} onClick={() => openSource(c, sources)} aria-label={`${t('Source')}: ${name}`}>{value}</button> : <span title={local('Source not recorded in the dataset.', 'Kilde er ikke registrert i datasettet.')}>{value}</span>;
  const identitySources = (field: string) => identity ? evidence(c, facts, field) : [];
  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem('ncl-recent') || '[]');
      const ids = Array.isArray(stored) ? stored.filter((id): id is string => typeof id === 'string' && /^\d{9}$/.test(id)) : [];
      localStorage.setItem('ncl-recent', JSON.stringify([c.org_number, ...ids.filter(id => id !== c.org_number)].slice(0, 8)));
    } catch {}
  }, [c.org_number]);
  const identity = found(c, 'identity');
  const financial = found(c, 'financials');
  const website = found(c, 'website') ? safeUrl(c.website) : '';
  const places = locations(c, facts);
  const ads = jobs(c, facts);
  const news = companyFacts(c, facts, 'news').filter(f => text(f.value)).sort((a, b) => {
    const timestamp = (v: unknown) => { const n = Date.parse(text(v)); return Number.isFinite(n) ? n : -Infinity; };
    return timestamp(b.reporting_period) - timestamp(a.reporting_period);
  });
  const summary = [
    { field: 'municipality', name: 'Municipality', value: identity ? title(c.municipality) : '' },
    { field: 'industry_text', name: 'Industry', value: identity ? (no ? text(c.industry_text) : text(c.industry_text_en) || text(c.industry_text)) : '' },
    { field: 'employees', name: 'Employees', value: identity && number(c.employees) !== null ? text(c.employees) : '' },
    { field: 'latest_revenue', name: 'Latest Revenue', value: financial && number(c.latest_revenue) !== null ? money(c.latest_revenue, c.latest_year, c.currency) : '' },
    { field: 'latest_profit', name: 'Annual Result', value: financial && number(c.latest_profit) !== null ? money(c.latest_profit, c.latest_year, c.currency) : '' },
    { field: 'ceo', name: 'CEO', value: found(c, 'people') ? title(c.ceo) : '' },
  ].map(part => ({ ...part, sources: evidence(c, facts, part.field).filter(f => !['latest_revenue','latest_profit'].includes(part.field) || number(f.amount) === number(c[part.field])) }));
  const sectionIds: Record<string, string> = { identity: 'key-facts', financials: 'financials', people: 'people', locations: 'locations', website: 'website', social: 'social', jobs: 'jobs', news: 'news' };
  const history = Array.isArray(c.history) ? c.history.filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object' && !Array.isArray(entry)).filter(entry => text(entry.date) && text(entry.field) && (text(entry.old_value) || text(entry.new_value))) : [];
  return <>
    <header className="profile-sticky-header"><div className="eyebrow">{t('Company Profile')}</div><div className="flex flex-wrap justify-between items-start gap-5"><div className="min-w-0"><h1 className="break-words mb-4">{sourced(title(c.legal_name) || <Missing />, identity ? companyFacts(c, facts, 'identity').filter(f => /^(legal name|registered legal name|company name|name)$/i.test(text(f.field))) : [], t('Registered Legal Name'))}</h1><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm muted"><span>{sourced(`Org. ${c.org_number}`, identitySources('org_number'), t('Organisation Number'))}</span><span>{t('Status')}: {sourced(text(c.status) || t('Not found'), identitySources('status'), t('Status'))}</span>{identity && text(c.legal_form) && <span>{text(c.legal_form)}</span>}{website && <span>{sourced(<><span aria-hidden="true">◎ </span>{t('Website')}</>, evidence(c, facts, 'website'), t('Website'))}<a href={website} target="_blank" rel="noopener noreferrer" aria-label={local('Visit website', 'Besøk nettsted')}> ↗</a></span>}{companyFacts(c, facts, 'social').filter(f => safeUrl(f.value)).map((f, i) => <span key={i}>{sourced(<><span aria-hidden="true">↗ </span>{text(f.field) || t('Social')}</>, [f], text(f.field) || t('Social'))}<a href={safeUrl(f.value)} target="_blank" rel="noopener noreferrer" aria-label={`${local('Visit', 'Besøk')} ${text(f.field) || t('Social')}`}> ↗</a></span>)}</div></div><CompareButton company={c} /></div></header>
    <dl className="profile-top-facts" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%, 190px),1fr))',gap:16,margin:'20px 0 24px'}}>{summary.map(part => <div key={part.field} style={{minWidth:0}}><dt className="small-label">{t(part.name)}</dt><dd style={{margin:0,overflowWrap:'anywhere'}}>{sourced(part.value || <Missing />, part.sources, `${t(part.name)} — ${part.value || t('Not found')}`)}</dd></div>)}</dl>
    <section className="coverage-bar" aria-labelledby="coverage-bar-heading" style={{marginBottom:24}}><h2 id="coverage-bar-heading">{local('Coverage', 'Dekning')}</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:6}}>{categories.map(category => <details key={category} className={`coverage-segment coverage-${text(c.sections[category])}`} style={{borderTop:`4px solid ${found(c, category) ? 'var(--primary)' : 'var(--rule, #dde5e0)'}`,padding:'8px 10px',minWidth:0}}><summary title={`${t(sectionNames[category])}: ${t(status(c,category))}. ${sectionReason(c,facts,category,no)}`}><span>{t(sectionNames[category])}</span><span style={{display:'block',fontSize:12}}>{t(status(c,category))}</span></summary><p className="text-xs muted" style={{overflowWrap:'anywhere',marginTop:8}}>{sectionReason(c,facts,category,no)}</p><a href={`#${sectionIds[category]}`}>{local('View section', 'Se avsnitt')} →</a></details>)}</div></section>
    {categories.some(category => !found(c,category)) && <Section title={local("What we couldn't find", 'Det vi ikke fant')} id="recorded-gaps"><p className="muted">{local('Missing information is part of the record, not proof of absence. These are the gaps recorded by the dataset.', 'Manglende informasjon er en del av dokumentasjonen, ikke bevis på fravær. Dette er manglene registrert i datasettet.')}</p><ul style={{paddingLeft:20}}>{categories.filter(category => !found(c,category)).map(category => <li key={category} style={{marginBottom:12,overflowWrap:'anywhere'}}><strong>{t(sectionNames[category])}</strong> · {t(status(c,category))}<p className="muted text-sm" style={{marginBottom:4}}>{sectionReason(c,facts,category,no)}</p></li>)}</ul></Section>}
    <ExportActions companies={[c]} facts={facts} />
    <nav className="section-chips" aria-label={t('Company sections')}>{(['identity', 'people', 'financials', 'locations', 'website', 'social', 'jobs', 'news'] as const).map(category => <a className="section-chip" key={category} href={`#${sectionIds[category]}`}><span>{t(sectionNames[category])}</span><StatusBadge company={c} category={category} /></a>)}</nav>
    <div className="company-layout"><div className="min-w-0">
      <Section title={t('Key Facts')} id="key-facts"><Checked company={c} facts={facts} category="identity" />{identity ? <dl><FactRow company={c} name="Organisation Number" value={c.org_number} facts={evidence(c, facts, 'org_number')} /><Field company={c} facts={facts} field="legal_form" name="Legal Form" category="identity" /><Field company={c} facts={facts} field="municipality" name="Municipality" category="identity" format={title} /><Field company={c} facts={facts} field="industry_text" name="Industry" category="identity" /><Field company={c} facts={facts} field="industry_code" name="Industry Code" category="identity" /><Field company={c} facts={facts} field="founded" name="Founded" category="identity" format={v => text(v) ? date(v) : ''} /><Field company={c} facts={facts} field="employees" name="Employees" category="identity" format={v => number(v) === null ? '' : text(v)} /></dl> : <Unchecked company={c} category="identity" />}</Section>
      <Section title={t('Financials')} id="financials"><Checked company={c} facts={facts} category="financials" /><Financials company={c} facts={facts} /></Section>
      <Section title={t('People')} id="people"><Checked company={c} facts={facts} category="people" /><People company={c} facts={facts} /></Section>
      <Section title={t('Locations')} id="locations"><Checked company={c} facts={facts} category="locations" />{found(c, 'locations') ? <><p className="muted text-sm">{t('Number of Locations')}: {places.length}</p>{places.length ? <ul className="list-none p-0 m-0">{places.map((place, i) => <li className="data-row" key={i}><span className="break-words min-w-0">{place.value}</span><SourceButton company={c} facts={place.fact ? [place.fact] : evidence(c, facts, 'address')} /></li>)}</ul> : <Missing />}</> : <Unchecked company={c} category="locations" />}</Section>
      <Section title={t('Website & Social')} id="website-social"><div id="website" className="profile-section-anchor"><h3>{t('Website')}</h3><Checked company={c} facts={facts} category="website" /><WebSection company={c} facts={facts} category="website" /></div><div id="social" className="profile-section-anchor"><h3 className="mt-6">{t('Social')}</h3><Checked company={c} facts={facts} category="social" /><WebSection company={c} facts={facts} category="social" /></div></Section>
      <Section title={t('Jobs')} id="jobs"><Checked company={c} facts={facts} category="jobs" />{found(c, 'jobs') ? <>{ads.length ? <><p className="muted text-sm">{t('Number of Job Ads')}: {ads.length}</p><ul className="list-none m-0 p-0">{ads.map((f, i) => { const [occupation, ...place] = text(f.value).split('·'); return <li key={i} className="border-b border-[#dde5e0] py-4 last:border-0"><h3 className="mb-2">{occupation.trim() || <Missing />}</h3><p className="muted text-sm mb-1">{t('Place')}: <Display value={title(place.join('·').trim())} /></p><p className="muted text-sm mb-0"><Display value={f.reporting_period} /></p><SourceButton company={c} facts={[f]} /></li>; })}</ul></> : <Missing />}</> : <Unchecked company={c} category="jobs" />}</Section>
      <Section title={t('News')} id="news"><Checked company={c} facts={facts} category="news" />{found(c, 'news') ? news.length ? <ul className="list-none m-0 p-0">{news.map((f, i) => <li key={i} className="border-b border-[#dde5e0] py-4 last:border-0"><p className="muted text-xs mb-2">{date(f.reporting_period)}</p><h3 className="mb-0 break-words">{text(f.value)}</h3><SourceButton company={c} facts={[f]} /></li>)}</ul> : <Missing /> : <Unchecked company={c} category="news" />}</Section>
      {history.length > 0 && <Section title={t('What changed')} id="history"><ol className="change-timeline">{history.map((entry, i) => <li key={i}><time dateTime={text(entry.date)}>{date(entry.date)}</time><p>{text(entry.field)}: {text(entry.old_value) || t('Not found')} → {text(entry.new_value) || t('Not found')}</p>{safeUrl(entry.source_url) && <a href={safeUrl(entry.source_url)} target="_blank" rel="noopener noreferrer">{t('Source')} ↗</a>}</li>)}</ol></Section>}
    </div><aside className="coverage" aria-labelledby="coverage-heading"><h2 id="coverage-heading">{t('Data Coverage')}</h2><p className="muted text-xs mb-4">{t('What we found, and what we could check.')}</p><ul className="list-none m-0 p-0">{categories.map(category => <li className="data-row" key={category}><a className="whitespace-nowrap" href={`#${sectionIds[category]}`}>{t(sectionNames[category])}</a><StatusBadge company={c} category={category} /></li>)}</ul></aside></div>
  </>;
}

export function CompanyProfile() {
  const params = useSearchParams();
  const org = params.get('org')?.trim() || '';
  const { companies, facts, loading, error, t } = useLensData();
  if (loading || error) return <div><DataState /></div>;
  const company = /^\d{9}$/.test(org) ? companies.find(c => c.org_number === org) : undefined;
  return <div><Link className="back-link" href="/">← {t('Back to Company Search')}</Link>{company ? <><Profile company={company} facts={facts} /></> : <div className="empty-state"><h1 className="text-3xl">{t(!org ? 'Choose a Company' : !/^\d{9}$/.test(org) ? 'Check the Organisation Number' : 'Company Not Found')}</h1><p>{t(!org ? 'Search for a company to view its profile and evidence.' : !/^\d{9}$/.test(org) ? 'An organisation number must contain nine digits.' : 'No company matches this organisation number in the current records.')}</p><Link className="button" href="/">{t('Search Companies')}</Link></div>}</div>;
}
