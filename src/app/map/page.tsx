import { AlgeriaCompanyMap } from '@/components/map';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interactive Enterprise Map | AlgeriaTrade.dz',
  description: 'Explore 1,700+ Algerian B2B companies on an interactive map. Filter by wilaya, industry, verification status. Find suppliers near you.',
  keywords: ['Algeria map', 'B2B directory', 'Algerian companies', 'enterprise locations', 'suppliers map'],
};

export default function MapPage() {
  return <AlgeriaCompanyMap />;
}
