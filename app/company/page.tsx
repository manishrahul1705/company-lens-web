import { Suspense } from 'react';
import { CompanyProfile } from '@/components/company-profile';

export default function CompanyPage() {
  return <Suspense fallback={<main className="container"><div role="status">Loading Company Records…</div></main>}><CompanyProfile /></Suspense>;
}
