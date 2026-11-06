import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const dynamic='force-static';
export async function GET(){
 const [companies,facts]=await Promise.all(['companies','facts'].map(async name=>JSON.parse(await readFile(join(process.cwd(),'public','data',name+'.json'),'utf8'))));
 const evidenceCounts:Record<string,number>={};for(const f of facts)evidenceCounts[f.org_number]=(evidenceCounts[f.org_number]||0)+1;
 const checked=facts.map((f:Record<string,unknown>)=>String(f.retrieved_at||'')).filter(Boolean).sort().at(-1)||'';
 return Response.json({companies:companies.length,facts:facts.length,websites:new Set(facts.filter((f:Record<string,unknown>)=>f.category==='website'&&typeof f.proof_quote==='string'&&f.proof_quote.trim()).map((f:Record<string,unknown>)=>f.org_number)).size,gaps:companies.reduce((n:number,c:{sections:Record<string,string>})=>n+Object.values(c.sections).filter(s=>s!=='available').length,0),checked,evidenceCounts});
}
