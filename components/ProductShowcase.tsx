'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Terminal, Sparkles, CheckCircle, Package, BarChart3 } from 'lucide-react';

const terminalSteps = [
  { 
    command: '$ invenio sync --location warehouse-01', 
    output: 'Connecting to warehouse management system...',
    delay: 0 
  },
  { 
    command: '', 
    output: '✓ Connected successfully (3 locations found)',
    delay: 1000,
    isSuccess: true
  },
  { 
    command: '', 
    output: 'Scanning inventory levels...',
    delay: 1500 
  },
  { 
    command: '', 
    output: 'Items tracked: 15,247 SKUs across 3 locations',
    delay: 2500 
  },
  { 
    command: '', 
    output: 'Low stock alerts: 23 items below reorder point',
    delay: 3500 
  },
  { 
    command: '', 
    output: 'Generating purchase orders: 12 POs created ($45,230)',
    delay: 4500 
  },
  { 
    command: '', 
    output: '✓ Inventory sync complete! Opening dashboard...',
    delay: 5500,
    isSuccess: true
  },
];

export default function ProductShowcase() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < terminalSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Reset animation after a pause
        setTimeout(() => {
          setCurrentStep(0);
        }, 3000);
      }
    }, terminalSteps[currentStep].delay || 1000);

    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 to-gray-900 pointer-events-none" />
      
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
            See Inventory Control
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> In Action</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how Invenio transforms complex inventory operations into simple, automated workflows
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Terminal Animation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="bg-gray-900 rounded-lg border border-gray-800 shadow-2xl overflow-hidden">
              {/* Terminal Header */}
              <div className="bg-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Terminal className="w-4 h-4" />
                  <span>Invenio CLI</span>
                </div>
              </div>
              
              {/* Terminal Content */}
              <div className="p-6 font-mono text-sm">
                <div className="space-y-3">
                  {terminalSteps.slice(0, currentStep + 1).map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.command && (
                        <div className="text-green-400">{step.command}</div>
                      )}
                      <div className={`${
                        step.isSuccess ? 'text-green-400' : 'text-gray-300'
                      } ${step.command ? 'ml-4' : ''}`}>
                        {step.output}
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Blinking cursor */}
                  <motion.span
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="inline-block w-2 h-4 bg-green-400"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Feature List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-bold text-white mb-6">
              Enterprise-Grade Features
            </h3>
            
            {[
              {
                title: 'Real-Time Synchronization',
                description: 'Instant updates across all locations. Know your exact inventory levels at any moment.',
              },
              {
                title: 'Smart Reorder Points',
                description: 'AI-powered reordering based on historical data, seasonality, and lead times.',
              },
              {
                title: 'Barcode & RFID Support',
                description: 'Seamless integration with barcode scanners and RFID systems for fast tracking.',
              },
              {
                title: 'Demand Forecasting',
                description: 'Predict future inventory needs with machine learning algorithms.',
              },
              {
                title: 'Multi-Channel Integration',
                description: 'Connect your e-commerce, POS, and ERP systems for unified inventory control.',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                className="flex gap-4"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">{feature.title}</h4>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.4 }}
              className="pt-6"
            >
              <button className="group relative px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                <span className="relative z-10 flex items-center gap-2">
                  Try It Yourself
                  <Sparkles className="w-5 h-5" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-500"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
