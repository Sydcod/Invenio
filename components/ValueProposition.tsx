'use client';

import { motion } from 'framer-motion';
import { 
  Package, 
  BarChart3, 
  Zap, 
  TrendingUp, 
  Warehouse, 
  Bell,
  Sparkles,
  Target
} from 'lucide-react';

const features = [
  {
    icon: Package,
    title: 'Real-Time Tracking',
    description: 'Monitor inventory levels across all locations instantly. Know exactly what you have, where it is, and when to reorder.',
    gradient: 'from-blue-500 to-purple-500',
    size: 'large'
  },
  {
    icon: Warehouse,
    title: 'Multi-Location Control',
    description: 'Manage inventory across warehouses, stores, and fulfillment centers from one unified dashboard.',
    gradient: 'from-green-500 to-emerald-500',
    size: 'medium'
  },
  {
    icon: Zap,
    title: 'Smart Reordering',
    description: 'Automated purchase orders based on reorder points, lead times, and demand forecasting.',
    gradient: 'from-yellow-500 to-orange-500',
    size: 'medium'
  },
  {
    icon: TrendingUp,
    title: 'Demand Forecasting',
    description: 'AI-powered predictions help you stock the right products at the right time.',
    gradient: 'from-pink-500 to-rose-500',
    size: 'small'
  },
  {
    icon: BarChart3,
    title: 'Powerful Analytics',
    description: 'Comprehensive reports on inventory turnover, carrying costs, and performance metrics.',
    gradient: 'from-indigo-500 to-blue-500',
    size: 'small'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get notified about low stock, overstock situations, and expiring products.',
    gradient: 'from-purple-500 to-pink-500',
    size: 'small'
  }
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  }
};

export default function ValueProposition() {
  return (
    <section className="py-24 px-4 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/95 to-gray-900 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> Master Your Inventory</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Powerful features designed to streamline your supply chain and optimize your operations
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]"
        >
          {features.map((feature, index) => {
            const isLarge = feature.size === 'large';
            const isMedium = feature.size === 'medium';
            
            return (
              <motion.div
                key={feature.title}
                variants={item}
                className={`
                  relative group overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm border border-gray-700/50
                  hover:border-gray-600/50 transition-all duration-300 cursor-pointer
                  ${isLarge ? 'md:col-span-2 md:row-span-2' : ''}
                  ${isMedium ? 'md:col-span-1 md:row-span-2' : ''}
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="relative h-full p-6 flex flex-col justify-between">
                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} 
                    flex items-center justify-center text-white shadow-lg
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  
                  {/* Text */}
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-blue-500 transition-all duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  
                  {/* Decorative elements for larger cards */}
                  {(isLarge || isMedium) && (
                    <div className="absolute top-4 right-4 opacity-10">
                      <Sparkles className="w-24 h-24" />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-gray-400 mb-6">
            Join thousands of businesses already optimizing their inventory operations
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Start Your Free Trial
            <Target className="inline-block w-5 h-5 ml-2" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
