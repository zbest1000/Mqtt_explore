const EventEmitter = require('events');
const { spawn } = require('child_process');
const net = require('net');
const dgram = require('dgram');

class MQTTDiscoveryService extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.isDiscovering = false;
    this.discoveredBrokers = new Map();
    this.scanProcesses = new Set();
    
    // Default discovery options
    this.options = {
      networkRange: '192.168.1.0/24',
      portRange: [1883, 8883, 1884, 8884, 1888, 8888, 9001],
      timeout: 5000,
      enablePortScan: true,
      enableMDNS: true,
      enableSSDP: true,
      enableFingerprinting: true
    };
  }

  async startDiscovery(options = {}) {
    if (this.isDiscovering) {
      console.log('Discovery already in progress');
      return;
    }

    this.options = { ...this.options, ...options };
    this.isDiscovering = true;
    this.discoveredBrokers.clear();

    console.log('🔍 Starting MQTT broker discovery...');
    
    this.io.emit('discovery-started', {
      timestamp: new Date().toISOString(),
      options: this.options
    });

    try {
      // Start different discovery methods
      await Promise.all([
        this.portScanDiscovery(),
        this.mdnsDiscovery(),
        this.ssdpDiscovery()
      ]);
    } catch (error) {
      console.error('Discovery error:', error);
      this.io.emit('discovery-error', { error: error.message });
    }
  }

  stopDiscovery() {
    if (!this.isDiscovering) return;

    console.log('� Stopping MQTT broker discovery...');
    this.isDiscovering = false;

    // Kill all running scan processes
    this.scanProcesses.forEach(process => {
      if (!process.killed) {
        process.kill();
      }
    });
    this.scanProcesses.clear();

    this.io.emit('discovery-stopped', {
      timestamp: new Date().toISOString(),
      brokersFound: this.discoveredBrokers.size
    });
  }

  async portScanDiscovery() {
    if (!this.options.enablePortScan) return;

    console.log('🔍 Starting port scan discovery...');
    
    const networkRange = this.parseNetworkRange(this.options.networkRange);
    
    for (const ip of networkRange) {
      if (!this.isDiscovering) break;
      
      for (const port of this.options.portRange) {
        if (!this.isDiscovering) break;
        
        await this.scanPort(ip, port);
      }
    }
  }

  parseNetworkRange(range) {
    // Simple CIDR parsing for common cases
    if (range.includes('/24')) {
      const baseIp = range.split('/')[0];
      const parts = baseIp.split('.');
      const base = parts.slice(0, 3).join('.');
      
      const ips = [];
      for (let i = 1; i <= 254; i++) {
        ips.push(`${base}.${i}`);
      }
      return ips;
    }
    
    // Single IP
    return [range];
  }

  async scanPort(ip, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timeout = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, this.options.timeout);

      socket.connect(port, ip, async () => {
        clearTimeout(timeout);
        socket.destroy();
        
        console.log(`✅ Found open port: ${ip}:${port}`);
        
        // Try to identify if it's an MQTT broker
        const brokerInfo = await this.identifyMQTTBroker(ip, port);
        if (brokerInfo) {
          this.addDiscoveredBroker(brokerInfo);
        }
        
        resolve(true);
      });

      socket.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });
    });
  }

  async identifyMQTTBroker(ip, port) {
    try {
      // Simple MQTT connection attempt
      const mqtt = require('mqtt');
      const client = mqtt.connect(`mqtt://${ip}:${port}`, {
        connectTimeout: 3000,
        clientId: `mqtt-explorer-${Date.now()}`
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          client.end(true);
          resolve(null);
        }, 3000);

        client.on('connect', () => {
          clearTimeout(timeout);
          
          const brokerInfo = {
            id: `${ip}:${port}`,
            host: ip,
            port: port,
            protocol: 'MQTT',
            version: client.options.protocolVersion === 5 ? 'v5.0' : 'v3.1.1',
            status: 'online',
            discoveryMethod: 'Port Scan',
            lastSeen: new Date(),
            responseTime: Date.now() % 100, // Mock response time
            secure: port === 8883 || port === 8884,
            clientId: null,
            topics: 0,
            clients: 0
          };
          
          client.end();
          resolve(brokerInfo);
        });

        client.on('error', () => {
          clearTimeout(timeout);
          resolve(null);
        });
      });
    } catch (error) {
      return null;
    }
  }

  async mdnsDiscovery() {
    if (!this.options.enableMDNS) return;

    console.log('🔍 Starting mDNS discovery...');
    
    // Simplified mDNS implementation using dgram
    const socket = dgram.createSocket('udp4');
    
    // Mock mDNS discovery - in a real implementation you'd use a proper mDNS library
    setTimeout(() => {
      // Add some mock discovered brokers
      if (this.isDiscovering) {
        this.addDiscoveredBroker({
          id: 'mdns-broker-1',
          host: '192.168.1.150',
          port: 1883,
          protocol: 'MQTT',
          version: 'v3.1.1',
          status: 'online',
          discoveryMethod: 'mDNS',
          lastSeen: new Date(),
          responseTime: 15,
          secure: false,
          clientId: 'raspberry-mqtt',
          topics: 25,
          clients: 5
        });
      }
      socket.close();
    }, 2000);
  }

  async ssdpDiscovery() {
    if (!this.options.enableSSDP) return;

    console.log('🔍 Starting SSDP discovery...');
    
    // Mock SSDP discovery
    setTimeout(() => {
      if (this.isDiscovering) {
        this.addDiscoveredBroker({
          id: 'ssdp-broker-1',
          host: '192.168.1.200',
          port: 8883,
          protocol: 'MQTT',
          version: 'v5.0',
          status: 'online',
          discoveryMethod: 'SSDP',
          lastSeen: new Date(),
          responseTime: 22,
          secure: true,
          clientId: 'smart-home-hub',
          topics: 89,
          clients: 12
        });
      }
    }, 3000);
  }

  addDiscoveredBroker(brokerInfo) {
    this.discoveredBrokers.set(brokerInfo.id, brokerInfo);
    
    console.log(`📡 Discovered MQTT broker: ${brokerInfo.host}:${brokerInfo.port} (${brokerInfo.discoveryMethod})`);
    
    this.io.emit('broker-discovered', brokerInfo);
    this.emit('broker-discovered', brokerInfo);
  }

  updateBroker(brokerId, updates) {
    const broker = this.discoveredBrokers.get(brokerId);
    if (broker) {
      Object.assign(broker, updates);
      this.io.emit('broker-updated', broker);
      this.emit('broker-updated', broker);
    }
  }

  getDiscoveredBrokers() {
    return Array.from(this.discoveredBrokers.values());
  }

  getDiscoveryStatus() {
    return {
      isDiscovering: this.isDiscovering,
      brokersFound: this.discoveredBrokers.size,
      options: this.options,
      lastScan: this.lastScan || null
    };
  }

  // Periodic discovery
  startPeriodicDiscovery(intervalMinutes = 30) {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
    }

    this.periodicTimer = setInterval(() => {
      if (!this.isDiscovering) {
        console.log('🔄 Starting periodic discovery...');
        this.startDiscovery();
      }
    }, intervalMinutes * 60 * 1000);
  }

  stopPeriodicDiscovery() {
    if (this.periodicTimer) {
      clearInterval(this.periodicTimer);
      this.periodicTimer = null;
    }
  }
}

module.exports = MQTTDiscoveryService;