import { QgisMcpStatus } from '../types/workflow';

class QgisMcpService {
  private currentStatus: QgisMcpStatus = {
    isRunning: false,
    pid: null,
    processDetails: null,
    mcpBridgeSupported: true,
    connectionMode: 'none',
    isConnected: false,
    mcpPort: 9559,
    connectedAt: null,
    checkedAt: new Date().toISOString()
  };

  /**
   * Check if QGIS is running on the local/server system
   */
  public async checkQgisStatus(): Promise<QgisMcpStatus> {
    try {
      const res = await fetch('/api/qgis/check');
      if (!res.ok) {
        throw new Error('Falha ao checar status do QGIS.');
      }
      const data = await res.json();
      this.currentStatus = {
        ...this.currentStatus,
        isRunning: Boolean(data.isRunning),
        pid: data.pid,
        processDetails: data.processDetails,
        mcpBridgeSupported: Boolean(data.mcpBridgeSupported),
        connectionMode: data.mcpSession?.connectionMode || (data.isRunning ? 'live_qgis' : 'none'),
        isConnected: Boolean(data.mcpSession?.isConnected),
        mcpPort: data.defaultMcpPort || 9559,
        checkedAt: data.checkedAt || new Date().toISOString()
      };
      return this.currentStatus;
    } catch (err: any) {
      console.warn('Erro ao verificar QGIS:', err);
      this.currentStatus.checkedAt = new Date().toISOString();
      return this.currentStatus;
    }
  }

  /**
   * Connect to QGIS via Model Context Protocol (MCP)
   */
  public async connectMcp(forceMode?: 'live_only' | 'emulator'): Promise<{
    success: boolean;
    connected: boolean;
    mode: 'live_qgis' | 'mcp_bridge_emulator' | 'none';
    message?: string;
    toolsAvailable?: Array<{ name: string; description: string }>;
  }> {
    try {
      const res = await fetch('/api/qgis/mcp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceMode })
      });
      const data = await res.json();

      if (data.connected) {
        this.currentStatus = {
          ...this.currentStatus,
          isConnected: true,
          connectionMode: data.mode,
          mcpPort: data.mcpPort,
          connectedAt: data.connectedAt,
          serverInfo: data.serverInfo,
          toolsAvailable: data.toolsAvailable,
          checkedAt: new Date().toISOString()
        };
      } else {
        this.currentStatus.isConnected = false;
        this.currentStatus.connectionMode = 'none';
      }

      return data;
    } catch (err: any) {
      return {
        success: false,
        connected: false,
        mode: 'none',
        message: err.message || 'Erro ao conectar via MCP.'
      };
    }
  }

  /**
   * Call a tool via QGIS MCP
   */
  public async callTool(toolName: string, args: any = {}): Promise<any> {
    try {
      const res = await fetch('/api/qgis/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName, arguments: args })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      throw new Error(`Falha ao executar ferramenta MCP '${toolName}': ${err.message}`);
    }
  }

  public getStatus(): QgisMcpStatus {
    return this.currentStatus;
  }
}

export const qgisMcpService = new QgisMcpService();
