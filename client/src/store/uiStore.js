import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

export const useUIStore = create()(
  devtools(
    persist(
      (set, get) => ({
        // Theme and appearance
        theme: 'dark', // 'light', 'dark', 'auto'
        colorScheme: 'blue', // 'blue', 'green', 'purple', 'orange'
        compactMode: false,
        animations: true,
        fontSize: 'normal', // 'small', 'normal', 'large'

        // Layout preferences
        sidebarCollapsed: false,
        sidebarWidth: 280,
        panelSizes: {
          brokerList: 300,
          topicTree: 250,
          messageLog: 400,
          sparkplugTree: 300,
          aiChat: 350,
          networkGraph: 600
        },

        // View preferences
        defaultView: 'dashboard', // 'dashboard', 'network', 'brokers'
        messageFormat: 'json', // 'json', 'raw', 'formatted'
        timestampFormat: 'relative', // 'relative', 'absolute', 'iso'
        autoRefresh: true,
        refreshInterval: 1000, // milliseconds
        maxMessages: 1000,
        showEmptyTopics: false,
        groupSimilarMessages: true,

        // Filters and search
        globalSearch: '',
        activeFilters: {
          brokers: {},
          topics: {},
          messages: {},
          sparkplug: {}
        },
        savedSearches: [],

        // Panel visibility
        panels: {
          brokerList: true,
          topicTree: true,
          messageLog: true,
          sparkplugTree: false,
          aiChat: false,
          networkGraph: false,
          settingsPanel: false,
          exportPanel: false
        },

        // Modals and overlays
        modals: {
          settings: false,
          brokerConnection: false,
          topicSubscription: false,
          messagePublish: false,
          dataExport: false,
          networkScan: false,
          aiChat: false,
          about: false
        },

        // Notifications
        notifications: {
          enabled: true,
          types: {
            brokerDiscovered: true,
            connectionStatus: true,
            errors: true,
            sparkplugMessages: false,
            aiInsights: true
          },
          position: 'top-right', // 'top-left', 'top-right', 'bottom-left', 'bottom-right'
          duration: 5000
        },

        // Data visualization preferences
        visualization: {
          networkGraph: {
            layout: 'force', // 'force', 'circle', 'grid', 'hierarchy'
            nodeSize: 'medium', // 'small', 'medium', 'large'
            showLabels: true,
            showMetrics: true,
            colorByStatus: true,
            animateChanges: true
          },
          sparkplugTree: {
            showMetrics: true,
            showTimestamps: true,
            groupByDevice: true,
            expandAll: false
          },
          messageChart: {
            type: 'line', // 'line', 'bar', 'area'
            timeRange: '1h', // '5m', '15m', '1h', '6h', '24h'
            showLegend: true,
            autoScale: true
          }
        },

        // Advanced preferences
        advanced: {
          enableDebugMode: false,
          logLevel: 'info', // 'debug', 'info', 'warn', 'error'
          performanceMode: false,
          experimentalFeatures: false,
          developerTools: false
        },

        // Recent items
        recentBrokers: [],
        recentTopics: [],
        recentSearches: [],

        // Bookmarks and favorites
        bookmarks: {
          brokers: [],
          topics: [],
          searches: [],
          sparkplugDevices: []
        },

        // Actions - Theme and appearance
        setTheme: (theme) => set({ theme }),

        setColorScheme: (colorScheme) => set({ colorScheme }),

        setCompactMode: (compactMode) => set({ compactMode }),

        setAnimations: (animations) => set({ animations }),

        setFontSize: (fontSize) => set({ fontSize }),

        // Actions - Layout
        setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

        setSidebarWidth: (width) => set({ sidebarWidth: width }),

        setPanelSize: (panel, size) =>
          set(state => ({
            panelSizes: { ...state.panelSizes, [panel]: size }
          })),

        setPanelSizes: (sizes) =>
          set(state => ({
            panelSizes: { ...state.panelSizes, ...sizes }
          })),

        // Actions - View preferences
        setDefaultView: (view) => set({ defaultView: view }),

        setMessageFormat: (format) => set({ messageFormat: format }),

        setTimestampFormat: (format) => set({ timestampFormat: format }),

        setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),

        setRefreshInterval: (interval) => set({ refreshInterval: interval }),

        setMaxMessages: (max) => set({ maxMessages: max }),

        setShowEmptyTopics: (show) => set({ showEmptyTopics: show }),

        setGroupSimilarMessages: (group) => set({ groupSimilarMessages: group }),

        // Actions - Search and filters
        setGlobalSearch: (search) => set({ globalSearch: search }),

        setActiveFilters: (category, filters) =>
          set(state => ({
            activeFilters: {
              ...state.activeFilters,
              [category]: { ...state.activeFilters[category], ...filters }
            }
          })),

        clearActiveFilters: (category) =>
          set(state => ({
            activeFilters: {
              ...state.activeFilters,
              [category]: {}
            }
          })),

        addSavedSearch: (search) =>
          set(state => ({
            savedSearches: [
              search,
              ...state.savedSearches.filter(s => s.id !== search.id)
            ].slice(0, 20)
          })),

        removeSavedSearch: (searchId) =>
          set(state => ({
            savedSearches: state.savedSearches.filter(s => s.id !== searchId)
          })),

        // Actions - Panel visibility
        togglePanel: (panel) =>
          set(state => ({
            panels: { ...state.panels, [panel]: !state.panels[panel] }
          })),

        setPanel: (panel, visible) =>
          set(state => ({
            panels: { ...state.panels, [panel]: visible }
          })),

        setPanels: (panels) =>
          set(state => ({
            panels: { ...state.panels, ...panels }
          })),

        // Actions - Modals
        openModal: (modal) =>
          set(state => ({
            modals: { ...state.modals, [modal]: true }
          })),

        closeModal: (modal) =>
          set(state => ({
            modals: { ...state.modals, [modal]: false }
          })),

        closeAllModals: () =>
          set(state => ({
            modals: Object.keys(state.modals).reduce((acc, key) => {
              acc[key] = false
              return acc
            }, {})
          })),

        // Actions - Notifications
        setNotifications: (settings) =>
          set(state => ({
            notifications: { ...state.notifications, ...settings }
          })),

        setNotificationTypes: (types) =>
          set(state => ({
            notifications: {
              ...state.notifications,
              types: { ...state.notifications.types, ...types }
            }
          })),

        // Actions - Visualization
        setVisualization: (category, settings) =>
          set(state => ({
            visualization: {
              ...state.visualization,
              [category]: { ...state.visualization[category], ...settings }
            }
          })),

        // Actions - Advanced
        setAdvanced: (settings) =>
          set(state => ({
            advanced: { ...state.advanced, ...settings }
          })),

        // Actions - Recent items
        addRecentBroker: (broker) =>
          set(state => ({
            recentBrokers: [
              broker,
              ...state.recentBrokers.filter(b => b.id !== broker.id)
            ].slice(0, 10)
          })),

        addRecentTopic: (topic) =>
          set(state => ({
            recentTopics: [
              topic,
              ...state.recentTopics.filter(t => t.name !== topic.name)
            ].slice(0, 20)
          })),

        addRecentSearch: (search) =>
          set(state => ({
            recentSearches: [
              search,
              ...state.recentSearches.filter(s => s.query !== search.query)
            ].slice(0, 10)
          })),

        // Actions - Bookmarks
        addBookmark: (category, item) =>
          set(state => ({
            bookmarks: {
              ...state.bookmarks,
              [category]: [
                item,
                ...state.bookmarks[category].filter(b => b.id !== item.id)
              ]
            }
          })),

        removeBookmark: (category, itemId) =>
          set(state => ({
            bookmarks: {
              ...state.bookmarks,
              [category]: state.bookmarks[category].filter(b => b.id !== itemId)
            }
          })),

        isBookmarked: (category, itemId) => {
          const bookmarks = get().bookmarks[category] || []
          return bookmarks.some(b => b.id === itemId)
        },

        // Computed values
        getEffectiveTheme: () => {
          const theme = get().theme
          if (theme === 'auto') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          }
          return theme
        },

        getVisiblePanels: () => {
          const panels = get().panels
          return Object.entries(panels)
            .filter(([_, visible]) => visible)
            .map(([name, _]) => name)
        },

        getActiveFiltersCount: () => {
          const filters = get().activeFilters
          return Object.values(filters).reduce((count, categoryFilters) => {
            return count + Object.keys(categoryFilters).length
          }, 0)
        },

        hasActiveFilters: (category) => {
          if (category) {
            return Object.keys(get().activeFilters[category] || {}).length > 0
          }
          return get().getActiveFiltersCount() > 0
        },

        // Presets
        applyPreset: (presetName) => {
          const presets = {
            developer: {
              panels: {
                brokerList: true,
                topicTree: true,
                messageLog: true,
                sparkplugTree: false,
                aiChat: false,
                networkGraph: true
              },
              messageFormat: 'json',
              showEmptyTopics: true,
              advanced: {
                enableDebugMode: true,
                logLevel: 'debug',
                developerTools: true
              }
            },
            operator: {
              panels: {
                brokerList: true,
                topicTree: false,
                messageLog: false,
                sparkplugTree: true,
                aiChat: true,
                networkGraph: true
              },
              messageFormat: 'formatted',
              showEmptyTopics: false,
              advanced: {
                enableDebugMode: false,
                logLevel: 'info',
                developerTools: false
              }
            },
            analyst: {
              panels: {
                brokerList: false,
                topicTree: true,
                messageLog: true,
                sparkplugTree: true,
                aiChat: true,
                networkGraph: false
              },
              messageFormat: 'formatted',
              groupSimilarMessages: true,
              advanced: {
                enableDebugMode: false,
                logLevel: 'info',
                developerTools: false
              }
            }
          }

          const preset = presets[presetName]
          if (preset) {
            set(state => ({
              ...state,
              ...preset
            }))
          }
        },

        // Export/import preferences
        exportPreferences: () => {
          const state = get()
          const preferences = {
            theme: state.theme,
            colorScheme: state.colorScheme,
            compactMode: state.compactMode,
            panels: state.panels,
            panelSizes: state.panelSizes,
            messageFormat: state.messageFormat,
            timestampFormat: state.timestampFormat,
            visualization: state.visualization,
            notifications: state.notifications,
            advanced: state.advanced,
            bookmarks: state.bookmarks
          }
          return JSON.stringify(preferences, null, 2)
        },

        importPreferences: (preferencesJson) => {
          try {
            const preferences = JSON.parse(preferencesJson)
            set(state => ({ ...state, ...preferences }))
            return true
          } catch (error) {
            console.error('Failed to import preferences:', error)
            return false
          }
        },

        // Reset
        reset: () => {
          set({
            theme: 'dark',
            colorScheme: 'blue',
            compactMode: false,
            animations: true,
            fontSize: 'normal',
            sidebarCollapsed: false,
            sidebarWidth: 280,
            panelSizes: {
              brokerList: 300,
              topicTree: 250,
              messageLog: 400,
              sparkplugTree: 300,
              aiChat: 350,
              networkGraph: 600
            },
            defaultView: 'dashboard',
            messageFormat: 'json',
            timestampFormat: 'relative',
            autoRefresh: true,
            refreshInterval: 1000,
            maxMessages: 1000,
            showEmptyTopics: false,
            groupSimilarMessages: true,
            globalSearch: '',
            activeFilters: {
              brokers: {},
              topics: {},
              messages: {},
              sparkplug: {}
            },
            savedSearches: [],
            panels: {
              brokerList: true,
              topicTree: true,
              messageLog: true,
              sparkplugTree: false,
              aiChat: false,
              networkGraph: false,
              settingsPanel: false,
              exportPanel: false
            },
            modals: Object.keys(get().modals).reduce((acc, key) => {
              acc[key] = false
              return acc
            }, {}),
            recentBrokers: [],
            recentTopics: [],
            recentSearches: [],
            bookmarks: {
              brokers: [],
              topics: [],
              searches: [],
              sparkplugDevices: []
            }
          })
        }
      }),
      {
        name: 'mqtt-explore-ui',
        partialize: (state) => ({
          theme: state.theme,
          colorScheme: state.colorScheme,
          compactMode: state.compactMode,
          animations: state.animations,
          fontSize: state.fontSize,
          sidebarCollapsed: state.sidebarCollapsed,
          sidebarWidth: state.sidebarWidth,
          panelSizes: state.panelSizes,
          defaultView: state.defaultView,
          messageFormat: state.messageFormat,
          timestampFormat: state.timestampFormat,
          autoRefresh: state.autoRefresh,
          refreshInterval: state.refreshInterval,
          maxMessages: state.maxMessages,
          showEmptyTopics: state.showEmptyTopics,
          groupSimilarMessages: state.groupSimilarMessages,
          panels: state.panels,
          notifications: state.notifications,
          visualization: state.visualization,
          advanced: state.advanced,
          recentBrokers: state.recentBrokers,
          recentTopics: state.recentTopics,
          recentSearches: state.recentSearches,
          bookmarks: state.bookmarks,
          savedSearches: state.savedSearches
        })
      }
    ),
    {
      name: 'ui-store'
    }
  )
)