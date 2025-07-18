"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

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
          <span className="block text-white animate-fade-in-up" style={{ animationDelay: '0.1s' }}>Stop Guessing.</span>
          <span className="block text-blue-400 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>Start Knowing Your Money.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-gray-200 mb-10 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          We have made the changes
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link href="#how-it-works" className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white border-2 border-white/30 rounded-full hover:bg-white/10 transition-all duration-200">
            See How It Works
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-400 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
          <p>Trusted by 10,000+ users • No credit card required</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
