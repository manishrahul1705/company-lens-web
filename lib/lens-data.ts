export type Company = Record<string, unknown> & { org_number: string; sections: Record<string, unknown> };
export type Fact = Record<string, unknown> & { org_number: string; category: string };
export const categories = ['identity','financials','people','locations','website','social','jobs','news'] as const;
export type Category = typeof categories[number];
export const text = (v: unknown): string => typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
export const number = (v: unknown): number | null => typeof v === 'number' && Number.isFinite(v) ? v : null;
export function title(v: unknown) {
  let index = 0;
  return text(v).replace(/\p{L}+/gu, word => {
    const lower = word.toLocaleLowerCase('nb-NO');
    const first = index++ === 0;
    if (['og', 'i', 'på', 'av', 'for', 'med', 'til'].includes(lower)) return first ? lower[0].toLocaleUpperCase('nb-NO') + lower.slice(1) : lower;
    if (/^\p{Lu}{2,3}$/u.test(word)) return word;
    return lower[0].toLocaleUpperCase('nb-NO') + lower.slice(1);
  });
}
export function address(v: unknown) { return text(v).replace(/\b[\p{Lu}][\p{Lu}\s-]+$/u, x => title(x)); }
export function safeUrl(v: unknown) { try { const u = new URL(text(v)); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } }
export function status(c: Company, category: string) { const s = text(c.sections[category]); return s === 'available' ? 'Found' : s === 'not_found' ? 'Not found' : 'Could not check'; }
export const found = (c: Company, category: string) => status(c, category) === 'Found';
export function money(v: unknown, year?: unknown, currency: unknown = 'NOK') { const n=number(v); return n === null ? 'Not found' : `${text(currency) || 'NOK'} ${new Intl.NumberFormat('en-US',{maximumFractionDigits:0}).format(n)}${text(year) ? ` (${text(year)})` : ''}`; }
export function percent(v: unknown) { const n=number(v); return n === null ? 'Not found' : `${n > 0 ? '+' : ''}${new Intl.NumberFormat('en-US',{maximumFractionDigits:1}).format(n*100)}%`; }
export function date(v: unknown) { const s=text(v); const d=new Date(s); return s && !Number.isNaN(d.getTime()) ? new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(d) : s || 'Not found'; }
export const companyHref = (c: Company) => `/company?org=${encodeURIComponent(c.org_number)}`;
export function companyFacts(c: Company, facts: Fact[], category?: string) { return facts.filter(f => f.org_number===c.org_number && (!category || f.category===category) && found(c,f.category)); }
export function financialFact(c: Company, facts: Fact[], metric: string, year: unknown) { return companyFacts(c,facts,'financials').find(f => text(f.metric)===metric && text(f.year)===text(year) && number(f.amount)!==null); }
export function growthFacts(c: Company, facts: Fact[]) { const year=text(c.latest_year); const first=financialFact(c,facts,'revenue',year); const prior=/^\d{4}$/.test(year) ? financialFact(c,facts,'revenue',String(Number(year)-1)) : undefined; return first && prior ? [first,prior] : []; }
const aliases: Record<string,string[]> = {legal_form:['legal form','organisasjonsform'],municipality:['municipality','kommune'],industry_code:['industry code','industry','næringskode'],industry_text:['industry','industry text','næring'],founded:['founded','stiftelsesdato'],employees:['employees','number of employees'],ceo:['ceo','daglig leder'],board_chair:['board chair','styreleder'],website:['website','nettside'],org_number:['organisation number','organization number','org number'],address:['address','registered address']};
export function evidence(c: Company, facts: Fact[], field: string): Fact[] { if(field==='latest_revenue') { const f=financialFact(c,facts,'revenue',c.latest_year); return f?[f]:[]; } if(field==='latest_profit') { const f=financialFact(c,facts,'annual_result',c.latest_year); return f?[f]:[]; } if(field==='revenue_growth') return growthFacts(c,facts); const names=aliases[field] || [field.replaceAll('_',' ')]; return companyFacts(c,facts).filter(f=>names.includes(text(f.field).toLowerCase())); }
export function locations(c: Company, facts: Fact[]) { if(!found(c,'locations')) return []; const entries=companyFacts(c,facts,'locations').filter(f=>text(f.value)&&!(/workplaces?\s*\(count\)|count/i.test(text(f.field)))); const a=text(c.address); return [...(a ? [{value:address(a),fact:entries.find(f=>text(f.value)===a)}] : []),...entries.filter(f=>text(f.value)!==a).map(f=>({value:address(f.value),fact:f}))]; }
export function jobs(c: Company, facts: Fact[]) { return companyFacts(c,facts,'jobs').filter(f=>text(f.value)); }
export function parseCompanies(raw: unknown): Company[] { if(!Array.isArray(raw)) throw new Error('Company data must be an array.'); const seen=new Set<string>(); return raw.flatMap(v=>{ if(!v || typeof v!=='object' || Array.isArray(v)) return []; const id=text(v.org_number); if(!/^\d{9}$/.test(id)||seen.has(id)) return []; seen.add(id); return [{...v,org_number:id,sections:v.sections && typeof v.sections==='object' && !Array.isArray(v.sections) ? v.sections : {}}]; }); }
export function parseFacts(raw: unknown): Fact[] { if(!Array.isArray(raw)) throw new Error('Fact data must be an array.'); return raw.flatMap(v=>v && typeof v==='object' && !Array.isArray(v) && /^\d{9}$/.test(text(v.org_number)) && categories.includes(v.category) ? [{...v,org_number:text(v.org_number),category:text(v.category)}] : []); }
export function normalize(v: string) { return v.toLowerCase().replaceAll('æ','ae').replaceAll('ø','o').normalize('NFD').replace(/[\u0300-\u036f]/g,''); }
function distance(a:string,b:string){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return row[b.length];}
export function matches(c: Company, query: string) { const q=normalize(query.trim()),name=normalize(text(c.legal_name)); if(!q||name.includes(q)||[c.municipality,c.industry_text,c.industry_text_en,c.industry_code].some(v=>normalize(text(v)).includes(q)))return true;if(/^[\d\s.-]+$/.test(q))return c.org_number.includes(q.replace(/\D/g,''));return q.length>=3&&q.split(/\s+/).every(part=>name.split(/\s+/).some(word=>distance(part,word)<= (part.length>5?2:1))); }
