import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronLeft,
  ChevronRight,
  Zap,
  ExternalLink
} from 'lucide-react'

const Sidebar = ({ 
  isCollapsed, 
  onToggle, 
  navigationItems, 
  currentPath, 
  onNavigate 
}) => {
  
  const isActive = (path) => {
    if (path === '/dashboard' && currentPath === '/') return true
    return currentPath.startsWith(path)
  }

  return (
    <motion.div
      initial={false}
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ duration: 0.3 }}
      className="fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40"
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <motion.div
          initial={false}
          animate={{ opacity: isCollapsed ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                MQTT Explore
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Network Discovery Tool
              </p>
            </div>
          )}
        </motion.div>
        
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navigationItems.map((item) => {
          const isItemActive = isActive(item.path)
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative group ${
                isItemActive
                  ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              title={isCollapsed ? item.label : ''}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Icon */}
              <item.icon className={`w-5 h-5 flex-shrink-0 ${
                isItemActive ? 'text-primary-600 dark:text-primary-400' : ''
              }`} />
              
              {/* Label */}
              <motion.span
                initial={false}
                animate={{ 
                  opacity: isCollapsed ? 0 : 1,
                  width: isCollapsed ? 0 : 'auto'
                }}
                transition={{ duration: 0.2 }}
                className={`font-medium text-sm truncate ${
                  isCollapsed ? 'hidden' : 'block'
                }`}
              >
                {item.label}
              </motion.span>

              {/* Badge */}
              {!isCollapsed && item.badge && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full font-medium"
                >
                  {item.badge}
                </motion.span>
              )}

              {/* Shortcut */}
              {!isCollapsed && item.shortcut && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="ml-auto text-xs text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {item.shortcut}
                </motion.span>
              )}

              {/* Active indicator */}
              {isItemActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 dark:bg-primary-400 rounded-r"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}

              {/* Collapsed badge */}
              {isCollapsed && item.badge && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </motion.div>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 bg-primary-500 px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-200 dark:border-gray-700" />

      {/* Quick Actions */}
      <div className="p-4 space-y-2">
        {/* System Status */}
        <motion.div
          className={`flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {!isCollapsed && (
            <motion.div
              initial={false}
              animate={{ opacity: isCollapsed ? 0 : 1 }}
              className="text-xs text-gray-600 dark:text-gray-400"
            >
              <div>System Online</div>
              <div className="text-green-600 dark:text-green-400 font-medium">
                All services running
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Quick Settings */}
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <span>Auto Discovery</span>
              <div className="w-8 h-4 bg-green-500 rounded-full relative">
                <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </div>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors">
              <span>Real-time Updates</span>
              <div className="w-8 h-4 bg-green-500 rounded-full relative">
                <div className="w-3 h-3 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
              </div>
            </button>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Version 1.0.0
            </p>
            <a
              href="https://github.com/mqtt-explore"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              GitHub
            </a>
          </motion.div>
        )}
        
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center"
          >
            <a
              href="https://github.com/mqtt-explore"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="View on GitHub"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

export default Sidebar