const { EventEmitter } = require('events');
const nmap = require('node-nmap');
const bonjour = require('bonjour')();
const ssdp = require('node-ssdp').Client;
const ping = require('ping');
const net = require('net');

class MQTTDiscoveryService extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.discoveredBrokers = new Map();
    this.isDiscovering = false;
    this.discoveryInterval = null;
    this.scanOptions = {
      portRange: '1883,8883,1884,8884,1888,8888',
      customPorts: [],
      networkRange: '192.168.1.1/24',
      timeout: 5000,
      enableMDNS: true,
      enableSSDP: true,
      enablePortScan: true,
      enableFingerprinting: true
    };

    this.setupMDNSDiscovery();
    this.setupSSDP();
  }

  setupMDNSDiscovery() {
    // Listen for MQTT services via mDNS/Bonjour
    bonjour.find({ type: 'mqtt' }, (service) => {
      this.handleDiscoveredBroker({
        id: `mdns-${service.name}`,
        host: service.host || service.addresses[0],
        port: service.port || 1883,
        name: service.name,
        type: 'mDNS',
        protocol: service.port === 8883 ? 'mqtts' : 'mqtt',
        txt: service.txt || {},
        discovered: new Date()
      });
    });

    // Also listen for generic TCP services that might be MQTT
    bonjour.find({ type: 'tcp' }, (service) => {
      if (this.isMQTTPort(service.port)) {
        this.handleDiscoveredBroker({
          id: `mdns-tcp-${service.name}`,
          host: service.host || service.addresses[0],
          port: service.port,
          name: service.name,
          type: 'mDNS-TCP',
          protocol: service.port === 8883 ? 'mqtts' : 'mqtt',
          txt: service.txt || {},
          discovered: new Date()
        });
      }
    });
  }

  setupSSDP() {
    const client = new ssdp();
    
    client.on('response', (headers, statusCode, rinfo) => {
      if (headers.ST && headers.ST.includes('mqtt')) {
        this.handleDiscoveredBroker({
          id: `ssdp-${rinfo.address}`,
          host: rinfo.address,
          port: this.extractPortFromHeaders(headers) || 1883,
          name: headers.SERVER || 'SSDP Discovered',
          type: 'SSDP',
          protocol: 'mqtt',
          headers: headers,
          discovered: new Date()
        });
      }
    });
  }

  startDiscovery(options = {}) {
    this.scanOptions = { ...this.scanOptions, ...options };
    this.isDiscovering = true;

    console.log('🔍 Starting MQTT broker discovery...');
    this.io.emit('discovery-started', { options: this.scanOptions });

    // Start continuous discovery
    this.runDiscoveryRound();
    this.discoveryInterval = setInterval(() => {
      this.runDiscoveryRound();
    }, 30000); // Every 30 seconds

    return this.getDiscoveredBrokers();
  }

  stopDiscovery() {
    this.isDiscovering = false;
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = null;
    }
    console.log('⏹️  MQTT broker discovery stopped');
    this.io.emit('discovery-stopped');
  }

  async runDiscoveryRound() {
    if (!this.isDiscovering) return;

    const promises = [];

    // Port scanning
    if (this.scanOptions.enablePortScan) {
      promises.push(this.performPortScan());
    }

    // Active fingerprinting
    if (this.scanOptions.enableFingerprinting) {
      promises.push(this.performMQTTFingerprinting());
    }

    // Network ping sweep
    promises.push(this.performPingSweep());

    try {
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Discovery round error:', error);
      this.io.emit('discovery-error', { error: error.message });
    }
  }

  async performPortScan() {
    return new Promise((resolve, reject) => {
      const ports = this.scanOptions.portRange.split(',').concat(this.scanOptions.customPorts);
      
      nmap.scan({
        range: [this.scanOptions.networkRange],
        ports: ports.join(','),
        timeout: this.scanOptions.timeout
      }, (err, report) => {
        if (err) {
          console.error('Port scan error:', err);
          return reject(err);
        }

        for (let host of report) {
          for (let port of host.openPorts) {
            if (this.isMQTTPort(port.port)) {
              this.handleDiscoveredBroker({
                id: `portscan-${host.ip}-${port.port}`,
                host: host.ip,
                port: parseInt(port.port),
                name: host.hostname || `MQTT-${host.ip}`,
                type: 'Port Scan',
                protocol: port.port === 8883 || port.port === 8884 ? 'mqtts' : 'mqtt',
                service: port.service,
                discovered: new Date()
              });
            }
          }
        }
        resolve();
      });
    });
  }

  async performMQTTFingerprinting() {
    const brokers = Array.from(this.discoveredBrokers.values());
    
    for (const broker of brokers) {
      if (!broker.fingerprinted) {
        try {
          const fingerprint = await this.fingerprintMQTTBroker(broker.host, broker.port);
          broker.fingerprint = fingerprint;
          broker.fingerprinted = true;
          
          this.io.emit('broker-updated', broker);
        } catch (error) {
          console.error(`Fingerprinting failed for ${broker.host}:${broker.port}`, error);
        }
      }
    }
  }

  async fingerprintMQTTBroker(host, port) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      let fingerprint = {
        responsive: false,
        brokerInfo: null,
        protocolVersion: null,
        features: []
      };

      socket.setTimeout(this.scanOptions.timeout);

      socket.connect(port, host, () => {
        fingerprint.responsive = true;

        // Send MQTT CONNECT packet to probe the broker
        const connectPacket = Buffer.from([
          0x10, 0x2a, // Fixed header: CONNECT (0x10), Remaining Length (42)
          0x00, 0x04, 'M', 'Q', 'T', 'T', // Protocol Name
          0x04, // Protocol Level (MQTT 3.1.1)
          0x02, // Connect Flags (Clean Session)
          0x00, 0x3c, // Keep Alive (60 seconds)
          0x00, 0x16, // Client ID Length (22)
          'M', 'Q', 'T', 'T', 'E', 'x', 'p', 'l', 'o', 'r', 'e', 'P', 'r', 'o', 'b', 'e', '1', '2', '3', '4', '5', '6'
        ]);

        socket.write(connectPacket);
      });

      socket.on('data', (data) => {
        try {
          // Parse CONNACK response
          if (data.length >= 4 && data[0] === 0x20) {
            fingerprint.protocolVersion = 'MQTT';
            const returnCode = data[3];
            
            switch (returnCode) {
              case 0:
                fingerprint.features.push('Accepts anonymous connections');
                break;
              case 4:
                fingerprint.features.push('Requires authentication');
                break;
              case 5:
                fingerprint.features.push('Authorization required');
                break;
            }
          }
        } catch (error) {
          console.error('Error parsing MQTT response:', error);
        }
        
        socket.end();
        resolve(fingerprint);
      });

      socket.on('error', (error) => {
        reject(error);
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
  }

  async performPingSweep() {
    const network = this.scanOptions.networkRange.split('/')[0];
    const baseIp = network.substring(0, network.lastIndexOf('.'));
    
    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const ip = `${baseIp}.${i}`;
      promises.push(this.pingHost(ip));
    }

    const results = await Promise.allSettled(promises);
    const aliveHosts = results
      .filter(result => result.status === 'fulfilled' && result.value.alive)
      .map(result => result.value.host);

    // For alive hosts, try common MQTT ports
    for (const host of aliveHosts) {
      const commonPorts = [1883, 8883, 1884, 8884];
      for (const port of commonPorts) {
        try {
          const isOpen = await this.checkPort(host, port);
          if (isOpen) {
            this.handleDiscoveredBroker({
              id: `ping-${host}-${port}`,
              host: host,
              port: port,
              name: `Discovered-${host}`,
              type: 'Ping Sweep',
              protocol: port === 8883 || port === 8884 ? 'mqtts' : 'mqtt',
              discovered: new Date()
            });
          }
        } catch (error) {
          // Port is closed or filtered
        }
      }
    }
  }

  async pingHost(host) {
    const result = await ping.promise.probe(host, { timeout: 1 });
    return { host, alive: result.alive };
  }

  async checkPort(host, port) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);

      socket.connect(port, host, () => {
        socket.end();
        resolve(true);
      });

      socket.on('error', () => {
        resolve(false);
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
    });
  }

  handleDiscoveredBroker(brokerInfo) {
    const existingBroker = this.discoveredBrokers.get(brokerInfo.id);
    
    if (existingBroker) {
      // Update last seen timestamp
      existingBroker.lastSeen = new Date();
      existingBroker.seenCount = (existingBroker.seenCount || 1) + 1;
    } else {
      // New broker discovered
      brokerInfo.lastSeen = new Date();
      brokerInfo.seenCount = 1;
      brokerInfo.status = 'discovered';
      
      this.discoveredBrokers.set(brokerInfo.id, brokerInfo);
      
      console.log(`🎯 New MQTT broker discovered: ${brokerInfo.host}:${brokerInfo.port} (${brokerInfo.type})`);
      this.io.emit('broker-discovered', brokerInfo);
    }

    this.emit('broker-discovered', brokerInfo);
  }

  isMQTTPort(port) {
    const mqttPorts = [1883, 8883, 1884, 8884, 1888, 8888];
    return mqttPorts.includes(parseInt(port)) || 
           this.scanOptions.customPorts.includes(parseInt(port));
  }

  extractPortFromHeaders(headers) {
    if (headers.LOCATION) {
      const match = headers.LOCATION.match(/:(\d+)/);
      return match ? parseInt(match[1]) : null;
    }
    return null;
  }

  getDiscoveredBrokers() {
    return Array.from(this.discoveredBrokers.values());
  }

  getBrokerById(id) {
    return this.discoveredBrokers.get(id);
  }

  removeBroker(id) {
    const removed = this.discoveredBrokers.delete(id);
    if (removed) {
      this.io.emit('broker-removed', { id });
    }
    return removed;
  }

  getDiscoveryStatus() {
    return {
      isDiscovering: this.isDiscovering,
      brokerCount: this.discoveredBrokers.size,
      options: this.scanOptions
    };
  }
}

module.exports = MQTTDiscoveryService;