import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useMQTTStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // Discovery state
        discoveredBrokers: new Map(),
        isDiscovering: false,
        discoveryOptions: {
          networkRange: '192.168.1.0/24',
          portRange: '1883,8883,1884,8884,1888,8888',
          timeout: 5000,
          enableMDNS: true,
          enableSSDP: true,
          enablePortScan: true,
          enableFingerprinting: true
        },

        // Connected brokers
        connectedBrokers: new Map(),
        brokerConnections: new Map(), // brokerId -> connection details

        // Topics and messages
        topicsByBroker: new Map(), // brokerId -> Map(topic -> info)
        messagesByBroker: new Map(), // brokerId -> array of messages
        messageBuffer: new Map(), // Recent messages for performance

        // Subscriptions
        subscriptionsByBroker: new Map(), // brokerId -> Set(topic)

        // Sparkplug B data
        sparkplugGroups: new Map(), // groupId -> group data
        sparkplugDevices: new Map(), // deviceId -> device data
        sparkplugMetrics: [],

        // Statistics
        stats: {
          totalBrokers: 0,
          totalConnections: 0,
          totalTopics: 0,
          totalMessages: 0,
          messagesPerSecond: 0,
          bytesTransferred: 0,
          errors: 0
        },

        // Network scan results
        networkScanResults: new Map(),
        lastNetworkScan: null,

        // Actions - Discovery
        setDiscovering: (isDiscovering) => set({ isDiscovering }),

        setDiscoveryOptions: (options) =>
          set(state => ({
            discoveryOptions: { ...state.discoveryOptions, ...options }
          })),

        addBroker: (broker) => {
          const brokers = new Map(get().discoveredBrokers)
          brokers.set(broker.id, broker)
          set({ discoveredBrokers: brokers })
          get().updateStats()
        },

        updateBroker: (brokerId, updates) => {
          const brokers = new Map(get().discoveredBrokers)
          const connections = new Map(get().brokerConnections)
          
          if (brokers.has(brokerId)) {
            brokers.set(brokerId, { ...brokers.get(brokerId), ...updates })
          }
          
          if (connections.has(brokerId)) {
            connections.set(brokerId, { ...connections.get(brokerId), ...updates })
          }
          
          set({ 
            discoveredBrokers: brokers,
            brokerConnections: connections
          })
          get().updateStats()
        },

        removeBroker: (brokerId) => {
          const brokers = new Map(get().discoveredBrokers)
          const connections = new Map(get().brokerConnections)
          const topics = new Map(get().topicsByBroker)
          const messages = new Map(get().messagesByBroker)
          const subscriptions = new Map(get().subscriptionsByBroker)
          
          brokers.delete(brokerId)
          connections.delete(brokerId)
          topics.delete(brokerId)
          messages.delete(brokerId)
          subscriptions.delete(brokerId)
          
          set({
            discoveredBrokers: brokers,
            brokerConnections: connections,
            topicsByBroker: topics,
            messagesByBroker: messages,
            subscriptionsByBroker: subscriptions
          })
          get().updateStats()
        },

        // Actions - Connections
        addConnection: (brokerId, connectionInfo) => {
          const connections = new Map(get().brokerConnections)
          connections.set(brokerId, connectionInfo)
          set({ brokerConnections: connections })
          get().updateStats()
        },

        updateConnection: (brokerId, updates) => {
          const connections = new Map(get().brokerConnections)
          if (connections.has(brokerId)) {
            connections.set(brokerId, { ...connections.get(brokerId), ...updates })
            set({ brokerConnections: connections })
          }
        },

        removeConnection: (brokerId) => {
          const connections = new Map(get().brokerConnections)
          connections.delete(brokerId)
          set({ brokerConnections: connections })
          get().updateStats()
        },

        // Actions - Topics
        updateTopics: (brokerId, topicUpdates) => {
          const topics = new Map(get().topicsByBroker)
          const brokerTopics = topics.get(brokerId) || new Map()
          
          Object.entries(topicUpdates).forEach(([topic, info]) => {
            brokerTopics.set(topic, info)
          })
          
          topics.set(brokerId, brokerTopics)
          set({ topicsByBroker: topics })
          get().updateStats()
        },

        removeTopic: (brokerId, topic) => {
          const topics = new Map(get().topicsByBroker)
          const brokerTopics = topics.get(brokerId)
          
          if (brokerTopics) {
            brokerTopics.delete(topic)
            topics.set(brokerId, brokerTopics)
            set({ topicsByBroker: topics })
          }
        },

        // Actions - Messages
        addMessage: (brokerId, message) => {
          const messages = new Map(get().messagesByBroker)
          const brokerMessages = messages.get(brokerId) || []
          
          // Add message
          brokerMessages.push(message)
          
          // Keep only recent messages (last 1000 per broker)
          if (brokerMessages.length > 1000) {
            brokerMessages.splice(0, brokerMessages.length - 1000)
          }
          
          messages.set(brokerId, brokerMessages)
          set({ messagesByBroker: messages })
          
          // Update Sparkplug data if applicable
          if (message.sparkplug) {
            get().updateSparkplugData(message)
          }
          
          get().updateStats()
        },

        addMessages: (brokerId, newMessages) => {
          const messages = new Map(get().messagesByBroker)
          const brokerMessages = messages.get(brokerId) || []
          
          brokerMessages.push(...newMessages)
          
          // Keep only recent messages
          if (brokerMessages.length > 1000) {
            brokerMessages.splice(0, brokerMessages.length - 1000)
          }
          
          messages.set(brokerId, brokerMessages)
          set({ messagesByBroker: messages })
          
          // Process Sparkplug messages
          newMessages.forEach(message => {
            if (message.sparkplug) {
              get().updateSparkplugData(message)
            }
          })
          
          get().updateStats()
        },

        clearMessages: (brokerId) => {
          const messages = new Map(get().messagesByBroker)
          if (brokerId) {
            messages.set(brokerId, [])
          } else {
            messages.clear()
          }
          set({ messagesByBroker: messages })
        },

        // Actions - Subscriptions
        addSubscription: (brokerId, topic) => {
          const subscriptions = new Map(get().subscriptionsByBroker)
          const brokerSubs = subscriptions.get(brokerId) || new Set()
          brokerSubs.add(topic)
          subscriptions.set(brokerId, brokerSubs)
          set({ subscriptionsByBroker: subscriptions })
        },

        removeSubscription: (brokerId, topic) => {
          const subscriptions = new Map(get().subscriptionsByBroker)
          const brokerSubs = subscriptions.get(brokerId)
          if (brokerSubs) {
            brokerSubs.delete(topic)
            subscriptions.set(brokerId, brokerSubs)
            set({ subscriptionsByBroker: subscriptions })
          }
        },

        // Actions - Sparkplug B
        updateSparkplugData: (message) => {
          if (!message.sparkplug || !message.topic) return

          const topicParts = message.topic.split('/')
          if (topicParts.length < 4 || topicParts[0] !== 'spBv1.0') return

          const groupId = topicParts[1]
          const messageType = topicParts[2]
          const edgeNodeId = topicParts[3]
          const deviceId = topicParts.length > 4 ? topicParts.slice(4).join('/') : null

          const groups = new Map(get().sparkplugGroups)
          const devices = new Map(get().sparkplugDevices)
          
          // Update group
          if (!groups.has(groupId)) {
            groups.set(groupId, {
              id: groupId,
              edgeNodes: new Map(),
              lastActivity: message.timestamp,
              messageCount: 0
            })
          }
          
          const group = groups.get(groupId)
          group.lastActivity = message.timestamp
          group.messageCount++

          // Update edge node
          if (!group.edgeNodes.has(edgeNodeId)) {
            group.edgeNodes.set(edgeNodeId, {
              id: edgeNodeId,
              groupId,
              devices: new Map(),
              lastActivity: message.timestamp,
              messageCount: 0,
              status: 'unknown'
            })
          }

          const edgeNode = group.edgeNodes.get(edgeNodeId)
          edgeNode.lastActivity = message.timestamp
          edgeNode.messageCount++

          // Update device if present
          if (deviceId) {
            const deviceKey = `${groupId}/${edgeNodeId}/${deviceId}`
            
            if (!devices.has(deviceKey)) {
              devices.set(deviceKey, {
                id: deviceId,
                groupId,
                edgeNodeId,
                lastActivity: message.timestamp,
                messageCount: 0,
                metrics: new Map(),
                status: 'unknown'
              })
            }

            const device = devices.get(deviceKey)
            device.lastActivity = message.timestamp
            device.messageCount++

            // Update device in edge node
            edgeNode.devices.set(deviceId, device)
          }

          // Process metrics
          if (message.sparkplug.metrics) {
            const metrics = [...get().sparkplugMetrics]
            message.sparkplug.metrics.forEach(metric => {
              metrics.push({
                ...metric,
                timestamp: message.timestamp,
                groupId,
                edgeNodeId,
                deviceId,
                messageType
              })
            })
            
            // Keep only recent metrics (last 10000)
            if (metrics.length > 10000) {
              metrics.splice(0, metrics.length - 10000)
            }
            
            set({ sparkplugMetrics: metrics })
          }

          set({ 
            sparkplugGroups: groups,
            sparkplugDevices: devices
          })
        },

        // Actions - Network Scanning
        setNetworkScanResults: (scanId, results) => {
          const scans = new Map(get().networkScanResults)
          scans.set(scanId, results)
          set({ 
            networkScanResults: scans,
            lastNetworkScan: new Date().toISOString()
          })
        },

        // Actions - Statistics
        updateStats: () => {
          const state = get()
          const stats = {
            totalBrokers: state.discoveredBrokers.size,
            totalConnections: state.brokerConnections.size,
            totalTopics: Array.from(state.topicsByBroker.values())
              .reduce((sum, topics) => sum + topics.size, 0),
            totalMessages: Array.from(state.messagesByBroker.values())
              .reduce((sum, messages) => sum + messages.length, 0),
            messagesPerSecond: 0, // Calculated elsewhere
            bytesTransferred: Array.from(state.messagesByBroker.values())
              .flat()
              .reduce((sum, message) => sum + (message.size || 0), 0),
            errors: 0 // Tracked elsewhere
          }
          
          set({ stats })
        },

        // Getters
        getBroker: (brokerId) => get().discoveredBrokers.get(brokerId),

        getConnection: (brokerId) => get().brokerConnections.get(brokerId),

        getTopics: (brokerId) => get().topicsByBroker.get(brokerId) || new Map(),

        getMessages: (brokerId, limit = 100) => {
          const messages = get().messagesByBroker.get(brokerId) || []
          return messages.slice(-limit)
        },

        getSubscriptions: (brokerId) => get().subscriptionsByBroker.get(brokerId) || new Set(),

        getSparkplugGroup: (groupId) => get().sparkplugGroups.get(groupId),

        getSparkplugDevice: (deviceKey) => get().sparkplugDevices.get(deviceKey),

        getAllSparkplugGroups: () => Array.from(get().sparkplugGroups.values()),

        getAllSparkplugDevices: () => Array.from(get().sparkplugDevices.values()),

        getRecentSparkplugMetrics: (limit = 1000) => 
          get().sparkplugMetrics.slice(-limit),

        // Search and filter
        searchMessages: (brokerId, query, filters = {}) => {
          const messages = get().messagesByBroker.get(brokerId) || []
          
          return messages.filter(message => {
            // Text search
            if (query) {
              const searchText = [
                message.topic,
                JSON.stringify(message.payload),
                message.type
              ].join(' ').toLowerCase()
              
              if (!searchText.includes(query.toLowerCase())) {
                return false
              }
            }

            // Filters
            if (filters.messageType && message.type !== filters.messageType) {
              return false
            }

            if (filters.topic && !message.topic.includes(filters.topic)) {
              return false
            }

            if (filters.timeRange) {
              const messageTime = new Date(message.timestamp)
              const now = new Date()
              const cutoff = new Date(now.getTime() - filters.timeRange * 60 * 1000)
              
              if (messageTime < cutoff) {
                return false
              }
            }

            return true
          })
        },

        // Reset
        reset: () => {
          set({
            discoveredBrokers: new Map(),
            isDiscovering: false,
            connectedBrokers: new Map(),
            brokerConnections: new Map(),
            topicsByBroker: new Map(),
            messagesByBroker: new Map(),
            messageBuffer: new Map(),
            subscriptionsByBroker: new Map(),
            sparkplugGroups: new Map(),
            sparkplugDevices: new Map(),
            sparkplugMetrics: [],
            networkScanResults: new Map(),
            lastNetworkScan: null,
            stats: {
              totalBrokers: 0,
              totalConnections: 0,
              totalTopics: 0,
              totalMessages: 0,
              messagesPerSecond: 0,
              bytesTransferred: 0,
              errors: 0
            }
          })
        }
      }),
      {
        name: 'mqtt-explore-mqtt',
        partialize: (state) => ({
          discoveryOptions: state.discoveryOptions
        })
      }
    ),
    {
      name: 'mqtt-store'
    }
  )
)