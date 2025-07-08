import React from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

const SparkplugView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sparkplug B
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor Sparkplug B devices and metrics
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
      >
        <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Sparkplug B Page
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This page will show Sparkplug B device hierarchy and metrics.
        </p>
      </motion.div>
    </div>
  )
}

export default SparkplugView