import React from 'react'
import { motion } from 'framer-motion'

const RecentActivity = ({ activities = [] }) => {
  const getColorClasses = (color) => {
    const colors = {
      green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
      yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
    }
    return colors[color] || colors.blue
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No recent activity
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-3"
        >
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColorClasses(activity.color)}`}>
            <activity.icon className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 dark:text-white">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {activity.timestamp}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default RecentActivity