const OpenAI = require('openai');
const { EventEmitter } = require('events');

class AIService extends EventEmitter {
  constructor() {
    super();
    this.openai = null;
    this.isConfigured = false;
    this.conversationHistory = [];
    this.maxHistoryLength = 50;
    this.systemPrompt = this.buildSystemPrompt();

    this.initialize();
  }

  initialize() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (apiKey) {
        this.openai = new OpenAI({
          apiKey: apiKey,
        });
        this.isConfigured = true;
        console.log('✅ AI Service initialized with OpenAI API');
      } else {
        console.log('⚠️  AI Service initialized without OpenAI API key');
      }
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
    }
  }

  buildSystemPrompt() {
    return `You are MQTT Explore AI Assistant, an expert in MQTT protocol, IoT systems, Sparkplug B, and industrial automation.

Your role is to help users understand and analyze MQTT network traffic, broker configurations, and message patterns. You have access to real-time MQTT data including:

- Broker connections and configurations
- Topic hierarchies and message patterns  
- Sparkplug B decoded payloads with metrics, aliases, and device information
- Message frequency, payload types, and data trends
- Network discovery results and client information

Key capabilities:
1. **MQTT Analysis**: Interpret topic structures, QoS levels, retained messages, and client behaviors
2. **Sparkplug B Expertise**: Decode and explain Group IDs, Edge Node IDs, Device IDs, metric aliases, birth/death certificates
3. **Data Insights**: Identify patterns, anomalies, missing data, and communication issues
4. **Troubleshooting**: Help diagnose connection problems, authentication issues, and protocol violations
5. **Security Analysis**: Identify potential security concerns and best practices

When responding:
- Be concise but comprehensive
- Use technical terms appropriately but explain complex concepts
- Provide actionable insights and recommendations
- Reference specific data points when available
- Suggest follow-up queries or investigation areas

Always maintain awareness that you're analyzing real-time IoT/industrial data that may be mission-critical.`;
  }

  async processQuery(query, mqttData) {
    if (!this.isConfigured) {
      throw new Error('AI Service not configured - OpenAI API key required');
    }

    try {
      // Prepare context from MQTT data
      const context = this.prepareMQTTContext(mqttData);
      
      // Build the conversation messages
      const messages = [
        { role: 'system', content: this.systemPrompt },
        { role: 'system', content: `Current MQTT Network Context:\n${context}` },
        ...this.conversationHistory.slice(-10), // Last 10 exchanges
        { role: 'user', content: query }
      ];

      console.log(`🤖 Processing AI query: "${query.substring(0, 100)}..."`);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.3,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const response = completion.choices[0].message.content;

      // Add to conversation history
      this.addToHistory(query, response);

      return {
        response: response,
        usage: completion.usage,
        model: completion.model,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('AI query processing error:', error);
      throw error;
    }
  }

  prepareMQTTContext(mqttData) {
    const context = [];

    // Broker information
    if (mqttData.connections && Object.keys(mqttData.connections).length > 0) {
      context.push('=== CONNECTED BROKERS ===');
      Object.entries(mqttData.connections).forEach(([brokerId, conn]) => {
        context.push(`Broker ${brokerId}: ${conn.host}:${conn.port} (${conn.status})`);
        if (conn.connectedAt) {
          context.push(`  Connected: ${conn.connectedAt}`);
        }
        if (conn.lastActivity) {
          context.push(`  Last Activity: ${conn.lastActivity}`);
        }
      });
      context.push('');
    }

    // Topic summary
    if (mqttData.topics && Object.keys(mqttData.topics).length > 0) {
      context.push('=== ACTIVE TOPICS ===');
      Object.entries(mqttData.topics).forEach(([brokerId, topics]) => {
        context.push(`Broker ${brokerId}:`);
        Object.entries(topics).forEach(([topic, info]) => {
          context.push(`  ${topic}: ${info.messageCount} messages`);
          if (info.lastMessage) {
            context.push(`    Last: ${info.lastMessage.timestamp} (${info.lastMessage.type})`);
          }
        });
      });
      context.push('');
    }

    // Recent messages summary
    if (mqttData.messages && Object.keys(mqttData.messages).length > 0) {
      context.push('=== RECENT MESSAGES SUMMARY ===');
      Object.entries(mqttData.messages).forEach(([brokerId, messages]) => {
        if (messages.length > 0) {
          const recent = messages.slice(-10);
          const messageTypes = {};
          const sparkplugMessages = [];

          recent.forEach(msg => {
            messageTypes[msg.type] = (messageTypes[msg.type] || 0) + 1;
            if (msg.sparkplug) {
              sparkplugMessages.push(msg);
            }
          });

          context.push(`Broker ${brokerId}: ${messages.length} total messages`);
          context.push(`  Message types: ${JSON.stringify(messageTypes)}`);
          
          if (sparkplugMessages.length > 0) {
            context.push(`  Sparkplug messages: ${sparkplugMessages.length}`);
            const sparkplugSummary = this.summarizeSparkplugMessages(sparkplugMessages);
            context.push(`    Groups: ${sparkplugSummary.groups.join(', ')}`);
            context.push(`    Edge Nodes: ${sparkplugSummary.edgeNodes.join(', ')}`);
            context.push(`    Devices: ${sparkplugSummary.devices.join(', ')}`);
          }
        }
      });
      context.push('');
    }

    // Metrics summary
    if (mqttData.metrics && Object.keys(mqttData.metrics).length > 0) {
      context.push('=== BROKER METRICS ===');
      Object.entries(mqttData.metrics).forEach(([brokerId, metrics]) => {
        context.push(`Broker ${brokerId}:`);
        context.push(`  Messages Received: ${metrics.messagesReceived || 0}`);
        context.push(`  Messages Sent: ${metrics.messagesSent || 0}`);
        context.push(`  Bytes Received: ${metrics.bytesReceived || 0}`);
        context.push(`  Bytes Sent: ${metrics.bytesSent || 0}`);
        context.push(`  Subscriptions: ${metrics.subscriptions || 0}`);
        context.push(`  Errors: ${metrics.errors || 0}`);
      });
    }

    return context.join('\n');
  }

  summarizeSparkplugMessages(messages) {
    const summary = {
      groups: new Set(),
      edgeNodes: new Set(),
      devices: new Set(),
      messageTypes: new Set(),
      metrics: new Set()
    };

    messages.forEach(msg => {
      if (msg.sparkplug) {
        const topicParts = msg.topic.split('/');
        if (topicParts.length >= 4) {
          summary.groups.add(topicParts[1]);
          summary.messageTypes.add(topicParts[2]);
          summary.edgeNodes.add(topicParts[3]);
          if (topicParts.length > 4) {
            summary.devices.add(topicParts.slice(4).join('/'));
          }
        }

        if (msg.sparkplug.metrics) {
          msg.sparkplug.metrics.forEach(metric => {
            if (metric.name) summary.metrics.add(metric.name);
          });
        }
      }
    });

    return {
      groups: Array.from(summary.groups),
      edgeNodes: Array.from(summary.edgeNodes),
      devices: Array.from(summary.devices),
      messageTypes: Array.from(summary.messageTypes),
      metrics: Array.from(summary.metrics)
    };
  }

  async classifyPayload(payload, topic, metadata = {}) {
    if (!this.isConfigured) {
      return this.fallbackClassification(payload, topic);
    }

    try {
      const prompt = `Analyze this MQTT payload and classify it:

Topic: ${topic}
Payload: ${JSON.stringify(payload, null, 2)}
Metadata: ${JSON.stringify(metadata, null, 2)}

Classify the payload and provide:
1. Primary Intent (telemetry, command, alarm, configuration, status, etc.)
2. Data Type (sensor reading, device command, system alert, etc.)
3. Confidence Level (high, medium, low)
4. Key Information (what the payload contains)
5. Suggested Units (if applicable)
6. Context (what system/device this likely comes from)

Format as JSON with fields: intent, dataType, confidence, keyInfo, suggestedUnits, context`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are an expert in IoT and MQTT payload analysis.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 300,
        temperature: 0.2
      });

      const response = completion.choices[0].message.content;
      
      try {
        return JSON.parse(response);
      } catch (parseError) {
        console.error('Failed to parse AI classification response:', parseError);
        return this.fallbackClassification(payload, topic);
      }

    } catch (error) {
      console.error('AI payload classification error:', error);
      return this.fallbackClassification(payload, topic);
    }
  }

  fallbackClassification(payload, topic) {
    const classification = {
      intent: 'unknown',
      dataType: 'unknown',
      confidence: 'low',
      keyInfo: 'Basic classification based on topic and payload structure',
      suggestedUnits: null,
      context: 'Automated classification'
    };

    // Basic topic analysis
    const topicLower = topic.toLowerCase();
    
    if (topicLower.includes('temperature') || topicLower.includes('temp')) {
      classification.intent = 'telemetry';
      classification.dataType = 'temperature sensor';
      classification.suggestedUnits = '°C or °F';
      classification.confidence = 'medium';
    } else if (topicLower.includes('humidity')) {
      classification.intent = 'telemetry';
      classification.dataType = 'humidity sensor';
      classification.suggestedUnits = '%RH';
      classification.confidence = 'medium';
    } else if (topicLower.includes('pressure')) {
      classification.intent = 'telemetry';
      classification.dataType = 'pressure sensor';
      classification.suggestedUnits = 'hPa or PSI';
      classification.confidence = 'medium';
    } else if (topicLower.includes('command') || topicLower.includes('cmd')) {
      classification.intent = 'command';
      classification.dataType = 'device command';
      classification.confidence = 'medium';
    } else if (topicLower.includes('alarm') || topicLower.includes('alert')) {
      classification.intent = 'alarm';
      classification.dataType = 'system alert';
      classification.confidence = 'medium';
    } else if (topicLower.includes('config') || topicLower.includes('settings')) {
      classification.intent = 'configuration';
      classification.dataType = 'device configuration';
      classification.confidence = 'medium';
    } else if (topicLower.includes('status') || topicLower.includes('state')) {
      classification.intent = 'status';
      classification.dataType = 'device status';
      classification.confidence = 'medium';
    }

    // Sparkplug B specific
    if (topic.startsWith('spBv1.0/')) {
      classification.intent = 'sparkplug';
      classification.dataType = 'Sparkplug B message';
      classification.confidence = 'high';
      classification.context = 'Sparkplug B industrial protocol';
    }

    // Payload structure analysis
    if (typeof payload === 'object' && payload !== null) {
      if (payload.hasOwnProperty('value') || payload.hasOwnProperty('data')) {
        classification.intent = 'telemetry';
      }
      
      if (payload.hasOwnProperty('command') || payload.hasOwnProperty('action')) {
        classification.intent = 'command';
      }

      if (payload.hasOwnProperty('error') || payload.hasOwnProperty('alarm')) {
        classification.intent = 'alarm';
      }
    }

    return classification;
  }

  async generateInsights(mqttData, timeRange = '1hour') {
    if (!this.isConfigured) {
      return this.generateBasicInsights(mqttData);
    }

    try {
      const context = this.prepareMQTTContext(mqttData);
      
      const prompt = `Analyze this MQTT network data and provide key insights:

${context}

Generate insights about:
1. Network Health & Performance
2. Communication Patterns
3. Potential Issues or Anomalies
4. Sparkplug B Analysis (if applicable)
5. Recommendations for optimization
6. Security observations

Provide actionable insights in a structured format.`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return {
        insights: completion.choices[0].message.content,
        timestamp: new Date(),
        dataRange: timeRange
      };

    } catch (error) {
      console.error('AI insights generation error:', error);
      return this.generateBasicInsights(mqttData);
    }
  }

  generateBasicInsights(mqttData) {
    const insights = [];

    // Count brokers and topics
    const brokerCount = Object.keys(mqttData.connections || {}).length;
    const totalTopics = Object.values(mqttData.topics || {}).reduce((sum, topics) => sum + Object.keys(topics).length, 0);
    const totalMessages = Object.values(mqttData.messages || {}).reduce((sum, messages) => sum + messages.length, 0);

    insights.push(`📊 Network Overview: ${brokerCount} brokers, ${totalTopics} active topics, ${totalMessages} total messages`);

    // Analyze message patterns
    const messageTypes = {};
    Object.values(mqttData.messages || {}).forEach(messages => {
      messages.forEach(msg => {
        messageTypes[msg.type] = (messageTypes[msg.type] || 0) + 1;
      });
    });

    if (Object.keys(messageTypes).length > 0) {
      insights.push(`📈 Message Types: ${Object.entries(messageTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}`);
    }

    // Check for Sparkplug B usage
    const sparkplugCount = Object.values(mqttData.messages || {}).reduce((sum, messages) => {
      return sum + messages.filter(msg => msg.sparkplug).length;
    }, 0);

    if (sparkplugCount > 0) {
      insights.push(`🏭 Sparkplug B Messages: ${sparkplugCount} industrial protocol messages detected`);
    }

    // Performance insights
    Object.entries(mqttData.metrics || {}).forEach(([brokerId, metrics]) => {
      if (metrics.errors > 0) {
        insights.push(`⚠️ Broker ${brokerId}: ${metrics.errors} errors detected`);
      }
      
      if (metrics.messagesReceived > 1000) {
        insights.push(`📊 Broker ${brokerId}: High activity with ${metrics.messagesReceived} messages`);
      }
    });

    return {
      insights: insights.join('\n\n'),
      timestamp: new Date(),
      dataRange: 'current',
      type: 'basic'
    };
  }

  addToHistory(query, response) {
    this.conversationHistory.push(
      { role: 'user', content: query },
      { role: 'assistant', content: response }
    );

    // Keep history manageable
    if (this.conversationHistory.length > this.maxHistoryLength * 2) {
      this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength * 2);
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  isAvailable() {
    return this.isConfigured;
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      model: 'gpt-4',
      conversationLength: this.conversationHistory.length / 2,
      provider: 'OpenAI'
    };
  }

  // Predefined query suggestions
  getSuggestedQueries() {
    return [
      "Show all topics active in the past 5 minutes",
      "Which clients haven't sent data today?",
      "Summarize Sparkplug B device metrics",
      "What are the most active MQTT topics?",
      "Identify any communication errors or issues",
      "Show temperature sensor readings",
      "List all connected Sparkplug B devices",
      "What's the average message rate per broker?",
      "Are there any retained messages?",
      "Show QoS distribution across topics",
      "Identify potential security concerns",
      "What devices are sending alarms?",
      "Compare broker performance metrics",
      "Show device birth and death certificates",
      "What are the latest configuration changes?"
    ];
  }
}

module.exports = AIService;