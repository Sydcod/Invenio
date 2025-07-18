'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function SplitText({ children, className = '', delay = 0, duration = 0.05 }: SplitTextProps) {
  const characters = children.split('');
  
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: duration, delayChildren: delay },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      y: 20,
      transition: {
        type: "spring" as const,
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <motion.div
      className={className}
      style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {characters.map((char, index) => (
        <motion.span
          key={index}
          variants={child}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.div>
  );
}
