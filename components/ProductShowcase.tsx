'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Terminal, Sparkles, CheckCircle } from 'lucide-react';

const terminalSteps = [
  { 
    command: '$ moneymind analyze --file bank_statement.pdf', 
    output: 'Uploading and processing document...',
    delay: 0 
  },
  { 
    command: '', 
    output: '✓ Document uploaded successfully (2.3MB)',
    delay: 1000,
    isSuccess: true
  },
  { 
    command: '', 
    output: 'Running AI financial analysis...',
    delay: 1500 
  },
  { 
    command: '', 
    output: 'Detecting transactions: Found 247 transactions',
    delay: 2500 
  },
  { 
    command: '', 
    output: 'Categorizing expenses: Food & Dining (32%), Housing (28%), Transport (15%)...',
    delay: 3500 
  },
  { 
    command: '', 
    output: 'Identifying patterns: Recurring subscriptions detected ($127/month)',
    delay: 4500 
  },
  { 
    command: '', 
    output: '✓ Analysis complete! Opening dashboard...',
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
            See AI Analysis
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> In Action</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Watch how MoneyMind transforms your bank statements into actionable financial insights
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
                  <span>MoneyMind CLI</span>
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
              Powerful AI Features
            </h3>
            
            {[
              {
                title: 'Instant Document Processing',
                description: 'Upload PDFs, CSVs, or connect your bank directly. Our AI handles any format.',
              },
              {
                title: 'Smart Categorization',
                description: 'Automatically categorize transactions with 99% accuracy using machine learning.',
              },
              {
                title: 'Pattern Recognition',
                description: 'Discover spending patterns, recurring charges, and optimization opportunities.',
              },
              {
                title: 'Predictive Insights',
                description: 'Get alerts about upcoming bills and personalized saving recommendations.',
              },
              {
                title: 'Natural Language Queries',
                description: 'Ask questions like "How much did I spend on coffee last month?" in plain English.',
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
