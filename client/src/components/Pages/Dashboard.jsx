import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wifi,
  Activity,
  MessageCircle,
  Database,
  Zap,
  TrendingUp,
  Users,
  Clock,
  Play,
  Search,
  Settings,
  BarChart3,
  PieChart,
  Globe,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// Store
import { useAppStore } from '../../store/appStore'
import { useMQTTStore } from '../../store/mqttStore'
import { useUIStore } from '../../store/uiStore'

// Components
import MetricCard from '../Common/MetricCard'
import Chart from '../Common/Chart'
import RecentActivity from '../Common/RecentActivity'
import QuickActionCard from '../Common/QuickActionCard'

const Dashboard = () => {
  const { isConnected, metrics } = useAppStore()
  const { stats, discoveredBrokers, isDiscovering } = useMQTTStore()
  const { openModal } = useUIStore()

  const [timeRange, setTimeRange] = useState('1h')

  // Mock real-time data
  const [realtimeStats, setRealtimeStats] = useState({
    messagesPerSecond: 0,
    bytesPerSecond: 0,
    cpuUsage: 0,
    memoryUsage: 0
  })

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStats({
        messagesPerSecond: Math.floor(Math.random() * 100) + 50,
        bytesPerSecond: Math.floor(Math.random() * 10000) + 5000,
        cpuUsage: Math.floor(Math.random() * 30) + 10,
        memoryUsage: Math.floor(Math.random() * 40) + 30
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Overview metrics
  const overviewMetrics = [
    {
      title: 'MQTT Brokers',
      value: stats.totalBrokers,
      change: '+2',
      changeType: 'positive',
      icon: Wifi,
      color: 'blue',
      description: 'Active broker connections'
    },
    {
      title: 'Active Connections',
      value: stats.totalConnections,
      change: '+5',
      changeType: 'positive',
      icon: Activity,
      color: 'green',
      description: 'Client connections'
    },
    {
      title: 'Topics',
      value: stats.totalTopics,
      change: '+12',
      changeType: 'positive',
      icon: MessageCircle,
      color: 'orange',
      description: 'Subscribed topics'
    },
    {
      title: 'Messages',
      value: stats.totalMessages,
      change: '+1.2K',
      changeType: 'positive',
      icon: Database,
      color: 'purple',
      description: 'Total messages processed'
    }
  ]

  // Real-time metrics
  const realtimeMetrics = [
    {
      title: 'Messages/sec',
      value: realtimeStats.messagesPerSecond,
      unit: '/s',
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Throughput',
      value: `${(realtimeStats.bytesPerSecond / 1024).toFixed(1)}`,
      unit: 'KB/s',
      icon: BarChart3,
      color: 'green'
    },
    {
      title: 'CPU Usage',
      value: realtimeStats.cpuUsage,
      unit: '%',
      icon: Activity,
      color: 'orange'
    },
    {
      title: 'Memory',
      value: realtimeStats.memoryUsage,
      unit: '%',
      icon: PieChart,
      color: 'purple'
    }
  ]

  // Quick actions
  const quickActions = [
    {
      title: 'Start Discovery',
      description: 'Scan network for MQTT brokers',
      icon: Search,
      color: 'blue',
      action: () => console.log('Start discovery'),
      disabled: isDiscovering
    },
    {
      title: 'Connect Broker',
      description: 'Add new MQTT broker',
      icon: Wifi,
      color: 'green',
      action: () => openModal('brokerConnection')
    },
    {
      title: 'View Analytics',
      description: 'Open detailed analytics',
      icon: BarChart3,
      color: 'purple',
      action: () => console.log('View analytics')
    },
    {
      title: 'Settings',
      description: 'Configure application',
      icon: Settings,
      color: 'gray',
      action: () => openModal('settings')
    }
  ]

  // Mock chart data
  const chartData = {
    labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'],
    datasets: [
      {
        label: 'Messages',
        data: [120, 200, 150, 800, 600, 400],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Connections',
        data: [50, 100, 75, 200, 150, 100],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      }
    ]
  }

  // Recent activities
  const recentActivities = [
    {
      id: 1,
      type: 'broker_connected',
      message: 'New broker connected: 192.168.1.100:1883',
      timestamp: '2 minutes ago',
      icon: CheckCircle,
      color: 'green'
    },
    {
      id: 2,
      type: 'topic_subscribed',
      message: 'Subscribed to topic: sensors/temperature/#',
      timestamp: '5 minutes ago',
      icon: MessageCircle,
      color: 'blue'
    },
    {
      id: 3,
      type: 'high_volume',
      message: 'High message volume detected on factory/production',
      timestamp: '8 minutes ago',
      icon: AlertCircle,
      color: 'orange'
    },
    {
      id: 4,
      type: 'sparkplug_device',
      message: 'New Sparkplug device: Edge Node 01/Device 05',
      timestamp: '12 minutes ago',
      icon: Zap,
      color: 'yellow'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard Overview
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring of your MQTT network infrastructure
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          
          <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
            Refresh
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${
          isConnected
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <div className="flex-1">
            <h3 className={`font-medium ${
              isConnected ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
            }`}>
              {isConnected ? 'System Online' : 'System Offline'}
            </h3>
            <p className={`text-sm ${
              isConnected ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'
            }`}>
              {isConnected 
                ? 'All services are running normally and discovery is active'
                : 'Connection to MQTT Explore server has been lost'
              }
            </p>
          </div>
          {isDiscovering && (
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Discovering...</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewMetrics.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MetricCard {...metric} />
          </motion.div>
        ))}
      </div>

      {/* Real-time Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Real-time Performance
          </h2>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {realtimeMetrics.map((metric) => (
            <div key={metric.title} className="text-center">
              <div className={`w-12 h-12 mx-auto mb-3 rounded-lg bg-${metric.color}-100 dark:bg-${metric.color}-900/20 flex items-center justify-center`}>
                <metric.icon className={`w-6 h-6 text-${metric.color}-600 dark:text-${metric.color}-400`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}{metric.unit}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {metric.title}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Network Activity
            </h2>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                Messages
              </button>
              <button className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full">
                Connections
              </button>
            </div>
          </div>
          <Chart data={chartData} type="line" height={300} />
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Recent Activity
          </h2>
          <RecentActivity activities={recentActivities} />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </motion.div>

      {/* System Health */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          System Health
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Network Discovery
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Running Normally
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Activity className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              MQTT Services
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              All Operational
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Security
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              All Secure
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard