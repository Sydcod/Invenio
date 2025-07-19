'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Retail Store Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: "Invenio reduced our stockouts by 45% and overstock by 30%. The smart reordering system is incredible.",
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Operations Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: "Finally, inventory management that actually makes sense. The multi-location tracking saved us hours daily.",
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'E-commerce Director',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: "The demand forecasting AI is spot-on. We've reduced carrying costs by 25% while improving availability.",
    rating: 5,
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Warehouse Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: "Simple, powerful, and reliable. Invenio transformed our chaotic warehouse into a well-oiled machine.",
    rating: 5,
  },
  {
    id: 5,
    name: 'Jessica Park',
    role: 'Supply Chain Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    content: "The low stock alerts and automated PO generation saved us from multiple potential stockouts. Game-changer!",
    rating: 5,
  },
  {
    id: 6,
    name: 'Robert Williams',
    role: 'Restaurant Chain Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    content: "Invenio's analytics revealed inventory patterns we never noticed. Cut food waste by 40% in 3 months.",
    rating: 5,
  },
];

// Duplicate testimonials for infinite scroll effect
const allTestimonials = [...testimonials, ...testimonials];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  );
}

export default function SocialProof() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-900/95">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Trusted by
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> Thousands</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join the growing community of businesses optimizing their inventory operations
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">10K+</div>
            <div className="text-gray-400">Active Businesses</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">500M+</div>
            <div className="text-gray-400">Items Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-gray-400">Average Rating</div>
          </div>
        </motion.div>

        {/* Testimonials Marquee */}
        <div className="relative">
          {/* Gradient overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-gray-900 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-gray-900 to-transparent z-10 pointer-events-none" />
          
          {/* Scrolling container */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="overflow-hidden"
          >
            <motion.div
              animate={{
                x: [0, -50 * testimonials.length + '%'],
              }}
              transition={{
                x: {
                  duration: 40,
                  repeat: Infinity,
                  ease: "linear",
                },
              }}
              className="flex gap-6"
            >
              {allTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`${testimonial.id}-${index}`}
                  whileHover={{ scale: 1.02 }}
                  className="flex-shrink-0 w-[400px] bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:border-gray-600/50 transition-colors"
                >
                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-green-400/20 mb-4" />
                  
                  {/* Content */}
                  <p className="text-gray-300 mb-6 italic">"{testimonial.content}"</p>
                  
                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-700">
                        <Image
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{testimonial.name}</div>
                        <div className="text-sm text-gray-400">{testimonial.role}</div>
                      </div>
                    </div>
                    <StarRating rating={testimonial.rating} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8"
        >
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-5 h-5" />
            <span>Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-5 h-5" />
            <span>ISO 27001 Certified</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Award className="w-5 h-5" />
            <span>Industry Leader 2024</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Import missing icons
import { Shield, Lock, Award } from 'lucide-react';
