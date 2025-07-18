'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function CustomCTA() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-900/95 pointer-events-none" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-1/2 -right-1/2 w-full h-full"
        >
          <div className="w-full h-full bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-3xl" />
        </motion.div>
        <motion.div
          animate={{
            rotate: [360, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full"
        >
          <div className="w-full h-full bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full blur-3xl" />
        </motion.div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-full px-4 py-2 mb-8"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-sm text-gray-300">Join 50,000+ users transforming their finances</span>
          </motion.div>

          {/* Main Heading */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Take Control of
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
              Your Financial Future?
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Start your journey to financial clarity today. No credit card required, 
            cancel anytime, and see results in minutes.
          </p>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-6 mb-10 text-sm text-gray-300"
          >
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> 30-day free trial
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> No credit card needed
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> 5-minute setup
            </span>
            <span className="flex items-center gap-2">
              <span className="text-green-400">✓</span> Cancel anytime
            </span>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {/* Primary CTA */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Your Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500"
                initial={{ x: '100%' }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            {/* Secondary CTA */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Schedule a Demo
            </motion.button>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-12 flex items-center justify-center gap-8"
          >
            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <span className="text-gray-400 text-sm">4.9/5 from 2,000+ reviews</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
