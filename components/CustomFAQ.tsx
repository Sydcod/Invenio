'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "How secure is my financial data?",
    answer: "We use bank-level 256-bit encryption and are SOC2 compliant. Your data is encrypted both in transit and at rest. We never store your banking credentials - all connections are made through secure OAuth protocols."
  },
  {
    question: "Which banks do you support?",
    answer: "MoneyMind supports over 12,000 financial institutions across the US and Canada, including all major banks and credit unions. We use Plaid for secure bank connections, ensuring compatibility with 99% of financial institutions."
  },
  {
    question: "Can I try MoneyMind before subscribing?",
    answer: "Absolutely! We offer a 30-day free trial with full access to all Pro features. No credit card required to start. You can also use our free Starter plan indefinitely with basic features."
  },
  {
    question: "How does the AI analysis work?",
    answer: "Our AI uses advanced machine learning algorithms trained on millions of anonymized transactions. It categorizes expenses, identifies patterns, detects anomalies, and provides personalized insights based on your unique financial behavior."
  },
  {
    question: "Can I export my data?",
    answer: "Yes! Pro and Business users can export all their data in multiple formats including CSV, Excel, and PDF. You own your data and can download it anytime. We also provide API access for Business users."
  },
  {
    question: "What if I need help?",
    answer: "We're here for you! Free users get email support, Pro users get priority support with <24hr response time, and Business users get a dedicated account manager. We also have extensive documentation and video tutorials."
  },
  {
    question: "Can I cancel anytime?",
    answer: "Yes, you can cancel your subscription anytime with no penalties. If you cancel, you'll retain access until the end of your billing period. We also offer a 30-day money-back guarantee if you're not satisfied."
  },
  {
    question: "Do you sell my data?",
    answer: "Never. Your privacy is our priority. We don't sell, rent, or share your personal financial data with third parties. We make money from subscriptions, not from your data. Read our privacy policy for full details."
  }
];

export default function CustomFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-4 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 to-gray-900 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> Questions</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Everything you need to know about MoneyMind
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05, duration: 0.5 }}
            >
              <motion.button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className={`
                  rounded-lg border transition-all duration-300
                  ${openIndex === index
                    ? 'border-green-500/50 bg-gray-800/50'
                    : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600/50'
                  }
                `}>
                  <div className="p-6 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white pr-4">
                      {faq.question}
                    </h3>
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                      ${openIndex === index
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gray-700'
                      }
                    `}>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {openIndex === index ? (
                          <Minus className="w-4 h-4 text-white" />
                        ) : (
                          <Plus className="w-4 h-4 text-white" />
                        )}
                      </motion.div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6">
                          <p className="text-gray-400 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>

        {/* Contact Support */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-gray-400 mb-4">
            Still have questions? We're here to help.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors duration-300"
          >
            Contact Support
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
