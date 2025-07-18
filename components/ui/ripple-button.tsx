'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/libs/utils';

interface RippleButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  href?: string;
}

export function RippleButton({ children, className = '', onClick, href }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples([...ripples, { x, y, id }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 600);

    if (onClick) onClick();
  };

  const Component = href ? motion.a : motion.button;

  return (
    <Component
      href={href}
      className={cn(
        'relative overflow-hidden inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
        className
      )}
      onClick={handleClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 0,
            height: 0,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            width: 300,
            height: 300,
            opacity: 0,
          }}
          transition={{
            duration: 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
    </Component>
  );
}
