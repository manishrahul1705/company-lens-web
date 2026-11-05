'use client';

import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';
import {
  type Company, type Fact, companyHref, date, evidence, found, jobs,
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

export default function CompanyComparison() {
  const { companies, facts, loading, error, factsError, retry, selected, toggle, openSearch } = useLensData();
  // Resolve against current records so stale persisted selections never create invented columns.
  const chosen = [...new Set(selected)].flatMap(org => {
    const company = companies.find(c => c.org_number === org);
    return company ? [company] : [];
  });
  const columns: CSSProperties = { gridTemplateColumns: `minmax(120px, .7fr) repeat(${Math.max(chosen.length, 1)}, minmax(0, 1fr))` };

  return <div>
    <Link className="back-link" href="/">← Company Search</Link>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 24 }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: 10 }}>Side by Side</p>
        <h1 style={{ marginBottom: 8 }}>Compare Companies</h1>
        <p className="muted" style={{ marginBottom: 0 }}>The same fields. A clearer perspective.</p>
      </div>
      <button className="button secondary" onClick={openSearch}>+ Add Another Company</button>
    </div>

    {loading || error ? <DataState /> : <>
      
      {chosen.length < 2 && <section className="empty-state" style={{ padding: '24px 20px', marginBottom: 24 }} aria-labelledby="compare-guidance">
        <h2 id="compare-guidance" style={{ fontSize: 20, marginBottom: 8 }}>{chosen.length ? 'Choose One More Company' : 'Choose Companies to Compare'}</h2>
        <p style={{ marginBottom: 16 }}>{companies.length === 0
          ? 'There are no companies in the directory yet. Comparison needs at least two companies.'
          : companies.length === 1
            ? 'Comparison needs at least two companies. Only one company is currently available in the directory.'
            : 'Add at least two companies to see their details side by side.'}</p>
        <button className="button" onClick={openSearch}>Find a Company</button>
      </section>}
      {chosen.length > 0 && <div className={`compare-grid compare-count-${chosen.length}`} role="table" aria-label="Company Comparison" aria-rowcount={rows.length + 1} aria-colcount={chosen.length + 1}>
        <div className="compare-row compare-header" role="row" style={columns}>
          <div className="compare-cell compare-label" role="columnheader" style={{ display: 'flex', alignItems: 'center' }}>Company Details</div>
          {chosen.map(company => <div className="compare-cell" role="columnheader" key={company.org_number}>
            <Link href={companyHref(company)} style={{ display: 'block', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none', paddingTop: 4 }}>{title(company.legal_name) || company.org_number}</Link>
            <span className="muted" style={{ display: 'block', fontSize: 11 }}>Org. {company.org_number}</span>
            <button className="button text" style={{ fontSize: 11, minHeight: 44, paddingTop: 4, paddingBottom: 4 }} aria-label={`Remove ${title(company.legal_name) || company.org_number} from comparison`} onClick={() => toggle(company.org_number)}>Remove ×</button>
          </div>)}
        </div>
        {rows.map(row => <div className="compare-row" role="row" key={row.field} style={columns}>
          <div className="compare-cell compare-label" role="rowheader" style={{ display: 'flex', alignItems: 'center' }}>{row.label}</div>
          {chosen.map(company => <div className="compare-cell" role="cell" key={company.org_number}>
            <Link className="compare-company-name" href={companyHref(company)}>{title(company.legal_name).split(/\s+/).slice(0, 2).join(' ') || company.org_number}</Link>
            <ComparisonValue company={company} facts={facts} row={row} />
          </div>)}
        </div>)}
      </div>}
    </>}
  </div>;
}
