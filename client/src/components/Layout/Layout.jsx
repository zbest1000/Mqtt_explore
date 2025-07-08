import React, { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  Search,
  Bell,
  Settings,
  User,
  Home,
  Wifi,
  Activity,
  MessageCircle,
  Zap,
  Bot,
  Download,
  ChevronDown,
  Monitor,
  Sun,
  Moon,
  Layers
} from 'lucide-react'

// Components
import Sidebar from './Sidebar'
import Header from './Header'
import NotificationPanel from './NotificationPanel'
import QuickActions from './QuickActions'

// Store
import { useUIStore } from '../../store/uiStore'
import { useAppStore } from '../../store/appStore'
import { useMQTTStore } from '../../store/mqttStore'

const Layout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  // Store hooks
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    theme,
    setTheme,
    panels,
    togglePanel,
    modals,
    openModal,
    closeModal
  } = useUIStore()
  
  const {
    isConnected,
    connectionStatus,
    getConnectionStatusColor,
    getConnectionStatusText
  } = useAppStore()
  
  const { stats } = useMQTTStore()

  // Local state
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'k':
            e.preventDefault()
            setShowQuickActions(true)
            break
          case 'b':
            e.preventDefault()
            setSidebarCollapsed(!sidebarCollapsed)
            break
          case '/':
            e.preventDefault()
            document.getElementById('global-search')?.focus()
            break
        }
      }
      
      // Escape key
      if (e.key === 'Escape') {
        setShowQuickActions(false)
        setShowNotifications(false)
        closeModal()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [sidebarCollapsed, setSidebarCollapsed, closeModal])

  // Navigation items
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      path: '/dashboard',
      shortcut: '⌘1'
    },
    {
      id: 'discovery',
      label: 'Network Discovery',
      icon: Wifi,
      path: '/discovery',
      shortcut: '⌘2',
      badge: stats.totalBrokers > 0 ? stats.totalBrokers : null
    },
    {
      id: 'brokers',
      label: 'MQTT Brokers',
      icon: Activity,
      path: '/brokers',
      shortcut: '⌘3',
      badge: stats.totalConnections > 0 ? stats.totalConnections : null
    },
    {
      id: 'topics',
      label: 'Topics Explorer',
      icon: MessageCircle,
      path: '/topics',
      shortcut: '⌘4',
      badge: stats.totalTopics > 0 ? stats.totalTopics : null
    },
    {
      id: 'sparkplug',
      label: 'Sparkplug B',
      icon: Zap,
      path: '/sparkplug',
      shortcut: '⌘5'
    },
    {
      id: 'ai',
      label: 'AI Assistant',
      icon: Bot,
      path: '/ai',
      shortcut: '⌘6'
    },
    {
      id: 'export',
      label: 'Data Export',
      icon: Download,
      path: '/export',
      shortcut: '⌘7'
    }
  ]

  // Get current page info
  const getCurrentPage = () => {
    const path = location.pathname.substring(1) || 'dashboard'
    return navigationItems.find(item => item.id === path) || navigationItems[0]
  }

  const currentPage = getCurrentPage()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={setSidebarCollapsed}
        navigationItems={navigationItems}
        currentPath={location.pathname}
        onNavigate={navigate}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        
        {/* Header */}
        <Header
          currentPage={currentPage}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onOpenSettings={() => openModal('settings')}
          onOpenNotifications={() => setShowNotifications(true)}
          stats={stats}
        />

        {/* Page Content */}
        <main className="p-6">
          <div className="max-w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Quick Actions Modal */}
      <AnimatePresence>
        {showQuickActions && (
          <QuickActions
            onClose={() => setShowQuickActions(false)}
            navigationItems={navigationItems}
            onNavigate={(path) => {
              navigate(path)
              setShowQuickActions(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Notification Panel */}
      <AnimatePresence>
        {showNotifications && (
          <NotificationPanel
            onClose={() => setShowNotifications(false)}
          />
        )}
      </AnimatePresence>

      {/* Global Search Overlay */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
            onClick={() => setSearchQuery('')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search brokers, topics, messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    autoFocus
                  />
                </div>
                
                {/* Search Results */}
                <div className="mt-4 max-h-96 overflow-y-auto">
                  <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
                    Start typing to search across all MQTT data...
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {modals.settings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => closeModal('settings')}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>
                <button
                  onClick={() => closeModal('settings')}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                {/* Quick Settings */}
                <div className="space-y-6">
                  {/* Theme Settings */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Appearance
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { value: 'light', icon: Sun, label: 'Light' },
                        { value: 'dark', icon: Moon, label: 'Dark' },
                        { value: 'auto', icon: Monitor, label: 'Auto' }
                      ].map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={() => setTheme(themeOption.value)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                            theme === themeOption.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          }`}
                        >
                          <themeOption.icon className="w-6 h-6" />
                          <span className="text-sm font-medium">
                            {themeOption.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Panel Controls */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Panels
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(panels).map(([panel, visible]) => (
                        <label
                          key={panel}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <span className="text-sm font-medium capitalize">
                            {panel.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={() => togglePanel(panel)}
                            className="rounded text-primary-600 focus:ring-primary-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Status Indicator */}
      <div className="fixed bottom-4 right-4 z-30">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium shadow-lg ${
            connectionStatus === 'connected'
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected'
              ? 'bg-green-500 animate-pulse'
              : connectionStatus === 'connecting'
              ? 'bg-yellow-500 animate-spin'
              : 'bg-red-500'
          }`} />
          {getConnectionStatusText()}
        </motion.div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="fixed bottom-4 left-4 z-30">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 text-xs text-gray-600 dark:text-gray-400"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3" />
            <span>Press</span>
            <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">⌘K</kbd>
            <span>for quick actions</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Layout