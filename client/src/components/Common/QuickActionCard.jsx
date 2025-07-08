import React from 'react'
import { motion } from 'framer-motion'

const QuickActionCard = ({ 
  title, 
  description, 
  icon: Icon, 
  color, 
  action, 
  disabled = false 
}) => {
  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/30',
      green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30',
      orange: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/30',
      purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/30',
      red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30',
      gray: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
    }
    return colors[color] || colors.gray
  }

  return (
    <motion.button
      onClick={action}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left transition-all ${
        disabled 
          ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800' 
          : 'hover:shadow-md bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          disabled ? 'bg-gray-100 dark:bg-gray-700 text-gray-400' : getColorClasses(color)
        }`}>
          <Icon className="w-6 h-6" />
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
    </motion.button>
  )
}

export default QuickActionCard