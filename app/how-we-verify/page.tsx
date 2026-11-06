import type {Metadata} from 'next';
import {VerificationGuide} from '@/components/verification-guide';

export const metadata:Metadata={
  title:'How we verify – Nordic Company Lens',
  description:'How registry records and quoted website evidence support company facts, and why missing or ambiguous information stays a gap.',
  openGraph:{title:'How we verify – Nordic Company Lens',description:'From the registry to proof on the page: understand the evidence behind company facts.',type:'website'},
};

export default function HowWeVerifyPage(){
  return <VerificationGuide/>;
}
