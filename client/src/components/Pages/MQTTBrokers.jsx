import React from 'react'
import { motion } from 'framer-motion'
import { Activity, Plus, Settings } from 'lucide-react'

const MQTTBrokers = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            MQTT Brokers
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your MQTT broker connections and monitor activity
          </p>
        </div>
        <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Broker
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center"
      >
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          MQTT Brokers Page
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          This page will show connected MQTT brokers and their status.
        </p>
      </motion.div>
    </div>
  )
}

export default MQTTBrokers