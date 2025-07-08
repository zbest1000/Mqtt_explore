import React from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Search, Filter } from 'lucide-react'

const TopicsExplorer = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Topics Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Explore MQTT topics and monitor message flow
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </button>
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            <Search className="w-4 h-4 mr-2" />
            Subscribe
          </button>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
      >
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Topics Explorer Page
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This page will show MQTT topics, subscription management, and message monitoring.
        </p>
      </motion.div>
    </div>
  )
}

export default TopicsExplorer