'use client';

import { motion } from 'framer-motion';

interface BlurTextProps {
  children: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export function BlurText({ children, className = '', delay = 0.5, duration = 0.8 }: BlurTextProps) {
  const variants = {
    hidden: {
      filter: 'blur(10px)',
      opacity: 0,
    },
    visible: {
      filter: 'blur(0px)',
      opacity: 1,
      transition: {
        duration: duration,
        delay: delay,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
