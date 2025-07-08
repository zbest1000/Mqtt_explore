const mqtt = require('mqtt');
const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const SparkplugDecoder = require('./sparkplugDecoder');

class MQTTClientManager extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.connections = new Map(); // brokerId -> connection info
    this.clients = new Map(); // brokerId -> mqtt client
    this.topicData = new Map(); // brokerId -> topic -> messages
    this.clientMetrics = new Map(); // brokerId -> metrics
    this.sparkplugDecoder = new SparkplugDecoder();
    this.messageBuffer = new Map(); // Store recent messages for AI analysis
    this.maxBufferSize = 10000; // Maximum messages to keep in buffer

    this.setupMessageHandling();
  }

  setupMessageHandling() {
    // Clean old messages periodically
    setInterval(() => {
      this.cleanupOldMessages();
    }, 300000); // Every 5 minutes
  }

  async connectToBroker(connectionConfig, socketId) {
    const brokerId = connectionConfig.id || uuidv4();
    
    try {
      // Validate connection config
      if (!connectionConfig.host || !connectionConfig.port) {
        throw new Error('Host and port are required');
      }

      const clientId = connectionConfig.clientId || `MQTTExplore_${Date.now()}`;
      const brokerUrl = this.buildBrokerUrl(connectionConfig);

      console.log(`🔗 Connecting to MQTT broker: ${brokerUrl}`);

      // MQTT connection options
      const options = {
        clientId,
        keepalive: connectionConfig.keepalive || 60,
        connectTimeout: connectionConfig.timeout || 30000,
        reconnectPeriod: connectionConfig.reconnect ? 5000 : 0,
        clean: connectionConfig.cleanSession !== false,
        rejectUnauthorized: connectionConfig.rejectUnauthorized !== false
      };

      // Add authentication if provided
      if (connectionConfig.username) {
        options.username = connectionConfig.username;
        options.password = connectionConfig.password || '';
      }

      // Add TLS options if using secure connection
      if (connectionConfig.protocol === 'mqtts' || connectionConfig.port === 8883) {
        options.protocol = 'mqtts';
        if (connectionConfig.ca) options.ca = connectionConfig.ca;
        if (connectionConfig.cert) options.cert = connectionConfig.cert;
        if (connectionConfig.key) options.key = connectionConfig.key;
      }

      // Create MQTT client
      const client = mqtt.connect(brokerUrl, options);

      // Store connection info
      const connectionInfo = {
        id: brokerId,
        ...connectionConfig,
        clientId,
        socketId,
        status: 'connecting',
        connectedAt: null,
        lastActivity: new Date(),
        metrics: {
          messagesReceived: 0,
          messagesSent: 0,
          bytesReceived: 0,
          bytesSent: 0,
          subscriptions: 0,
          errors: 0
        }
      };

      this.connections.set(brokerId, connectionInfo);
      this.clients.set(brokerId, client);
      this.topicData.set(brokerId, new Map());
      this.clientMetrics.set(brokerId, { ...connectionInfo.metrics });

      // Set up event handlers
      this.setupClientEventHandlers(client, brokerId);

      // Emit connection attempt
      this.io.emit('mqtt-connection-attempt', { brokerId, connectionInfo });

      return { brokerId, status: 'connecting' };

    } catch (error) {
      console.error(`Failed to connect to broker ${connectionConfig.host}:${connectionConfig.port}:`, error);
      this.io.emit('mqtt-connection-error', { 
        brokerId, 
        error: error.message,
        connectionConfig 
      });
      throw error;
    }
  }

  setupClientEventHandlers(client, brokerId) {
    const connectionInfo = this.connections.get(brokerId);

    client.on('connect', (connack) => {
      console.log(`✅ Connected to MQTT broker: ${brokerId}`);
      
      connectionInfo.status = 'connected';
      connectionInfo.connectedAt = new Date();
      connectionInfo.connack = connack;

      this.io.emit('mqtt-connected', { 
        brokerId, 
        connectionInfo: { ...connectionInfo },
        connack 
      });

      // Auto-subscribe to wildcard if enabled
      if (connectionInfo.autoSubscribeWildcard !== false) {
        this.subscribeToTopic(brokerId, '#', 0);
      }
    });

    client.on('message', (topic, message, packet) => {
      this.handleMessage(brokerId, topic, message, packet);
    });

    client.on('error', (error) => {
      console.error(`MQTT Error for ${brokerId}:`, error);
      
      connectionInfo.status = 'error';
      connectionInfo.lastError = error.message;
      connectionInfo.metrics.errors++;

      this.io.emit('mqtt-error', { 
        brokerId, 
        error: error.message,
        connectionInfo: { ...connectionInfo }
      });
    });

    client.on('close', () => {
      console.log(`🔌 MQTT connection closed: ${brokerId}`);
      
      connectionInfo.status = 'disconnected';
      connectionInfo.disconnectedAt = new Date();

      this.io.emit('mqtt-disconnected', { 
        brokerId, 
        connectionInfo: { ...connectionInfo }
      });
    });

    client.on('offline', () => {
      console.log(`📴 MQTT client offline: ${brokerId}`);
      connectionInfo.status = 'offline';
      
      this.io.emit('mqtt-offline', { brokerId });
    });

    client.on('reconnect', () => {
      console.log(`🔄 MQTT client reconnecting: ${brokerId}`);
      connectionInfo.status = 'reconnecting';
      
      this.io.emit('mqtt-reconnecting', { brokerId });
    });
  }

  handleMessage(brokerId, topic, message, packet) {
    const connectionInfo = this.connections.get(brokerId);
    const metrics = this.clientMetrics.get(brokerId);
    const topicMap = this.topicData.get(brokerId);

    // Update metrics
    metrics.messagesReceived++;
    metrics.bytesReceived += message.length;
    connectionInfo.lastActivity = new Date();

    // Parse message
    let parsedMessage;
    try {
      parsedMessage = JSON.parse(message.toString());
    } catch (error) {
      parsedMessage = message.toString();
    }

    // Create message object
    const messageObj = {
      id: uuidv4(),
      brokerId,
      topic,
      payload: parsedMessage,
      rawPayload: message,
      qos: packet.qos,
      retain: packet.retain,
      dup: packet.dup,
      timestamp: new Date(),
      size: message.length,
      type: this.detectMessageType(topic, parsedMessage)
    };

    // Decode Sparkplug B if applicable
    if (this.isSparkplugTopic(topic)) {
      try {
        messageObj.sparkplug = this.sparkplugDecoder.decode(message);
        messageObj.type = 'sparkplug';
      } catch (error) {
        console.error('Sparkplug decode error:', error);
        messageObj.sparkplugError = error.message;
      }
    }

    // Store message in topic map
    if (!topicMap.has(topic)) {
      topicMap.set(topic, []);
    }
    const topicMessages = topicMap.get(topic);
    topicMessages.push(messageObj);

    // Keep only recent messages per topic
    if (topicMessages.length > 1000) {
      topicMessages.splice(0, topicMessages.length - 1000);
    }

    // Add to global message buffer for AI analysis
    this.addToMessageBuffer(messageObj);

    // Emit to frontend
    this.io.emit('mqtt-message', messageObj);

    // Emit topic update
    this.io.emit('topic-updated', {
      brokerId,
      topic,
      messageCount: topicMessages.length,
      lastMessage: messageObj,
      lastActivity: new Date()
    });

    // Update metrics
    this.io.emit('broker-metrics-updated', {
      brokerId,
      metrics: { ...metrics }
    });
  }

  addToMessageBuffer(message) {
    if (!this.messageBuffer.has(message.brokerId)) {
      this.messageBuffer.set(message.brokerId, []);
    }

    const buffer = this.messageBuffer.get(message.brokerId);
    buffer.push(message);

    // Keep buffer size manageable
    if (buffer.length > this.maxBufferSize) {
      buffer.splice(0, buffer.length - this.maxBufferSize);
    }
  }

  subscribeToTopic(brokerId, topic, qos = 0) {
    const client = this.clients.get(brokerId);
    const connectionInfo = this.connections.get(brokerId);

    if (!client || connectionInfo.status !== 'connected') {
      throw new Error('Client not connected');
    }

    client.subscribe(topic, { qos }, (error, granted) => {
      if (error) {
        console.error(`Subscription error for ${topic}:`, error);
        this.io.emit('subscription-error', { 
          brokerId, 
          topic, 
          error: error.message 
        });
        return;
      }

      console.log(`📝 Subscribed to topic: ${topic} (QoS ${qos})`);
      connectionInfo.metrics.subscriptions++;

      this.io.emit('subscription-success', { 
        brokerId, 
        topic, 
        qos, 
        granted 
      });
    });
  }

  unsubscribeFromTopic(brokerId, topic) {
    const client = this.clients.get(brokerId);
    const connectionInfo = this.connections.get(brokerId);

    if (!client) {
      throw new Error('Client not found');
    }

    client.unsubscribe(topic, (error) => {
      if (error) {
        console.error(`Unsubscription error for ${topic}:`, error);
        this.io.emit('unsubscription-error', { 
          brokerId, 
          topic, 
          error: error.message 
        });
        return;
      }

      console.log(`📝 Unsubscribed from topic: ${topic}`);
      connectionInfo.metrics.subscriptions--;

      this.io.emit('unsubscription-success', { 
        brokerId, 
        topic 
      });
    });
  }

  publishMessage(brokerId, topic, payload, options = {}) {
    const client = this.clients.get(brokerId);
    const connectionInfo = this.connections.get(brokerId);
    const metrics = this.clientMetrics.get(brokerId);

    if (!client || connectionInfo.status !== 'connected') {
      throw new Error('Client not connected');
    }

    const publishOptions = {
      qos: options.qos || 0,
      retain: options.retain || false,
      dup: options.dup || false
    };

    const messagePayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

    client.publish(topic, messagePayload, publishOptions, (error) => {
      if (error) {
        console.error(`Publish error for ${topic}:`, error);
        metrics.errors++;
        this.io.emit('publish-error', { 
          brokerId, 
          topic, 
          error: error.message 
        });
        return;
      }

      console.log(`📤 Published to topic: ${topic}`);
      metrics.messagesSent++;
      metrics.bytesSent += messagePayload.length;
      connectionInfo.lastActivity = new Date();

      this.io.emit('publish-success', { 
        brokerId, 
        topic, 
        payload: messagePayload,
        options: publishOptions,
        timestamp: new Date()
      });
    });
  }

  disconnectFromBroker(brokerId) {
    const client = this.clients.get(brokerId);
    const connectionInfo = this.connections.get(brokerId);

    if (client) {
      client.end(true);
      this.clients.delete(brokerId);
    }

    if (connectionInfo) {
      connectionInfo.status = 'disconnected';
      connectionInfo.disconnectedAt = new Date();
    }

    console.log(`🔌 Disconnected from broker: ${brokerId}`);
    this.io.emit('mqtt-disconnected', { brokerId });
  }

  buildBrokerUrl(config) {
    const protocol = config.protocol || (config.port === 8883 ? 'mqtts' : 'mqtt');
    return `${protocol}://${config.host}:${config.port}`;
  }

  detectMessageType(topic, payload) {
    // Sparkplug B detection
    if (this.isSparkplugTopic(topic)) {
      return 'sparkplug';
    }

    // JSON detection
    if (typeof payload === 'object') {
      return 'json';
    }

    // Try to detect other patterns
    if (topic.includes('telemetry') || topic.includes('sensor')) {
      return 'telemetry';
    }

    if (topic.includes('command') || topic.includes('cmd')) {
      return 'command';
    }

    if (topic.includes('alarm') || topic.includes('alert')) {
      return 'alarm';
    }

    if (topic.includes('config') || topic.includes('settings')) {
      return 'configuration';
    }

    return 'unknown';
  }

  isSparkplugTopic(topic) {
    return topic.startsWith('spBv1.0/') || 
           topic.includes('/NBIRTH/') || 
           topic.includes('/DBIRTH/') ||
           topic.includes('/NDATA/') || 
           topic.includes('/DDATA/') ||
           topic.includes('/NDEATH/') || 
           topic.includes('/DDEATH/');
  }

  cleanupOldMessages() {
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    this.topicData.forEach((topicMap, brokerId) => {
      topicMap.forEach((messages, topic) => {
        const filteredMessages = messages.filter(msg => msg.timestamp > cutoffTime);
        topicMap.set(topic, filteredMessages);
      });
    });

    this.messageBuffer.forEach((messages, brokerId) => {
      const filteredMessages = messages.filter(msg => msg.timestamp > cutoffTime);
      this.messageBuffer.set(brokerId, filteredMessages);
    });
  }

  cleanupSocketConnections(socketId) {
    // Find and disconnect brokers associated with this socket
    this.connections.forEach((connectionInfo, brokerId) => {
      if (connectionInfo.socketId === socketId) {
        this.disconnectFromBroker(brokerId);
      }
    });
  }

  // Getter methods for other services
  getConnectionStatus() {
    const status = {};
    this.connections.forEach((info, brokerId) => {
      status[brokerId] = {
        status: info.status,
        host: info.host,
        port: info.port,
        connectedAt: info.connectedAt,
        lastActivity: info.lastActivity
      };
    });
    return status;
  }

  getAllData() {
    const data = {
      connections: {},
      topics: {},
      messages: {},
      metrics: {}
    };

    this.connections.forEach((info, brokerId) => {
      data.connections[brokerId] = { ...info };
      data.topics[brokerId] = {};
      data.messages[brokerId] = this.messageBuffer.get(brokerId) || [];
      data.metrics[brokerId] = this.clientMetrics.get(brokerId) || {};

      const topicMap = this.topicData.get(brokerId);
      if (topicMap) {
        topicMap.forEach((messages, topic) => {
          data.topics[brokerId][topic] = {
            messageCount: messages.length,
            lastMessage: messages[messages.length - 1],
            messages: messages.slice(-100) // Last 100 messages
          };
        });
      }
    });

    return data;
  }

  getTopicsByBroker(brokerId) {
    const topicMap = this.topicData.get(brokerId);
    if (!topicMap) return {};

    const result = {};
    topicMap.forEach((messages, topic) => {
      result[topic] = {
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1],
        lastActivity: messages[messages.length - 1]?.timestamp
      };
    });

    return result;
  }

  getMessagesForTopic(brokerId, topic, limit = 100) {
    const topicMap = this.topicData.get(brokerId);
    if (!topicMap || !topicMap.has(topic)) return [];

    const messages = topicMap.get(topic);
    return messages.slice(-limit);
  }
}

module.exports = MQTTClientManager;