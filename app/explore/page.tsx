import type {Metadata} from 'next';
import {ExploreCharts} from '@/components/explore-charts';

export const metadata:Metadata={title:'Explore – Nordic Company Lens',description:'Explore Norwegian companies by municipality, industry and section coverage.'};
export default function ExplorePage(){return <ExploreCharts/>;}
