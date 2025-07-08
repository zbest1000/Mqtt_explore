import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Play,
  Square,
  RefreshCw,
  Wifi,
  Activity,
  MapPin,
  Clock,
  Settings,
  Filter,
  Download,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react'

// Store
import { useMQTTStore } from '../../store/mqttStore'
import { useUIStore } from '../../store/uiStore'

const NetworkDiscovery = () => {
  const { 
    discoveredBrokers, 
    isDiscovering, 
    discoveryOptions,
    setDiscovering,
    setDiscoveryOptions
  } = useMQTTStore()

  const { openModal } = useUIStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBroker, setSelectedBroker] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [sortBy, setSortBy] = useState('lastSeen')

  // Mock discovered brokers
  const mockBrokers = [
    {
      id: 'broker-1',
      host: '192.168.1.100',
      port: 1883,
      status: 'online',
      version: 'v3.1.1',
      clientId: 'mosquitto-broker',
      lastSeen: new Date(Date.now() - 2 * 60 * 1000),
      responseTime: 12,
      protocol: 'MQTT',
      secure: false,
      discoveryMethod: 'Port Scan',
      topics: 45,
      clients: 12
    },
    {
      id: 'broker-2',
      host: '192.168.1.150',
      port: 8883,
      status: 'online',
      version: 'v5.0',
      clientId: 'emqx-broker',
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      responseTime: 8,
      protocol: 'MQTT',
      secure: true,
      discoveryMethod: 'mDNS',
      topics: 120,
      clients: 34
    },
    {
      id: 'broker-3',
      host: '10.0.0.50',
      port: 1883,
      status: 'timeout',
      version: 'Unknown',
      clientId: null,
      lastSeen: new Date(Date.now() - 30 * 60 * 1000),
      responseTime: null,
      protocol: 'MQTT',
      secure: false,
      discoveryMethod: 'Network Scan',
      topics: 0,
      clients: 0
    }
  ]

  const allBrokers = Array.from(discoveredBrokers.values()).concat(mockBrokers)

  const filteredBrokers = allBrokers
    .filter(broker => {
      const matchesSearch = broker.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           broker.clientId?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterStatus === 'all' || broker.status === filterStatus
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'host':
          return a.host.localeCompare(b.host)
        case 'status':
          return a.status.localeCompare(b.status)
        case 'responseTime':
          return (a.responseTime || Infinity) - (b.responseTime || Infinity)
        case 'lastSeen':
        default:
          return new Date(b.lastSeen) - new Date(a.lastSeen)
      }
    })

  const startDiscovery = () => {
    setDiscovering(true)
    // TODO: Call API to start discovery
    console.log('Starting network discovery...')
  }

  const stopDiscovery = () => {
    setDiscovering(false)
    // TODO: Call API to stop discovery
    console.log('Stopping network discovery...')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
      case 'timeout':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
      case 'connecting':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700'
    }
  }

  const formatLastSeen = (date) => {
    const now = new Date()
    const diff = now - date
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Network Discovery
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Scan your network to discover MQTT brokers and services
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openModal('networkScan')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </button>

          {isDiscovering ? (
            <button
              onClick={stopDiscovery}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Square className="w-4 h-4" />
              Stop Discovery
            </button>
          ) : (
            <button
              onClick={startDiscovery}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Start Discovery
            </button>
          )}
        </div>
      </div>

      {/* Discovery Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${
          isDiscovering
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDiscovering ? (
              <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
            <div>
              <h3 className={`font-medium ${
                isDiscovering ? 'text-blue-800 dark:text-blue-200' : 'text-gray-900 dark:text-white'
              }`}>
                {isDiscovering ? 'Discovery in Progress' : 'Discovery Idle'}
              </h3>
              <p className={`text-sm ${
                isDiscovering ? 'text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {isDiscovering 
                  ? `Scanning ${discoveryOptions.networkRange} - ${filteredBrokers.length} brokers found`
                  : `Last scan: ${formatLastSeen(new Date(Date.now() - 10 * 60 * 1000))}`
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {filteredBrokers.filter(b => b.status === 'online').length} Online
              </span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {filteredBrokers.filter(b => b.status === 'timeout').length} Offline
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search brokers by host or client ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="online">Online</option>
          <option value="timeout">Offline</option>
          <option value="connecting">Connecting</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="lastSeen">Last Seen</option>
          <option value="host">Host</option>
          <option value="status">Status</option>
          <option value="responseTime">Response Time</option>
        </select>
      </div>

      {/* Brokers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredBrokers.map((broker, index) => (
            <motion.div
              key={broker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBroker(broker)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {broker.host}:{broker.port}
                  </h3>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(broker.status)}`}>
                  {broker.status}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Protocol:</span>
                  <span className="text-gray-900 dark:text-white">
                    {broker.protocol} {broker.version}
                    {broker.secure && (
                      <span className="ml-1 text-green-600 dark:text-green-400">🔒</span>
                    )}
                  </span>
                </div>

                {broker.clientId && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Client ID:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {broker.clientId}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Last Seen:</span>
                  <span className="text-gray-900 dark:text-white">
                    {formatLastSeen(broker.lastSeen)}
                  </span>
                </div>

                {broker.responseTime && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Response:</span>
                    <span className="text-gray-900 dark:text-white">
                      {broker.responseTime}ms
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discovery:</span>
                  <span className="text-gray-900 dark:text-white">
                    {broker.discoveryMethod}
                  </span>
                </div>

                {broker.status === 'online' && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {broker.topics}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Topics
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {broker.clients}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Clients
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  Connect
                </button>
                <button className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredBrokers.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Wifi className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No MQTT brokers found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Start a network discovery scan to find MQTT brokers'
            }
          </p>
          {!isDiscovering && !searchQuery && filterStatus === 'all' && (
            <button
              onClick={startDiscovery}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              <Search className="w-4 h-4 mr-2" />
              Start Discovery
            </button>
          )}
        </motion.div>
      )}
    </div>
  )
}

export default NetworkDiscovery