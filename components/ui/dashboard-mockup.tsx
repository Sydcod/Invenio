'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Package, Truck, Warehouse, AlertCircle, BarChart, CheckCircle } from 'lucide-react';

export function DashboardMockup() {
  const transactions = [
    { icon: Truck, name: 'Received Shipment', amount: 125, category: 'Office Supplies' },
    { icon: Package, name: 'Order Fulfilled', amount: -85, category: 'Electronics' },
    { icon: AlertCircle, name: 'Low Stock Alert', amount: 15, category: 'Raw Materials' },
  ];

  const insights = [
    { label: 'Stock Levels', value: '1,245', trend: 'up', change: '+12%' },
    { label: 'Fulfillment Rate', value: '94%', trend: 'up', change: '+5%' },
    { label: 'Inventory Health', value: 'Good', trend: 'up', change: 'On Track' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
      className="relative max-w-4xl mx-auto mt-12"
    >
      {/* Floating AI Analysis Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          AI Monitoring Your Inventory in Real-Time
        </div>
      </motion.div>

      {/* Dashboard Container */}
      <div className="bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-800">
          <h3 className="text-xl font-semibold text-white">Inventory Overview - December 2024</h3>
          <p className="text-gray-400 text-sm mt-1">AI-powered inventory insights updated in real-time</p>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-3 gap-4 p-6 border-b border-gray-800">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 + index * 0.1 }}
              className="bg-gray-800/50 rounded-lg p-4"
            >
              <p className="text-gray-400 text-sm">{insight.label}</p>
              <div className="flex items-end justify-between mt-2">
                <span className="text-2xl font-bold text-white">{insight.value}</span>
                <div className={`flex items-center gap-1 text-sm ${
                  insight.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {insight.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span>{insight.change}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Recent Activities</h4>
          <div className="space-y-3">
            {transactions.map((transaction, index) => (
              <motion.div
                key={transaction.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 2.2 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <transaction.icon className="w-5 h-5 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{transaction.name}</p>
                    <p className="text-gray-400 text-sm">{transaction.category}</p>
                  </div>
                </div>
                <span className={`text-lg font-semibold ${
                  transaction.amount < 0 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {transaction.amount < 0 ? '-' : '+'}{Math.abs(transaction.amount)} units
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Chat Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
          className="border-t border-gray-800 p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">AI</span>
            </div>
            <div className="flex-1">
              <p className="text-gray-300 text-sm">
                "I noticed inventory levels for Electronics are 15% lower than optimal. Would you like me to generate a reorder plan?"
              </p>
            </div>
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 bg-blue-400 rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
