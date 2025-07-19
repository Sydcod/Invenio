"use client";

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import VANTA from 'vanta/dist/vanta.net.min';
import { SplitText } from '@/components/ui/split-text';
import { BlurText } from '@/components/ui/blur-text';
import { RippleButton } from '@/components/ui/ripple-button';
import { HeroVideoDialog } from '@/components/ui/hero-video-dialog';
import { DashboardMockup } from '@/components/ui/dashboard-mockup';

const Hero = () => {
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    // Dynamically import Vanta.js and Three.js on the client side
    const loadVanta = async () => {
      try {
        const three = await import('three');
        const NET = (await import('vanta/dist/vanta.net.min')).default;
        
        if (vantaRef.current && !vantaEffect) {
          setVantaEffect(
            NET({
              el: vantaRef.current,
              THREE: three,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              scaleMobile: 1.00,
              color: 0x3b82f6, // Blue-500
              backgroundColor: 0x020617, // Slate-950
              points: 10.00,
              maxDistance: 25.00,
              spacing: 20.00
            })
          );
        }
      } catch (error) {
        console.error('Error loading Vanta:', error);
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <section ref={vantaRef} className="relative w-full min-h-screen flex items-center justify-center overflow-hidden">
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40 z-10" />

      <div className="relative z-20 max-w-4xl mx-auto text-center px-6 py-20 md:px-8">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
          <SplitText className="block text-white" delay={0.1}>
            Master Your Inventory
          </SplitText>
          <SplitText className="block text-blue-400" delay={0.3}>
            Control Your Business
          </SplitText>
        </h1>

        <BlurText 
          className="max-w-2xl mx-auto text-lg md:text-xl text-blue-400 mb-10" 
          delay={0.8}
        >
          The intelligent inventory management platform that transforms complex operations into simple workflows. Real-time tracking, smart reordering, and powerful analytics – all in one intuitive system.
        </BlurText>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <RippleButton href="/register">
            Start Your Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </RippleButton>
          
          <HeroVideoDialog
            videoSrc="/demo-video.mp4"
            trigger={
              <button className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transition-all duration-200">
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Demo
              </button>
            }
          />
        </div>

        {/* Trust Indicators */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-300 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Real-Time Tracking
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> Multi-Location Support
          </span>
          <span className="flex items-center gap-2">
            <span className="text-green-400">✓</span> 30-Day Free Trial
          </span>
        </div>

        {/* Dashboard Mockup */}
        <DashboardMockup />
      </div>
    </section>
  );
};

export default Hero;
