'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import Image from 'next/image';

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Small Business Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: "MoneyMind transformed how I manage my business finances. The AI insights helped me cut unnecessary expenses by 30%.",
    rating: 5,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Software Engineer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: "Finally, a finance app that speaks my language. The visualizations make it so easy to track where my money goes.",
    rating: 5,
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Freelance Designer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    content: "The budgeting AI is like having a personal financial advisor. It's helped me save for my dream studio.",
    rating: 5,
  },
  {
    id: 4,
    name: 'David Thompson',
    role: 'Retired Teacher',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: "Simple, secure, and smart. MoneyMind gives me confidence in managing my retirement finances.",
    rating: 5,
  },
  {
    id: 5,
    name: 'Jessica Park',
    role: 'Marketing Manager',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    content: "The real-time alerts saved me from overdraft fees multiple times. This app pays for itself!",
    rating: 5,
  },
  {
    id: 6,
    name: 'Robert Williams',
    role: 'Restaurant Owner',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    content: "MoneyMind's AI identified seasonal spending patterns I never noticed. Game-changer for my business.",
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
            Join the growing community of people taking control of their financial future
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
            <div className="text-4xl font-bold text-white mb-2">50K+</div>
            <div className="text-gray-400">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white mb-2">$2.5M+</div>
            <div className="text-gray-400">Money Saved</div>
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
            <span>Bank-level Security</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Lock className="w-5 h-5" />
            <span>SOC2 Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Award className="w-5 h-5" />
            <span>Featured in TechCrunch</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Import missing icons
import { Shield, Lock, Award } from 'lucide-react';
