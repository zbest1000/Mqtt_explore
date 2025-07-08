import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useAppStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // Connection state
        isConnected: false,
        connectionStatus: 'disconnected', // 'disconnected', 'connecting', 'connected', 'error'
        lastConnected: null,
        reconnectAttempts: 0,

        // App initialization
        isInitialized: false,
        systemStatus: null,
        serverInfo: null,

        // Navigation state
        currentPage: 'dashboard',
        breadcrumbs: [],

        // Global loading states
        isLoading: false,
        loadingMessage: '',

        // Error state
        lastError: null,
        errorHistory: [],

        // Feature flags
        features: {
          aiEnabled: true,
          networkDiscovery: true,
          sparkplugDecoding: true,
          dataExport: true,
          advancedNetworking: true
        },

        // Performance metrics
        metrics: {
          messagesPerSecond: 0,
          activeConnections: 0,
          totalBrokers: 0,
          totalTopics: 0,
          totalMessages: 0,
          uptime: 0
        },

        // Actions
        setConnected: (connected) => set({ isConnected: connected }),

        setConnectionStatus: (status) => {
          const now = new Date().toISOString()
          set({ 
            connectionStatus: status,
            lastConnected: status === 'connected' ? now : get().lastConnected
          })
        },

        setInitialized: (initialized) => set({ isInitialized: initialized }),

        setSystemStatus: (status) => set({ systemStatus: status }),

        setServerInfo: (info) => set({ serverInfo: info }),

        setCurrentPage: (page) => set({ currentPage: page }),

        setBreadcrumbs: (breadcrumbs) => set({ breadcrumbs }),

        setLoading: (isLoading, message = '') => 
          set({ isLoading, loadingMessage: message }),

        setError: (error) => {
          const errorEntry = {
            id: Date.now(),
            error: error?.message || error,
            timestamp: new Date().toISOString(),
            stack: error?.stack
          }
          
          set(state => ({
            lastError: errorEntry,
            errorHistory: [errorEntry, ...state.errorHistory.slice(0, 49)] // Keep last 50 errors
          }))
        },

        clearError: () => set({ lastError: null }),

        clearErrorHistory: () => set({ errorHistory: [] }),

        updateFeatures: (features) => 
          set(state => ({
            features: { ...state.features, ...features }
          })),

        updateMetrics: (metrics) => 
          set(state => ({
            metrics: { ...state.metrics, ...metrics }
          })),

        incrementReconnectAttempts: () => 
          set(state => ({ reconnectAttempts: state.reconnectAttempts + 1 })),

        resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),

        // Computed values
        getConnectionStatusColor: () => {
          const status = get().connectionStatus
          switch (status) {
            case 'connected': return 'green'
            case 'connecting': return 'yellow'
            case 'error': return 'red'
            default: return 'gray'
          }
        },

        getConnectionStatusText: () => {
          const status = get().connectionStatus
          const attempts = get().reconnectAttempts
          
          switch (status) {
            case 'connected': return 'Connected'
            case 'connecting': return attempts > 0 ? `Reconnecting (${attempts})` : 'Connecting'
            case 'error': return 'Connection Error'
            default: return 'Disconnected'
          }
        },

        // Reset all state
        reset: () => {
          set({
            isConnected: false,
            connectionStatus: 'disconnected',
            lastConnected: null,
            reconnectAttempts: 0,
            isInitialized: false,
            systemStatus: null,
            serverInfo: null,
            currentPage: 'dashboard',
            breadcrumbs: [],
            isLoading: false,
            loadingMessage: '',
            lastError: null,
            metrics: {
              messagesPerSecond: 0,
              activeConnections: 0,
              totalBrokers: 0,
              totalTopics: 0,
              totalMessages: 0,
              uptime: 0
            }
          })
        }
      }),
      {
        name: 'mqtt-explore-app',
        partialize: (state) => ({
          features: state.features,
          lastConnected: state.lastConnected
        })
      }
    ),
    {
      name: 'app-store'
    }
  )
)