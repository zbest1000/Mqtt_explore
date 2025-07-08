# 🌐 MQTT Explore

> **Real-time, AI-powered MQTT network discovery and visualization tool**

MQTT Explore is a comprehensive web application designed for IoT engineers, SCADA teams, and industrial cybersecurity analysts. It provides powerful tools for discovering, monitoring, and analyzing MQTT networks with advanced AI capabilities and beautiful visualizations.

![MQTT Explore Banner](https://img.shields.io/badge/MQTT-Explore-blue?style=for-the-badge&logo=mqtt)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)

## ✨ Features

### 🔍 **Network Discovery**
- **Automatic MQTT Broker Detection** via multiple methods:
  - Port scanning (1883, 8883, custom ports)
  - mDNS/Bonjour discovery (`_mqtt._tcp.local.`)
  - SSDP discovery
  - Active fingerprinting with partial MQTT connects
  - AI/DPI-based payload heuristics
- **Network Health Monitoring** with real-time status updates
- **Comprehensive Host Discovery** with industrial protocol detection

### 🔗 **MQTT Client Management**
- **Multi-Broker Connections** with support for:
  - Username/password authentication
  - TLS/SSL security (mqtts://)
  - Custom client IDs and keep-alive settings
  - Clean/persistent sessions
- **Real-time Topic Monitoring** with wildcard subscriptions
- **Message Publishing** with QoS control and retain flags
- **Connection Health Tracking** with metrics and diagnostics

### 🏭 **Sparkplug B Support**
- **Full Protobuf Decoding** for Sparkplug B v1.0 and v2.0
- **Industrial Data Visualization**:
  - Group ID → Edge Node ID → Device ID hierarchy
  - Metric name, type, alias, and timestamp analysis
  - Birth/Death certificate tracking
  - Real-time metric monitoring
- **Device Health Monitoring** with anomaly detection

### 🤖 **AI-Powered Analytics**
- **Natural Language Queries** powered by GPT-4:
  - "Show all topics active in the past 5 minutes"
  - "Which clients haven't sent DBIRTH today?"
  - "Summarize payloads for sensors/+/temperature"
- **Intelligent Payload Classification**:
  - Intent detection (telemetry, commands, alarms, configs)
  - Auto-suggest field meanings and units
  - Context-aware analysis
- **Smart Insights Generation**:
  - Network health assessments
  - Performance optimization recommendations
  - Security vulnerability detection
  - Anomaly identification

### 📊 **Advanced Visualizations**
- **Interactive Network Topology** with D3.js/Cytoscape:
  - Real-time broker/client/topic relationships
  - Animated message flows
  - Hierarchical Sparkplug B device trees
- **Live Data Dashboards**:
  - Message frequency charts
  - QoS distribution graphs
  - Connection status heatmaps
  - Metric trend analysis
- **Mind Map Style Topic Exploration**
- **Network Flow Animations** showing real-time MQTT traffic

### 📈 **Monitoring & Analytics**
- **Real-time Message Logging** with filtering and search
- **Performance Metrics**:
  - Message rates and throughput
  - Connection stability tracking
  - Error rate monitoring
  - Bandwidth utilization
- **Historical Data Analysis** with time-range filtering
- **Alert System** for connection issues and anomalies

### 📤 **Export & Reporting**
- **Multi-format Data Export**:
  - JSON, CSV, Excel, YAML formats
  - Network topology maps (PNG, SVG, JSON)
  - Sparkplug B device reports
  - Custom time-range exports
- **AI-Generated Reports** with insights and recommendations
- **Session Replay** capabilities for debugging

### 🎨 **Modern UI/UX**
- **Beautiful, Responsive Design** with dark/light theme support
- **Multiple Panel Layout**:
  - Broker & Client List Panel
  - Interactive Topology View
  - Smart Data Table View
  - Sparkplug Tree View
  - AI Assistant Chat Panel
  - Live Message Log Viewer
- **Customizable Dashboard** with drag-and-drop panels
- **Mobile-Friendly** responsive design

## 🏗️ Architecture

### Backend (Node.js + Express)
```
server/
├── index.js                 # Main server entry point
├── services/                # Core business logic
│   ├── mqttDiscovery.js     # Network scanning & broker discovery
│   ├── mqttClientManager.js # MQTT connection management
│   ├── sparkplugDecoder.js  # Protobuf decoding for Sparkplug B
│   ├── aiService.js         # GPT-4 integration & AI analysis
│   ├── networkScanner.js    # Advanced network discovery
│   └── dataExporter.js      # Multi-format data export
├── routes/                  # API endpoints
│   ├── api.js              # General system APIs
│   ├── mqtt.js             # MQTT-specific APIs
│   └── ai.js               # AI service APIs
└── .env.example            # Environment configuration
```

### Frontend (React + TailwindCSS)
```
client/
├── src/
│   ├── components/         # React components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── store/             # State management (Zustand)
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript definitions
├── index.html             # Main HTML template
├── vite.config.js         # Vite build configuration
└── tailwind.config.js     # TailwindCSS theme
```

### Technology Stack

**Backend:**
- **Node.js + Express** - Web server framework
- **Socket.IO** - Real-time WebSocket communication
- **MQTT.js** - MQTT protocol implementation
- **Protobuf.js** - Sparkplug B message decoding
- **OpenAI API** - GPT-4 integration for AI features
- **node-nmap** - Network discovery and port scanning
- **Bonjour/mDNS** - Service discovery

**Frontend:**
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **D3.js + Cytoscape.js** - Interactive network visualizations
- **Zustand** - Lightweight state management
- **Socket.IO Client** - Real-time data updates
- **Framer Motion** - Smooth animations

**DevOps & Deployment:**
- **Docker** - Containerization
- **Docker Compose** - Multi-service orchestration
- **Environment-based Configuration**
- **Production-ready** with PM2 process management

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** and npm
- **Docker & Docker Compose** (optional)
- **OpenAI API Key** (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-repo/mqtt-explore.git
cd mqtt-explore
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install all project dependencies
npm run install:all
```

3. **Configure environment**
```bash
# Copy environment template
cp server/.env.example server/.env

# Edit configuration (add your OpenAI API key)
nano server/.env
```

4. **Start development servers**
```bash
# Start both frontend and backend
npm run dev

# Or start individually
npm run server:dev  # Backend on http://localhost:5000
npm run client:dev  # Frontend on http://localhost:3000
```

5. **Open your browser**
Navigate to `http://localhost:3000` to access MQTT Explore

### Docker Deployment

1. **Build and run with Docker Compose**
```bash
docker-compose up -d
```

2. **Access the application**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## 📖 Usage Guide

### 1. **Network Discovery**
- Click "Start Discovery" to automatically scan for MQTT brokers
- Configure network range, ports, and discovery methods
- View discovered brokers in the Broker List panel

### 2. **Connect to MQTT Brokers**
- Select a discovered broker or add custom connection details
- Configure authentication (username/password, TLS certificates)
- Monitor connection status and metrics

### 3. **Explore Topics & Messages**
- View live topic hierarchy in the Smart Table View
- Monitor real-time message flows in the Topology View
- Filter and search messages in the Message Log Viewer

### 4. **Sparkplug B Analysis**
- Automatic detection and decoding of Sparkplug B messages
- Navigate the Group → Edge Node → Device hierarchy
- Monitor industrial metrics and device health

### 5. **AI Assistant**
- Ask natural language questions about your MQTT network
- Get intelligent insights and recommendations
- Generate automated reports and analysis

### 6. **Data Export**
- Export network data in multiple formats
- Generate network topology diagrams
- Create comprehensive reports for documentation

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# MQTT Discovery
AUTO_START_DISCOVERY=true
DEFAULT_NETWORK_RANGE=192.168.1.0/24
MAX_CONNECTIONS=10

# Security
ENABLE_CORS=true
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
```

### Network Discovery Settings
- **Port Range**: Customize which ports to scan for MQTT brokers
- **Network Range**: Define CIDR ranges for network discovery
- **Discovery Methods**: Enable/disable mDNS, SSDP, port scanning
- **Timeouts**: Configure connection and scan timeouts

### AI Configuration
- **OpenAI API**: Requires valid API key for AI features
- **Local LLM**: Support for local models via LangChain/Ollama
- **Query Suggestions**: Customizable suggested queries

## 🔒 Security Features

- **TLS/SSL Support** for secure MQTT connections
- **Certificate Management** for client authentication
- **Data Sanitization** before AI processing
- **Rate Limiting** on API endpoints
- **CORS Protection** with configurable origins
- **Input Validation** and sanitization

## 🧪 Testing Mode

MQTT Explore includes a built-in testing mode with:
- **Mock MQTT Broker** using Aedes
- **Simulated Sparkplug B Clients** with fake device metrics
- **Synthetic Traffic Generation** for testing visualizations
- **Network Simulation** tools for development

## 📊 API Documentation

### REST API Endpoints

**System Status**
- `GET /api/status` - System health and service status
- `GET /api/metrics` - Performance metrics

**MQTT Management**
- `POST /api/mqtt/connect` - Connect to MQTT broker
- `GET /api/mqtt/connections` - List active connections
- `POST /api/mqtt/subscribe` - Subscribe to topic
- `POST /api/mqtt/publish` - Publish message

**AI Services**
- `POST /api/ai/query` - Process natural language query
- `POST /api/ai/insights` - Generate network insights
- `POST /api/ai/classify` - Classify message payload

**Data Export**
- `POST /api/export` - Export data in various formats
- `GET /api/export/history` - Export history

### WebSocket Events

**Real-time Updates**
- `broker-discovered` - New MQTT broker found
- `mqtt-message` - Live MQTT message received
- `connection-status` - Connection state changes
- `ai-response` - AI query results

## 🛠️ Development

### Project Structure
```
mqtt-explore/
├── server/               # Backend Node.js application
├── client/               # Frontend React application
├── docker-compose.yml    # Container orchestration
├── package.json          # Root package configuration
└── README.md            # This file
```

### Development Workflow
1. **Backend**: Server runs on port 5000 with hot reload
2. **Frontend**: Vite dev server on port 3000 with HMR
3. **Proxy**: Frontend proxies API calls to backend
4. **Real-time**: Socket.IO for live data updates

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🐳 Docker Support

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Custom Images
```bash
# Build custom images
docker build -t mqtt-explore-server ./server
docker build -t mqtt-explore-client ./client
```

## 🚀 Deployment Options

### Traditional Server
1. Install Node.js and dependencies
2. Build frontend: `npm run build`
3. Start with PM2: `pm2 start ecosystem.config.js`

### Docker Container
1. Use provided Docker Compose files
2. Configure environment variables
3. Deploy with `docker-compose up -d`

### Kubernetes
1. Use provided Kubernetes manifests
2. Configure secrets and config maps
3. Deploy with `kubectl apply -f k8s/`

## 🔍 Troubleshooting

### Common Issues

**Connection Problems**
- Verify network connectivity to MQTT brokers
- Check firewall settings for ports 1883/8883
- Validate authentication credentials

**Discovery Issues**
- Ensure nmap is installed for port scanning
- Check network permissions for discovery tools
- Verify multicast support for mDNS

**AI Features Not Working**
- Verify OpenAI API key is configured
- Check API quota and billing status
- Ensure internet connectivity for API calls

**Performance Issues**
- Adjust message buffer sizes
- Limit concurrent connections
- Monitor memory usage and tune accordingly

### Logs and Debugging
```bash
# Server logs
npm run server:dev

# Enable debug logging
DEBUG=mqtt-explore:* npm run server:dev

# Docker logs
docker-compose logs -f
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📞 Support

- **Documentation**: [docs.mqtt-explore.com](https://docs.mqtt-explore.com)
- **Issues**: [GitHub Issues](https://github.com/your-repo/mqtt-explore/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/mqtt-explore/discussions)
- **Email**: support@mqtt-explore.com

## 🏆 Acknowledgments

- **MQTT.js** - Excellent MQTT implementation
- **Sparkplug Working Group** - Industrial IoT standards
- **OpenAI** - AI capabilities and GPT-4 API
- **Open Source Community** - All the amazing libraries used

---

**Built with ❤️ for the IoT and Industrial Automation community**

*MQTT Explore - Making MQTT networks visible, understandable, and manageable.*