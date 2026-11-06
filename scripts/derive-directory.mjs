import fs from 'node:fs';
const root=new URL('../public/data/',import.meta.url);
const companies=JSON.parse(fs.readFileSync(new URL('companies.json',root)));
const facts=JSON.parse(fs.readFileSync(new URL('facts.json',root)));
fs.mkdirSync(new URL('companies/',root),{recursive:true});
const evidenceCounts={};for(const f of facts)evidenceCounts[f.org_number]=(evidenceCounts[f.org_number]||0)+1;
for(const c of companies)fs.writeFileSync(new URL(`companies/${c.org_number}.json`,root),JSON.stringify(c));
const dates=facts.map(f=>f.retrieved_at).filter(Boolean).sort();
fs.writeFileSync(new URL('summary.json',root),JSON.stringify({companies:companies.length,facts:facts.length,websites:companies.filter(c=>c.sections.website==='available'&&c.website).length,verifiedWebsites:companies.filter(c=>c.website_verified===true).length,gaps:companies.reduce((n,c)=>n+Object.values(c.sections).filter(s=>s!=='available').length,0),checked:dates.at(-1)||null,evidenceCounts}));
