'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    question: "How does real-time inventory tracking work?",
    answer: "Invenio syncs with your existing systems via API or direct integrations. Every transaction, movement, or adjustment is instantly reflected across all locations. Our system supports barcode scanners, RFID readers, and mobile devices for seamless tracking."
  },
  {
    question: "Can I manage multiple warehouse locations?",
    answer: "Yes! Professional and Enterprise plans support multiple locations. You can track inventory across warehouses, retail stores, and fulfillment centers from one dashboard. Transfer stock between locations with full audit trails."
  },
  {
    question: "What integrations do you support?",
    answer: "Invenio integrates with major e-commerce platforms (Shopify, WooCommerce, Amazon), accounting software (QuickBooks, Xero), shipping providers (FedEx, UPS), and ERPs. We also offer REST API for custom integrations."
  },
  {
    question: "How does the smart reordering system work?",
    answer: "Our AI analyzes your sales history, seasonality patterns, and lead times to calculate optimal reorder points. When stock hits these levels, we can automatically generate purchase orders or send alerts based on your preferences."
  },
  {
    question: "Can I import my existing inventory data?",
    answer: "Absolutely! We support bulk imports via CSV, Excel, or direct database migration. Our onboarding team helps ensure smooth data transfer. You can also use our API for programmatic imports."
  },
  {
    question: "What kind of reports can I generate?",
    answer: "Generate comprehensive reports on inventory valuation, turnover rates, aging analysis, ABC classification, and more. All reports are customizable and can be scheduled for automatic delivery to stakeholders."
  },
  {
    question: "Is there a mobile app?",
    answer: "Yes! Our mobile apps for iOS and Android support barcode scanning, stock counts, transfers, and receiving. Perfect for warehouse staff to update inventory on the go. Offline mode ensures continuity even without internet."
  },
  {
    question: "How secure is my inventory data?",
    answer: "We use enterprise-grade security with 256-bit encryption, ISO 27001 certification, and regular security audits. Role-based access control ensures team members only see what they need. All data is backed up hourly."
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
            Everything you need to know about Invenio
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
