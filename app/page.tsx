import { Suspense, ReactNode } from 'react';
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ValueProposition from "@/components/ValueProposition";
import SocialProof from "@/components/SocialProof";
import ProductShowcase from "@/components/ProductShowcase";
import CustomPricing from "@/components/CustomPricing";
import CustomFAQ from "@/components/CustomFAQ";
import CustomCTA from "@/components/CustomCTA";
import CustomFooter from "@/components/CustomFooter";
import { Metadata } from 'next';

// Add metadata for SEO
export const metadata: Metadata = {
  title: 'Invenio - Modern Inventory Management System',
  description: 'The intuitive inventory management platform that streamlines your entire supply chain. From real-time tracking to intelligent reordering, Invenio empowers small to medium businesses with enterprise-grade inventory control without the complexity.',
  keywords: 'inventory management, stock control, warehouse management, supply chain, order management, Invenio, inventory software, multi-location inventory',
};

export default function Home(): JSX.Element {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main>
        {/* Invenio - Modern inventory management made simple */}
        <Hero />
        <ValueProposition />
        <SocialProof />
        <ProductShowcase />
        <CustomPricing />
        <CustomFAQ />
        <CustomCTA />
      </main>
      <CustomFooter />
    </>
  );
}
