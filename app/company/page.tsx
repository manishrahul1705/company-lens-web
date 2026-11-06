import { Suspense } from 'react';
import { CompanyProfile } from '@/components/company-profile';
import type {Metadata} from 'next';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {cache} from 'react';
import {text,type Company} from '@/lib/lens-data';
const directory=cache(async()=>JSON.parse(await readFile(join(process.cwd(),'public/data/companies.json'),'utf8')) as Company[]);
export async function generateMetadata({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}):Promise<Metadata>{const p=await searchParams;const org=typeof p.org==='string'?p.org:'';const company=/^\d{9}$/.test(org)?(await directory()).find(c=>c.org_number===org):undefined;const name=company?text(company.legal_name):'Company';const pageTitle=`${name} – Nordic Company Lens`;const description=company?`Explore ${name}: registry records, documented facts and original sources.`:'Find company records and inspect their original sources.';return {title:pageTitle,description,openGraph:{title:pageTitle,description,type:'website'},twitter:{card:'summary_large_image',title:pageTitle,description,images:['/opengraph-image']}};}

export default function CompanyPage() {
  return <Suspense fallback={<main className="container"><div role="status">Loading Company Records…</div></main>}><CompanyProfile /></Suspense>;
}
