'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    icon: Zap,
    price: 0,
    description: 'Perfect for getting started with financial clarity',
    features: [
      'Connect 1 bank account',
      'Basic expense tracking',
      'Monthly spending reports',
      'Email support',
      '30-day transaction history',
    ],
    cta: 'Start Free',
    popular: false,
    gradient: 'from-gray-500 to-gray-600',
  },
  {
    name: 'Pro',
    icon: Sparkles,
    price: 12,
    description: 'Everything you need to master your finances',
    features: [
      'Unlimited bank accounts',
      'AI-powered insights',
      'Custom budget goals',
      'Real-time alerts',
      'Unlimited transaction history',
      'Priority support',
      'Export to Excel/CSV',
    ],
    cta: 'Start Pro Trial',
    popular: true,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    name: 'Business',
    icon: Crown,
    price: 49,
    description: 'Advanced features for businesses and power users',
    features: [
      'Everything in Pro',
      'Team collaboration',
      'Advanced analytics',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
    ],
    cta: 'Contact Sales',
    popular: false,
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function CustomPricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-gradient-to-b from-gray-900 to-gray-900/95">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Simple, Transparent
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500"> Pricing</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Choose the perfect plan for your financial journey. No hidden fees, cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-white' : 'text-gray-400'}`}>
              Monthly
            </span>
            <motion.button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 bg-gray-700 rounded-full p-1"
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="w-6 h-6 bg-white rounded-full"
                animate={{ x: billingCycle === 'monthly' ? 0 : 32 }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </motion.button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-white' : 'text-gray-400'}`}>
              Yearly
              <span className="text-green-400 ml-1">(Save 20%)</span>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="relative"
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
              )}

              <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                className={`
                  relative h-full bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8
                  border ${plan.popular ? 'border-green-500/50' : 'border-gray-700/50'}
                  hover:border-gray-600/50 transition-all duration-300
                `}
              >
                {/* Plan Icon */}
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-6`}>
                  <plan.icon className="w-6 h-6 text-white" />
                </div>

                {/* Plan Name & Price */}
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-white">
                    ${billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}
                  </span>
                  <span className="text-gray-400 ml-2">
                    /{billingCycle === 'yearly' ? 'month' : 'month'}
                  </span>
                  {billingCycle === 'yearly' && plan.price > 0 && (
                    <div className="text-sm text-green-400 mt-1">
                      ${Math.floor(plan.price * 0.8 * 12)} billed yearly
                    </div>
                  )}
                </div>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300
                    ${plan.popular
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                    }
                  `}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Money Back Guarantee */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-center mt-16"
        >
          <div className="inline-flex items-center gap-2 text-gray-400">
            <Check className="w-5 h-5 text-green-400" />
            <span>30-day money-back guarantee • No questions asked</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
