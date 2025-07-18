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
  title: 'FeNAgO - Agentic AI SaaS Platform Template',
  description: 'The complete platform for building agentic AI-powered SaaS products—ideal for students, developers, startups, and entrepreneurs looking to innovate rapidly. In the near future, every traditional SaaS application will inevitably be surpassed by an Agentic SaaS solution, redefining the competitive landscape.',
  keywords: 'agentic AI, SaaS template, AI platform, DrLee, AI development, FeNAgO, AI startup',
};

export default function Home(): JSX.Element {
  return (
    <>
      <Suspense fallback={<div>Loading...</div>}>
        <Header />
      </Suspense>
      <main>
        {/* FeNAgO - The complete platform for building agentic AI-powered SaaS products */}
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
