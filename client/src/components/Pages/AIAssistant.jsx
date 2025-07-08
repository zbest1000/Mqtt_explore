import React from 'react'
import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

const AIAssistant = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            AI Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Get AI-powered insights and analysis of your MQTT data
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
      >
        <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          AI Assistant Page
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This page will provide AI-powered analysis and natural language querying.
        </p>
      </motion.div>
    </div>
  )
}

export default AIAssistant