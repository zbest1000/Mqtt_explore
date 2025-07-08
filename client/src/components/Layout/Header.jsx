import React from 'react'
import { motion } from 'framer-motion'
import {
  Menu,
  Search,
  Bell,
  Settings,
  RefreshCw,
  Activity,
  Wifi,
  MessageCircle,
  Database,
  Clock,
  Users
} from 'lucide-react'

const Header = ({ 
  currentPage, 
  isConnected, 
  connectionStatus, 
  onToggleSidebar, 
  onOpenSettings, 
  onOpenNotifications,
  stats 
}) => {
  
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-600 dark:text-green-400'
      case 'connecting': return 'text-yellow-600 dark:text-yellow-400'
      case 'error': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-6 py-4">
        
        {/* Left Section - Page Info */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-gradient-to-br ${
              currentPage.id === 'dashboard' ? 'from-blue-500 to-blue-600' :
              currentPage.id === 'discovery' ? 'from-green-500 to-green-600' :
              currentPage.id === 'brokers' ? 'from-purple-500 to-purple-600' :
              currentPage.id === 'topics' ? 'from-orange-500 to-orange-600' :
              currentPage.id === 'sparkplug' ? 'from-yellow-500 to-yellow-600' :
              currentPage.id === 'ai' ? 'from-pink-500 to-pink-600' :
              'from-gray-500 to-gray-600'
            }`}>
              <currentPage.icon className="w-5 h-5 text-white" />
            </div>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentPage.label}
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>Dashboard</span>
                <span>/</span>
                <span>{currentPage.label}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Section - Stats */}
        <div className="hidden md:flex items-center gap-6">
          {/* Connection Status */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'connecting' ? 'Connecting' :
               'Disconnected'}
            </span>
          </motion.div>

          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {formatNumber(stats.totalBrokers)} Brokers
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {formatNumber(stats.totalConnections)} Active
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {formatNumber(stats.totalTopics)} Topics
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-gray-600 dark:text-gray-300">
                {formatNumber(stats.totalMessages)} Messages
              </span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions */}
        <div className="flex items-center gap-2">
          {/* Messages per second indicator */}
          {stats.messagesPerSecond > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full text-sm font-medium"
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {formatNumber(stats.messagesPerSecond)}/s
            </motion.div>
          )}

          {/* Search Button */}
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Search (⌘/)"
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Refresh Button */}
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Notifications */}
          <button
            onClick={onOpenNotifications}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            {/* Notification badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
            >
              3
            </motion.div>
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Admin
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Local User
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Stats Bar */}
      <div className="md:hidden px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Wifi className="w-3 h-3 text-gray-500" />
              <span>{stats.totalBrokers}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-gray-500" />
              <span>{stats.totalConnections}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3 h-3 text-gray-500" />
              <span>{stats.totalTopics}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'connecting' ? 'bg-yellow-500' :
              'bg-red-500'
            }`} />
            <span className={getConnectionStatusColor()}>
              {connectionStatus === 'connected' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header