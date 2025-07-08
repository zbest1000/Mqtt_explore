import React from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

const DataExport = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Data Export
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Export MQTT data in various formats
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
      >
        <Download className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Data Export Page
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This page will provide data export functionality in multiple formats.
        </p>
      </motion.div>
    </div>
  )
}

export default DataExport