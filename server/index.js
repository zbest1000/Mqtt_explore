const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import custom modules
const MQTTDiscoveryService = require('./services/mqttDiscovery');
const MQTTClientManager = require('./services/mqttClientManager');
const SparkplugDecoder = require('./services/sparkplugDecoder');
const AIService = require('./services/aiService');
const NetworkScanner = require('./services/networkScanner');
const DataExporter = require('./services/dataExporter');

// Import routes
const apiRoutes = require('./routes/api');
const mqttRoutes = require('./routes/mqtt');
const aiRoutes = require('./routes/ai');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
}

// Initialize services
const mqttDiscovery = new MQTTDiscoveryService(io);
const mqttClientManager = new MQTTClientManager(io);
const sparkplugDecoder = new SparkplugDecoder();
const aiService = new AIService();
const networkScanner = new NetworkScanner(io);
const dataExporter = new DataExporter();

// Store services in app locals for access in routes
app.locals.services = {
  mqttDiscovery,
  mqttClientManager,
  sparkplugDecoder,
  aiService,
  networkScanner,
  dataExporter
};

// Routes
app.use('/api', apiRoutes);
app.use('/api/mqtt', mqttRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      mqtt: mqttClientManager.getConnectionStatus(),
      ai: aiService.isAvailable(),
      scanner: networkScanner.isScanning()
    }
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // MQTT Discovery events
  socket.on('start-discovery', (options) => {
    mqttDiscovery.startDiscovery(options);
  });

  socket.on('stop-discovery', () => {
    mqttDiscovery.stopDiscovery();
  });

  // MQTT Connection events
  socket.on('connect-mqtt', (connectionConfig) => {
    mqttClientManager.connectToBroker(connectionConfig, socket.id);
  });

  socket.on('disconnect-mqtt', (brokerId) => {
    mqttClientManager.disconnectFromBroker(brokerId);
  });

  socket.on('subscribe-topic', (data) => {
    mqttClientManager.subscribeToTopic(data.brokerId, data.topic, data.qos);
  });

  socket.on('unsubscribe-topic', (data) => {
    mqttClientManager.unsubscribeFromTopic(data.brokerId, data.topic);
  });

  socket.on('publish-message', (data) => {
    mqttClientManager.publishMessage(data.brokerId, data.topic, data.payload, data.options);
  });

  // Network scanning events
  socket.on('start-network-scan', (options) => {
    networkScanner.startScan(options);
  });

  socket.on('stop-network-scan', () => {
    networkScanner.stopScan();
  });

  // AI Query events
  socket.on('ai-query', async (query) => {
    try {
      const response = await aiService.processQuery(query, mqttClientManager.getAllData());
      socket.emit('ai-response', { query, response });
    } catch (error) {
      socket.emit('ai-error', { query, error: error.message });
    }
  });

  // Data export events
  socket.on('export-data', async (options) => {
    try {
      const exportData = await dataExporter.exportData(
        mqttClientManager.getAllData(), 
        options
      );
      socket.emit('export-ready', exportData);
    } catch (error) {
      socket.emit('export-error', { error: error.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    mqttClientManager.cleanupSocketConnections(socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 MQTT Explore Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready for real-time communication`);
  
  // Start background services
  if (process.env.AUTO_START_DISCOVERY === 'true') {
    mqttDiscovery.startDiscovery();
  }
});

module.exports = { app, server, io };