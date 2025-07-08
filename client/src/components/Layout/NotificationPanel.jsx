import React from 'react'
import { motion } from 'framer-motion'
import { 
  X,
  Bell,
  AlertTriangle,
  CheckCircle,
  Info,
  Wifi,
  Activity
} from 'lucide-react'

const NotificationPanel = ({ onClose }) => {
  // Mock notifications
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Broker Connected',
      message: 'Successfully connected to MQTT broker at 192.168.1.100:1883',
      timestamp: '2 minutes ago',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'info',
      title: 'Network Discovery Complete',
      message: 'Found 3 new MQTT brokers on the network',
      timestamp: '5 minutes ago',
      icon: Wifi
    },
    {
      id: 3,
      type: 'warning',
      title: 'High Message Volume',
      message: 'Receiving 1,000+ messages per second on topic/sensors/#',
      timestamp: '10 minutes ago',
      icon: AlertTriangle
    }
  ]

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      default:
        return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end pt-20 pr-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-96 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex gap-3">
                <div className={`flex-shrink-0 p-2 rounded-lg ${getTypeStyles(notification.type)}`}>
                  <notification.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {notification.timestamp}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
            View All Notifications
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default NotificationPanel