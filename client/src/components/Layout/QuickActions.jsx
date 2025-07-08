import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  ArrowRight,
  Command,
  Hash,
  Play,
  Square,
  Plus,
  Download,
  Settings,
  HelpCircle
} from 'lucide-react'

const QuickActions = ({ onClose, navigationItems, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Quick actions
  const quickActions = [
    {
      id: 'start-discovery',
      title: 'Start Network Discovery',
      description: 'Begin scanning for MQTT brokers',
      icon: Play,
      shortcut: '⌘D',
      action: () => console.log('Start discovery')
    },
    {
      id: 'stop-discovery',
      title: 'Stop Network Discovery',
      description: 'Stop the current discovery scan',
      icon: Square,
      shortcut: '⌘⇧D',
      action: () => console.log('Stop discovery')
    },
    {
      id: 'connect-broker',
      title: 'Connect to Broker',
      description: 'Add a new MQTT broker connection',
      icon: Plus,
      shortcut: '⌘N',
      action: () => console.log('Connect broker')
    },
    {
      id: 'export-data',
      title: 'Export Data',
      description: 'Export current MQTT data',
      icon: Download,
      shortcut: '⌘E',
      action: () => console.log('Export data')
    },
    {
      id: 'open-settings',
      title: 'Open Settings',
      description: 'Configure application preferences',
      icon: Settings,
      shortcut: '⌘,',
      action: () => console.log('Open settings')
    },
    {
      id: 'help',
      title: 'Help & Documentation',
      description: 'View help and documentation',
      icon: HelpCircle,
      shortcut: '⌘?',
      action: () => console.log('Open help')
    }
  ]

  // Filter items based on search
  const filteredItems = React.useMemo(() => {
    const query = searchQuery.toLowerCase()
    
    const navigation = navigationItems
      .filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query)
      )
      .map(item => ({
        ...item,
        type: 'navigation',
        description: `Navigate to ${item.label}`,
        action: () => onNavigate(item.path)
      }))

    const actions = quickActions
      .filter(action => 
        action.title.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query)
      )
      .map(action => ({
        ...action,
        type: 'action'
      }))

    return [...navigation, ...actions]
  }, [searchQuery, navigationItems, quickActions, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredItems.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredItems.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (filteredItems[selectedIndex]) {
            filteredItems[selectedIndex].action()
            onClose()
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filteredItems, onClose])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for actions or navigate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-0 focus:outline-none text-lg"
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No results found' : 'Start typing to search...'}
              </p>
            </div>
          ) : (
            <div className="p-2">
              {filteredItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    item.action()
                    onClose()
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-left transition-colors ${
                    index === selectedIndex
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${
                    item.type === 'navigation'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate">
                        {item.title || item.label}
                      </h3>
                      {item.type === 'navigation' && (
                        <Hash className="w-3 h-3 text-gray-400" />
                      )}
                      {item.type === 'action' && (
                        <Command className="w-3 h-3 text-gray-400" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {item.description}
                    </p>
                  </div>

                  {/* Shortcut */}
                  {item.shortcut && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {item.shortcut.split('').map((key, i) => (
                        <kbd
                          key={i}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  )}

                  {/* Arrow */}
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↓</kbd>
                <span>to navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">↵</kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded">esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default QuickActions