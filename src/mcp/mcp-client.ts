// ===============================================
// MCP CLIENT FOR EXTERNAL DATA INTEGRATION
// Connects to Model Context Protocol servers
// ===============================================

import { spawn, ChildProcess } from 'child_process';

export interface MCPConnection {
  transport: 'stdio' | 'websocket';
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPResource {
  uri: string;
  name: string;
  description: string;
}

export interface MCPResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export class MCPClient {
  private process: ChildProcess | null = null;
  private messageId = 0;
  private pendingRequests = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }>();

  constructor(private connection: MCPConnection) {}

  async connect(): Promise<void> {
    console.log('🔌 Connecting to MCP server...');
    console.log(`   Command: ${this.connection.command}`);
    console.log(`   Args: ${this.connection.args.join(' ')}`);
    
    try {
      this.process = spawn(this.connection.command, this.connection.args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, ...this.connection.env }
      });

      if (!this.process.stdout || !this.process.stdin) {
        throw new Error('Failed to establish stdio connection');
      }

      // Handle responses
      this.process.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter((line: string) => line.trim());
        for (const line of lines) {
          try {
            //console.log(`📥 Received: ${line}`);
            console.log(`📥 Received data.`);
            const response = JSON.parse(line);
            this.handleResponse(response);
          } catch (error) {
            //console.log(`📡 MCP Server output: ${line}`);
            console.log(`📡 MCP Server error: ${error}`);
          }
        }
      });

      this.process.stderr?.on('data', (data) => {
        console.log(`🔍 MCP Server debug: ${data.toString()}`);
      });

      this.process.on('error', (error) => {
        console.error('❌ MCP Server error:', error);
      });

      // Initialize the connection
      await this.initialize();
      console.log('✅ MCP server connected successfully');

    } catch (error) {
      console.error('❌ Failed to connect to MCP server:', error);
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    // Send initialization request
    const initRequest = {
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'llm-orchestration-mcp-client',
          version: '1.0.0'
        }
      }
    };

    await this.sendRequest(initRequest);

    // Send initialized notification
    const initializedNotification = {
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    };

    this.sendNotification(initializedNotification);
  }

  async listTools(): Promise<MCPTool[]> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/list'
    });

    return response.tools || [];
  }

  async listResources(): Promise<MCPResource[]> {
    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'resources/list'
    });

    return response.resources || [];
  }

  async callTool(name: string, arguments_?: Record<string, any>): Promise<any> {
    console.log(`🛠️ Calling MCP tool: ${name}`);
    if (arguments_) {
      console.log(`   Parameters: ${JSON.stringify(arguments_, null, 2)}`);
    }

    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'tools/call',
      params: {
        name,
        arguments: arguments_ || {}
      }
    });

    console.log(`✅ Tool response received from ${name}`);
    return response;
  }

  async readResource(uri: string): Promise<any> {
    console.log(`📖 Reading MCP resource: ${uri}`);

    const response = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.getNextId(),
      method: 'resources/read',
      params: {
        uri
      }
    });

    console.log(`✅ Resource data received from ${uri}`);
    return response;
  }

  private async sendRequest(request: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process?.stdin) {
        reject(new Error('MCP connection not established'));
        return;
      }

      const id = request.id;
      console.log(`🔄 Sending MCP request ID: ${id}, method: ${request.method}`);
      
      if (id) {
        this.pendingRequests.set(id, { resolve, reject });
        
        // Set timeout for requests
        setTimeout(() => {
          if (this.pendingRequests.has(id)) {
            this.pendingRequests.delete(id);
            console.log(`⏰ MCP request ${id} (${request.method}) timed out after 30 seconds`);
            reject(new Error(`MCP request timeout for ID: ${id} after 30 seconds`));
          }
        }, 30000); // Increased from 10 to 30 seconds
      }

      const message = JSON.stringify(request) + '\n';
      console.log(`📤 Sending: ${message.trim()}`);
      this.process.stdin.write(message);

      if (!id) {
        resolve(undefined); // For notifications
      }
    });
  }

  private sendNotification(notification: any): void {
    if (!this.process?.stdin) {
      console.error('❌ Cannot send notification: MCP connection not established');
      return;
    }

    const message = JSON.stringify(notification) + '\n';
    this.process.stdin.write(message);
  }

  private handleResponse(response: MCPResponse): void {
    console.log(`✅ Handling MCP response for ID: ${response.id}`);
    
    if (response.id && this.pendingRequests.has(response.id)) {
      const { resolve, reject } = this.pendingRequests.get(response.id)!;
      this.pendingRequests.delete(response.id);

      if (response.error) {
        console.log(`❌ MCP Error for ID ${response.id}: ${response.error.message}`);
        reject(new Error(`MCP Error: ${response.error.message}`));
      } else {
        console.log(`✅ MCP Success for ID ${response.id}`);
        resolve(response.result);
      }
    } else {
      console.log(`🔔 Received notification or unknown response: ${JSON.stringify(response)}`);
    }
  }

  private getNextId(): string {
    return (++this.messageId).toString();
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      console.log('🔌 Disconnecting from MCP server...');
      this.process.kill();
      this.process = null;
      console.log('✅ MCP server disconnected');
    }
  }
}

// MTConnect-specific MCP client
export class MTConnectMCPClient extends MCPClient {
  constructor() {
    super({
      transport: 'stdio',
      command: 'node',
      args: ['C:/source/llm/mtconnect-mcp-server/debug-wrapper.js'],
      env: {
        'DEBUG_MODE': 'true',
        'DEBUG_PORT': '9229',
        'MCP_MODE': 'true',
        'MTCONNECT_MQTT_HOST': 'mqtt://demo.mtconnect.org:1883',
        'MTCONNECT_QUALITY_ALERTING': 'true',
        'MTCONNECT_MAX_HISTORY': '100',
        'MTCONNECT_QUALITY_THRESHOLD_HEALTHY': '95.0',
        'MTCONNECT_QUALITY_THRESHOLD_DEGRADED': '80.0',
        'MTCONNECT_MQTT_CLIENTID': 'llm-cmp-1'
      }
    });
  }

  // MTConnect-specific helper methods
  async getDevices(): Promise<any> {
    const result = await this.callTool('list_devices');
    return this.parseDeviceResponse(result);
  }

  async getDeviceDetails(deviceId: string): Promise<any> {
    const result = await this.callTool('show_device', { device_id: deviceId });
    return this.parseDeviceResponse(result);
  }

  async getDeviceCurrentState(deviceId: string): Promise<any> {
    const result = await this.callTool('show_device_current_state', { device_id: deviceId });
    return this.parseDeviceResponse(result);
  }

  async getLatestObservations(deviceId: string, minutes: string = '5m'): Promise<any> {
    const result = await this.callTool('show_latest_observations', { 
      device_id: deviceId,
      minutes: minutes
    });
    return this.parseDeviceResponse(result);
  }

  async getObservation(deviceName: string, componentType: string, observationType: string): Promise<any> {
    const result = await this.callTool('show_observation', {
      device_name: deviceName,
      component_type: componentType,
      observation_type: observationType
    });
    return this.parseDeviceResponse(result);
  }

  // Parse MTConnect MCP server response format
  private parseDeviceResponse(result: any): any {
    try {
      // MCP server returns data in content[0].text as JSON string
      if (result && result.content && Array.isArray(result.content) && result.content[0]) {
        const textContent = result.content[0].text;
        if (typeof textContent === 'string') {
          const parsedData = JSON.parse(textContent);
          //console.log(`📊 Parsed MTConnect data: ${parsedData.message || 'Success'}`);
          return parsedData;
        }
      }
      
      // Fallback to returning result as-is
      console.log('⚠️ Unexpected response format, returning as-is');
      return result;
    } catch (error) {
      console.error('❌ Failed to parse MTConnect response:', error);
      return { devices: [], error: 'Failed to parse response' };
    }
  }
}
