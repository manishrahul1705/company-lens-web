import CompanyComparison from '@/components/company-comparison';

export const metadata={title:'Compare companies – Nordic Company Lens',description:'Compare Norwegian companies side by side and inspect the original sources.',openGraph:{title:'Compare companies – Nordic Company Lens',description:'Company facts side by side, traced to their sources.',type:'website'},twitter:{card:'summary_large_image' as const,title:'Compare companies – Nordic Company Lens',description:'Company facts side by side, traced to their sources.',images:['/opengraph-image']}};
export default function ComparePage() {
  return <CompanyComparison />;
}
