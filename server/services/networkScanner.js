const { EventEmitter } = require('events');
const nmap = require('node-nmap');
const ping = require('ping');
const net = require('net');

class NetworkScanner extends EventEmitter {
  constructor(io) {
    super();
    this.io = io;
    this.isScanning = false;
    this.scanResults = new Map();
    this.scanHistory = [];
    this.maxHistoryEntries = 100;
  }

  async startScan(options = {}) {
    if (this.isScanning) {
      throw new Error('Scan already in progress');
    }

    this.isScanning = true;
    const scanId = `scan_${Date.now()}`;
    
    const defaultOptions = {
      target: '192.168.1.0/24',
      ports: '1883,8883,1884,8884,1888,8888,80,443,22,502,102',
      timeout: 10000,
      intensive: false,
      serviceDetection: true,
      osDetection: false
    };

    const scanOptions = { ...defaultOptions, ...options };
    
    console.log(`🔍 Starting network scan: ${scanOptions.target}`);
    this.io.emit('network-scan-started', { scanId, options: scanOptions });

    try {
      const results = await this.performComprehensiveScan(scanOptions, scanId);
      
      this.scanResults.set(scanId, {
        id: scanId,
        options: scanOptions,
        results: results,
        timestamp: new Date(),
        duration: Date.now() - parseInt(scanId.split('_')[1])
      });

      this.addToHistory(scanId, results);
      this.isScanning = false;

      console.log(`✅ Network scan completed: ${results.hosts.length} hosts found`);
      this.io.emit('network-scan-completed', { scanId, results });

      return results;

    } catch (error) {
      this.isScanning = false;
      console.error('Network scan failed:', error);
      this.io.emit('network-scan-error', { scanId, error: error.message });
      throw error;
    }
  }

  async performComprehensiveScan(options, scanId) {
    const results = {
      hosts: [],
      mqttBrokers: [],
      webServices: [],
      industrialDevices: [],
      summary: {
        totalHosts: 0,
        mqttBrokers: 0,
        webServices: 0,
        industrialDevices: 0,
        unknownServices: 0
      }
    };

    // Emit progress updates
    this.io.emit('network-scan-progress', { scanId, phase: 'host-discovery', progress: 0 });

    // Phase 1: Host Discovery
    const aliveHosts = await this.discoverHosts(options.target);
    this.io.emit('network-scan-progress', { scanId, phase: 'host-discovery', progress: 100 });

    results.summary.totalHosts = aliveHosts.length;

    // Phase 2: Port Scanning
    this.io.emit('network-scan-progress', { scanId, phase: 'port-scanning', progress: 0 });
    
    for (let i = 0; i < aliveHosts.length; i++) {
      const host = aliveHosts[i];
      const progress = Math.round((i / aliveHosts.length) * 100);
      
      this.io.emit('network-scan-progress', { 
        scanId, 
        phase: 'port-scanning', 
        progress,
        currentHost: host.ip 
      });

      try {
        const hostInfo = await this.scanHost(host.ip, options);
        results.hosts.push(hostInfo);

        // Categorize discovered services
        this.categorizeHost(hostInfo, results);

      } catch (error) {
        console.error(`Failed to scan host ${host.ip}:`, error);
      }
    }

    // Phase 3: Service Detection (if enabled)
    if (options.serviceDetection) {
      this.io.emit('network-scan-progress', { scanId, phase: 'service-detection', progress: 0 });
      await this.performServiceDetection(results, scanId);
    }

    this.io.emit('network-scan-progress', { scanId, phase: 'completed', progress: 100 });

    return results;
  }

  async discoverHosts(target) {
    const hosts = [];
    
    if (target.includes('/')) {
      // CIDR range scanning
      const [baseIp, mask] = target.split('/');
      const maskBits = parseInt(mask);
      
      if (maskBits >= 24) {
        // For /24 networks and smaller, ping all IPs
        const baseOctets = baseIp.split('.').slice(0, 3);
        const promises = [];
        
        for (let i = 1; i <= 254; i++) {
          const ip = `${baseOctets.join('.')}.${i}`;
          promises.push(this.pingHost(ip));
        }

        const results = await Promise.allSettled(promises);
        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.alive) {
            hosts.push(result.value);
          }
        });
      } else {
        // For larger networks, use nmap for efficiency
        return this.nmapHostDiscovery(target);
      }
    } else {
      // Single host
      const result = await this.pingHost(target);
      if (result.alive) {
        hosts.push(result);
      }
    }

    return hosts;
  }

  async nmapHostDiscovery(target) {
    return new Promise((resolve, reject) => {
      nmap.discover(target, (error, report) => {
        if (error) {
          return reject(error);
        }

        const hosts = report.map(host => ({
          ip: host.ip,
          hostname: host.hostname,
          alive: true,
          mac: host.mac,
          vendor: host.vendor
        }));

        resolve(hosts);
      });
    });
  }

  async pingHost(ip) {
    try {
      const result = await ping.promise.probe(ip, { timeout: 2 });
      return {
        ip: ip,
        hostname: result.host,
        alive: result.alive,
        time: result.time
      };
    } catch (error) {
      return { ip: ip, alive: false, error: error.message };
    }
  }

  async scanHost(ip, options) {
    return new Promise((resolve, reject) => {
      const ports = options.ports.split(',').map(p => p.trim());
      
      nmap.scan({
        range: [ip],
        ports: ports.join(','),
        timeout: options.timeout
      }, (error, report) => {
        if (error) {
          return reject(error);
        }

        if (report.length === 0) {
          return resolve({
            ip: ip,
            hostname: null,
            openPorts: [],
            services: [],
            os: null
          });
        }

        const host = report[0];
        const hostInfo = {
          ip: host.ip,
          hostname: host.hostname,
          openPorts: host.openPorts || [],
          services: [],
          os: host.osNmap || null,
          mac: host.mac,
          vendor: host.vendor
        };

        // Process open ports and detect services
        hostInfo.openPorts.forEach(port => {
          const service = this.identifyService(port.port, port.service);
          hostInfo.services.push(service);
        });

        resolve(hostInfo);
      });
    });
  }

  identifyService(port, serviceName) {
    const service = {
      port: parseInt(port),
      name: serviceName || 'unknown',
      type: 'unknown',
      confidence: 'low',
      details: {}
    };

    // MQTT brokers
    if ([1883, 8883, 1884, 8884, 1888, 8888].includes(service.port)) {
      service.type = 'mqtt';
      service.name = service.port === 8883 ? 'mqtts' : 'mqtt';
      service.confidence = 'high';
    }
    // Web services
    else if ([80, 443, 8080, 8443].includes(service.port)) {
      service.type = 'web';
      service.name = service.port === 443 || service.port === 8443 ? 'https' : 'http';
      service.confidence = 'high';
    }
    // Industrial protocols
    else if (service.port === 502) {
      service.type = 'industrial';
      service.name = 'modbus';
      service.confidence = 'medium';
    }
    else if (service.port === 102) {
      service.type = 'industrial';
      service.name = 's7comm';
      service.confidence = 'medium';
    }
    else if (service.port === 44818) {
      service.type = 'industrial';
      service.name = 'opc-ua';
      service.confidence = 'medium';
    }
    // SSH
    else if (service.port === 22) {
      service.type = 'management';
      service.name = 'ssh';
      service.confidence = 'high';
    }

    return service;
  }

  categorizeHost(hostInfo, results) {
    let isMqttBroker = false;
    let isWebService = false;
    let isIndustrialDevice = false;

    hostInfo.services.forEach(service => {
      switch (service.type) {
        case 'mqtt':
          isMqttBroker = true;
          break;
        case 'web':
          isWebService = true;
          break;
        case 'industrial':
          isIndustrialDevice = true;
          break;
      }
    });

    if (isMqttBroker) {
      results.mqttBrokers.push(hostInfo);
      results.summary.mqttBrokers++;
    }

    if (isWebService) {
      results.webServices.push(hostInfo);
      results.summary.webServices++;
    }

    if (isIndustrialDevice) {
      results.industrialDevices.push(hostInfo);
      results.summary.industrialDevices++;
    }

    if (!isMqttBroker && !isWebService && !isIndustrialDevice && hostInfo.services.length > 0) {
      results.summary.unknownServices++;
    }
  }

  async performServiceDetection(results, scanId) {
    const mqttBrokers = results.mqttBrokers;
    
    for (let i = 0; i < mqttBrokers.length; i++) {
      const broker = mqttBrokers[i];
      const progress = Math.round((i / mqttBrokers.length) * 100);
      
      this.io.emit('network-scan-progress', { 
        scanId, 
        phase: 'service-detection', 
        progress,
        currentHost: broker.ip 
      });

      // Test MQTT connectivity for discovered brokers
      for (const service of broker.services) {
        if (service.type === 'mqtt') {
          try {
            const mqttInfo = await this.probeMQTTBroker(broker.ip, service.port);
            service.details = mqttInfo;
            service.confidence = 'high';
          } catch (error) {
            service.details = { error: error.message };
          }
        }
      }
    }
  }

  async probeMQTTBroker(host, port) {
    return new Promise((resolve, reject) => {
      const socket = new net.Socket();
      const timeout = 5000;
      
      socket.setTimeout(timeout);

      const probeInfo = {
        responsive: false,
        protocolVersion: null,
        authRequired: null,
        features: []
      };

      socket.connect(port, host, () => {
        probeInfo.responsive = true;

        // Send MQTT CONNECT packet
        const connectPacket = Buffer.from([
          0x10, 0x2a, // Fixed header: CONNECT, Remaining Length
          0x00, 0x04, 'M', 'Q', 'T', 'T', // Protocol Name
          0x04, // Protocol Level (MQTT 3.1.1)
          0x02, // Connect Flags (Clean Session)
          0x00, 0x3c, // Keep Alive (60 seconds)
          0x00, 0x16, // Client ID Length
          'N', 'e', 't', 'w', 'o', 'r', 'k', 'S', 'c', 'a', 'n', 'n', 'e', 'r', '1', '2', '3', '4', '5', '6', '7', '8'
        ]);

        socket.write(connectPacket);
      });

      socket.on('data', (data) => {
        try {
          if (data.length >= 4 && data[0] === 0x20) { // CONNACK
            probeInfo.protocolVersion = 'MQTT 3.1.1';
            const returnCode = data[3];
            
            switch (returnCode) {
              case 0:
                probeInfo.authRequired = false;
                probeInfo.features.push('Anonymous access allowed');
                break;
              case 4:
                probeInfo.authRequired = true;
                probeInfo.features.push('Authentication required');
                break;
              case 5:
                probeInfo.authRequired = true;
                probeInfo.features.push('Authorization required');
                break;
              default:
                probeInfo.features.push(`Connection refused (code: ${returnCode})`);
            }
          }
        } catch (error) {
          console.error('Error parsing MQTT response:', error);
        }
        
        socket.end();
        resolve(probeInfo);
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

  stopScan() {
    this.isScanning = false;
    console.log('⏹️  Network scan stopped');
    this.io.emit('network-scan-stopped');
  }

  addToHistory(scanId, results) {
    this.scanHistory.unshift({
      id: scanId,
      timestamp: new Date(),
      summary: results.summary,
      hostsFound: results.hosts.length
    });

    // Keep history manageable
    if (this.scanHistory.length > this.maxHistoryEntries) {
      this.scanHistory = this.scanHistory.slice(0, this.maxHistoryEntries);
    }
  }

  getScanResults(scanId) {
    return this.scanResults.get(scanId);
  }

  getAllScanResults() {
    return Array.from(this.scanResults.values());
  }

  getScanHistory() {
    return this.scanHistory;
  }

  clearHistory() {
    this.scanHistory = [];
    this.scanResults.clear();
  }

  isScanning() {
    return this.isScanning;
  }

  getStatus() {
    return {
      isScanning: this.isScanning,
      totalScans: this.scanResults.size,
      historyEntries: this.scanHistory.length
    };
  }

  // Quick network health check
  async quickHealthCheck(targets = ['8.8.8.8', '1.1.1.1']) {
    const results = {
      internetAccess: false,
      dnsResolution: false,
      averageLatency: null,
      timestamp: new Date()
    };

    try {
      const pingPromises = targets.map(target => this.pingHost(target));
      const pingResults = await Promise.allSettled(pingPromises);
      
      const successfulPings = pingResults
        .filter(result => result.status === 'fulfilled' && result.value.alive)
        .map(result => result.value);

      if (successfulPings.length > 0) {
        results.internetAccess = true;
        results.dnsResolution = true;
        
        const totalTime = successfulPings.reduce((sum, ping) => sum + (ping.time || 0), 0);
        results.averageLatency = totalTime / successfulPings.length;
      }

    } catch (error) {
      console.error('Network health check failed:', error);
    }

    return results;
  }
}

module.exports = NetworkScanner;