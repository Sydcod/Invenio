'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play } from 'lucide-react';

interface HeroVideoDialogProps {
  trigger: React.ReactNode;
  videoSrc: string;
  thumbnailSrc?: string;
}

export function HeroVideoDialog({ trigger, videoSrc, thumbnailSrc }: HeroVideoDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative w-full max-w-4xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setIsOpen(false)}
                className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-8 h-8" />
              </button>
              
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                <video
                  src={videoSrc}
                  controls
                  autoPlay
                  className="w-full h-full"
                  poster={thumbnailSrc}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
