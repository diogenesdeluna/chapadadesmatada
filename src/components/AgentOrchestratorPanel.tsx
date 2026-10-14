import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Users,
  Bot,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  RefreshCw,
  Terminal,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Info,
  Clock,
  Radio,
  MapPin,
  Crosshair,
  Maximize2
} from 'lucide-react';
import {
  ActivityDefinition,
  PhaseDefinition,
  AgentRole,
  AgentInteractionMessage,
  QgisMcpStatus
} from '../types/workflow';
import { AGENT_PROFILES, generateAgentInteractionsForActivity } from '../data/agentData';
import { qgisMcpService } from '../services/qgisMcpService';
import { dbService } from '../services/db';

export interface UseQgisGeometryErrorFocusOptions {
  isParalyzed?: boolean;
  evaluation?: 'Sim' | 'Não' | null;
  activity: ActivityDefinition;
  phase: PhaseDefinition;
  qgisStatus: QgisMcpStatus;
  customErrorCoords?: [number, number];
  featureId?: string;
}

export interface DispatchedFocusCommand {
  dispatchedAt: string;
  coordinates: [number, number];
  featureId: string;
  status: 'success' | 'error';
  toolName: string;
  message: string;
  zoomScale: string;
  layerName: string;
}

/**
 * Hook that monitors paralyzed activity or validation error and automatically
 * sends a command via qgisMcpService to open QGIS 'Geometry Validity Checker'
 * focusing on the specific coordinates where the error was identified.
 */
export function useQgisGeometryErrorFocus({
  isParalyzed,
  evaluation,
  activity,
  phase,
  qgisStatus,
  customErrorCoords,
  featureId = 'ALT-2024-089'
}: UseQgisGeometryErrorFocusOptions) {
  const [lastDispatchedCommand, setLastDispatchedCommand] = useState<DispatchedFocusCommand | null>(null);
  const [isFocusing, setIsFocusing] = useState(false);
  const handledRef = useRef<string | null>(null);

  // Compute specific coordinates for the error (APA Chapada do Araripe / Crato hotspot)
  const errorCoordinates: [number, number] = useMemo(() => {
    if (customErrorCoords) return customErrorCoords;
    if (activity.id === 'p3_a1' || activity.id === 'p3_a2' || activity.phaseId === 3) {
      return [-39.41245, -7.23412]; // Ponto exato do laço em 8 (kink) na encosta da Chapada (Crato)
    }
    if (activity.phaseId === 4) {
      return [-39.4182, -7.2415]; // Limite com FLONA do Araripe
    }
    return [-39.4251, -7.2483]; // Zona de amortecimento
  }, [activity, customErrorCoords]);

  // Dispatch function to open Geometry Validity Checker and focus on coordinates
  const sendGeometryFocusCommand = useCallback(
    async (coordsToFocus?: [number, number]) => {
      const coords = coordsToFocus || errorCoordinates;
      setIsFocusing(true);

      try {
        // Ensure MCP is connected
        if (!qgisStatus.isConnected) {
          await qgisMcpService.connectMcp();
        }

        const res = await qgisMcpService.callTool('qgis_open_geometry_checker', {
          activityId: activity.id,
          activityNumber: activity.activityNumber,
          phaseId: phase.id,
          featureId,
          coordinates: coords,
          layerName: 'Alertas_Desmatamento_APA_Araripe.gpkg',
          errorType: 'Auto-interseção de Arestas / Vértice Inválido (RFC 7946)',
          zoomLevel: 18
        });

        const commandData: DispatchedFocusCommand = {
          dispatchedAt: new Date().toLocaleTimeString('pt-BR'),
          coordinates: coords,
          featureId,
          status: 'success',
          toolName: 'qgis_open_geometry_checker',
          message:
            res?.result?.message ||
            `Verificador de Validade de Geometria do QGIS aberto com foco nas coordenadas [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}].`,
          zoomScale: res?.result?.zoomScale || '1:5000',
          layerName: 'Alertas_Desmatamento_APA_Araripe.gpkg'
        };

        setLastDispatchedCommand(commandData);

        // Record automatic MCP command in protocol flight recorder
        await dbService.recordProtocolEvent({
          id: `evt_mcp_focus_${Date.now()}`,
          timestamp: new Date().toISOString(),
          phaseId: phase.id,
          activityId: activity.id,
          activityNumber: activity.activityNumber,
          agentRole: 'mcp_bridge',
          agentName: 'Agente Conector QGIS MCP',
          eventType: 'layer_processed',
          title: `Comando QGIS MCP: Abrir Verificador de Validade de Geometria`,
          description: `Disparo automático ao detectar atividade paralisada/erro na Atividade ${activity.activityNumber}. QGIS focado nas coordenadas [${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}] sobre a feição '${featureId}'.`,
          payload: { coordinates: coords, featureId, result: res },
          status: 'warning'
        });

        return commandData;
      } catch (err: any) {
        const errData: DispatchedFocusCommand = {
          dispatchedAt: new Date().toLocaleTimeString('pt-BR'),
          coordinates: coords,
          featureId,
          status: 'error',
          toolName: 'qgis_open_geometry_checker',
          message: `Falha ao acionar ferramenta no QGIS MCP: ${err.message}`,
          zoomScale: '1:5000',
          layerName: 'Alertas_Desmatamento_APA_Araripe.gpkg'
        };
        setLastDispatchedCommand(errData);
        return errData;
      } finally {
        setIsFocusing(false);
      }
    },
    [activity, phase, errorCoordinates, featureId, qgisStatus.isConnected]
  );

  // Automatic trigger on error or paralyzed state
  useEffect(() => {
    const isErrorDetected = evaluation === 'Não' || Boolean(isParalyzed);
    const triggerKey = `${activity.id}_eval_${evaluation}_par_${Boolean(isParalyzed)}`;

    if (isErrorDetected && handledRef.current !== triggerKey) {
      handledRef.current = triggerKey;
      sendGeometryFocusCommand();
    }
  }, [evaluation, isParalyzed, activity.id, sendGeometryFocusCommand]);

  return {
    lastDispatchedCommand,
    isFocusing,
    errorCoordinates,
    sendGeometryFocusCommand
  };
}

interface AgentOrchestratorPanelProps {
  currentPhase: PhaseDefinition;
  currentActivity: ActivityDefinition;
  evaluation?: 'Sim' | 'Não' | null;
  isParalyzed?: boolean;
  customErrorCoords?: [number, number];
  qgisStatus: QgisMcpStatus;
  onRefreshQgisStatus: () => void;
  onTriggerErrorSimulation?: () => void;
}

export const AgentOrchestratorPanel: React.FC<AgentOrchestratorPanelProps> = ({
  currentPhase,
  currentActivity,
  evaluation,
  isParalyzed,
  customErrorCoords,
  qgisStatus,
  onRefreshQgisStatus,
  onTriggerErrorSimulation
}) => {
  const [messages, setMessages] = useState<AgentInteractionMessage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentRole>('reporter');
  const [isConnectingMcp, setIsConnectingMcp] = useState(false);
  const [mcpFeedback, setMcpFeedback] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Auto-expand when an error or paralyzed state is active
  useEffect(() => {
    if (evaluation === 'Não' || isParalyzed) {
      setIsExpanded(true);
    }
  }, [evaluation, isParalyzed]);

  // Hook that automatically sends QGIS MCP focus command upon error or paralyzed state
  const {
    lastDispatchedCommand,
    isFocusing,
    errorCoordinates,
    sendGeometryFocusCommand
  } = useQgisGeometryErrorFocus({
    isParalyzed,
    evaluation,
    activity: currentActivity,
    phase: currentPhase,
    qgisStatus,
    customErrorCoords
  });

  // Generate dynamic interaction feed when activity or evaluation changes
  useEffect(() => {
    const list = generateAgentInteractionsForActivity(currentPhase, currentActivity, evaluation);
    setMessages(list);
  }, [currentPhase, currentActivity, evaluation]);

  const handleConnectMcp = async (mode?: 'emulator' | 'live_only') => {
    setIsConnectingMcp(true);
    setMcpFeedback(null);
    try {
      const res = await qgisMcpService.connectMcp(mode);
      onRefreshQgisStatus();
      if (res.connected) {
        setMcpFeedback(
          res.mode === 'live_qgis'
            ? 'QGIS nativo conectado com sucesso via Model Context Protocol (porta 9559).'
            : 'Emulador de Ponte QGIS-MCP ativado com suporte a algoritmos nativos (native:fixgeometries, native:reproject).'
        );

        // Record in protocol flight recorder
        await dbService.recordProtocolEvent({
          id: `evt_mcp_conn_${Date.now()}`,
          timestamp: new Date().toISOString(),
          phaseId: currentPhase.id,
          activityId: currentActivity.id,
          activityNumber: currentActivity.activityNumber,
          agentRole: 'mcp_bridge',
          agentName: 'Agente Conector QGIS MCP',
          eventType: 'qgis_mcp_connected',
          title: 'Conexão MCP Estabelecida',
          description: `Modo: ${res.mode}. Ferramentas disponíveis: ${res.toolsAvailable?.length || 6}.`,
          status: 'success'
        });
      } else {
        setMcpFeedback(res.message || 'QGIS não detectado em execução no momento.');
      }
    } catch (err: any) {
      setMcpFeedback(`Erro ao conectar via MCP: ${err.message}`);
    } finally {
      setIsConnectingMcp(false);
    }
  };

  const getAgentIcon = (role: AgentRole) => {
    switch (role) {
      case 'reporter':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'gis_analyst':
        return <Layers className="w-4 h-4 text-emerald-600" />;
      case 'precision_auditor':
        return <ShieldCheck className="w-4 h-4 text-purple-600" />;
      case 'iag_communicator':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      case 'mcp_bridge':
        return <Terminal className="w-4 h-4 text-indigo-600" />;
    }
  };

  const isErrorOrParalyzed = evaluation === 'Não' || Boolean(isParalyzed);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden mb-6">
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <Radio className="w-5 h-5 animate-pulse text-indigo-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-indigo-300">
              <span className="uppercase tracking-wider font-semibold">
                Orquestração Multagente em Tempo Real
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-indigo-200">
                Transparência Metodológica Total
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Fluxo Interativo de Agentes & Ponte QGIS-MCP
            </h3>
          </div>
        </div>

        {/* QGIS MCP Connection Status Capsule */}
        <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-mono">
          <span className="flex h-2.5 w-2.5 relative">
            {qgisStatus.isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </>
            ) : qgisStatus.isRunning ? (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-500"></span>
            )}
          </span>

          <span className="text-slate-200 font-semibold">
            {qgisStatus.isConnected
              ? `QGIS MCP: Ativo (${qgisStatus.connectionMode === 'live_qgis' ? 'Processo Nativo' : 'Emulador'})`
              : qgisStatus.isRunning
              ? 'QGIS Detectado (MCP Pendente)'
              : 'QGIS: Não Detectado'}
          </span>

          <button
            onClick={onRefreshQgisStatus}
            className="text-slate-400 hover:text-white transition-colors p-1"
            title="Verificar status do processo QGIS"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-base btn-sm bg-slate-700/80 hover:bg-slate-700 text-white ml-2"
          >
            {isExpanded ? 'Recolher Painel' : 'Expandir Painel'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* QGIS Integration Action Alert Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <Terminal className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            {qgisStatus.isConnected ? (
              <strong className="text-emerald-700">
                Ponte MCP operacional na porta {qgisStatus.mcpPort}. Algoritmos nativos sincronizados com a atividade atual.
              </strong>
            ) : qgisStatus.isRunning ? (
              <span>
                Processo QGIS (PID {qgisStatus.pid || 'Ativo'}) em execução no sistema. Conecte-se via MCP para sincronização direta.
              </span>
            ) : (
              <span>
                Quando o protocolo é iniciado, o sistema verifica o processo do QGIS no host. Conecte ao MCP para automação analítica.
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!qgisStatus.isConnected ? (
            <div className="btn-group-center">
              <button
                type="button"
                onClick={() => handleConnectMcp('live_only')}
                disabled={isConnectingMcp}
                className="btn-base btn-sm btn-primary shadow-xs"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Conectar QGIS via MCP</span>
              </button>

              <button
                type="button"
                onClick={() => handleConnectMcp('emulator')}
                disabled={isConnectingMcp}
                className="btn-base btn-sm btn-secondary text-indigo-800 border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
              >
                <span>Ativar Ponte MCP Integrada</span>
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1.5 rounded-lg font-semibold font-mono text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Sincronizado via MCP
            </span>
          )}
        </div>
      </div>

      {/* Geometry Validity Checker Focus Card (Triggered by useQgisGeometryErrorFocus hook) */}
      {(lastDispatchedCommand || isErrorOrParalyzed) && (
        <div className="bg-amber-50/90 border-b border-amber-300 px-5 py-3 text-xs animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-600 rounded text-white shrink-0 mt-0.5 shadow-xs">
                <Crosshair className="w-4 h-4 animate-spin text-amber-100" />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[11px] font-bold uppercase text-amber-900 tracking-wider">
                    Comando MCP Despachado: Verificador de Validade de Geometria do QGIS
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 border border-amber-400/60 px-1.5 py-0.2 rounded font-mono">
                    Hook Automático Ativo
                  </span>
                </div>

                <p className="text-amber-950 font-medium leading-relaxed">
                  Ao detectar a atividade paralisada / erro de validação, o hook despachou automaticamente o comando via{' '}
                  <strong className="font-mono text-amber-900">qgisMcpService</strong> para abrir o painel{' '}
                  <strong>'Verificador de Validade de Geometria'</strong> do QGIS, centralizando a visualização nas coordenadas do vértice corrompido.
                </p>

                {/* Coordinate Badge */}
                <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded text-amber-900 font-semibold shadow-2xs">
                    <MapPin className="w-3 h-3 text-rose-600" />
                    <span>Longitude: {errorCoordinates[0].toFixed(6)}</span>
                    <span className="text-slate-400">|</span>
                    <span>Latitude: {errorCoordinates[1].toFixed(6)}</span>
                  </span>

                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300/80 rounded text-amber-800">
                    Feição Alvo: <strong>{lastDispatchedCommand?.featureId || 'ALT-2024-089 (Encosta Crato)'}</strong>
                  </span>

                  <span className="px-2 py-0.5 bg-amber-100 border border-amber-300/80 rounded text-amber-800">
                    Camada: <strong>Alertas_Desmatamento_APA_Araripe.gpkg</strong>
                  </span>

                  {lastDispatchedCommand?.dispatchedAt && (
                    <span className="text-slate-500 text-[10px]">
                      Despachado às {lastDispatchedCommand.dispatchedAt}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              <button
                type="button"
                onClick={() => sendGeometryFocusCommand()}
                disabled={isFocusing}
                className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                title="Reenviar comando MCP para o QGIS recentralizar as coordenadas no Verificador de Geometrias"
              >
                <Crosshair className={`w-3.5 h-3.5 ${isFocusing ? 'animate-spin' : ''}`} />
                <span>{isFocusing ? 'Focando no QGIS...' : 'Reenviar Foco ao QGIS MCP'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {mcpFeedback && (
        <div className="bg-indigo-50/90 border-b border-indigo-200 px-5 py-2 text-xs font-mono text-indigo-900 flex items-center justify-between">
          <span>{mcpFeedback}</span>
          <button onClick={() => setMcpFeedback(null)} className="text-indigo-600 hover:text-indigo-900">
            ×
          </button>
        </div>
      )}

      {/* Agents Representation Cards Grid */}
      <div className="p-5 border-b border-slate-200">
        <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-500 mb-3 flex items-center justify-between">
          <span>Agentes Especializados Envolvidos nesta Atividade:</span>
          <span className="text-slate-400">Clique para ver responsabilidades detalhadas</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {(Object.keys(AGENT_PROFILES) as AgentRole[]).map((role) => {
            const agent = AGENT_PROFILES[role];
            const isSelected = selectedAgent === role;

            return (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedAgent(role)}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="p-1 rounded bg-slate-100">{getAgentIcon(role)}</div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${agent.badgeColor}`}>
                    {role === 'reporter'
                      ? 'Líder'
                      : role === 'gis_analyst'
                      ? 'SIG'
                      : role === 'precision_auditor'
                      ? 'Auditor'
                      : role === 'iag_communicator'
                      ? 'IAG'
                      : 'MCP'}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 truncate">{agent.name}</div>
                <div className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">
                  {agent.roleLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Agent Details Pill */}
        {selectedAgent && (
          <div className="mt-3.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {getAgentIcon(selectedAgent)}
                <span className="font-bold text-slate-900">
                  {AGENT_PROFILES[selectedAgent].name} — {AGENT_PROFILES[selectedAgent].roleLabel}
                </span>
              </div>
            </div>

            <p className="text-slate-700 text-xs leading-relaxed mb-2">
              {AGENT_PROFILES[selectedAgent].description}
            </p>

            <div className="pt-2 border-t border-slate-200 text-[11px]">
              <strong className="text-slate-900 font-mono">Atribuições no Protocolo: </strong>
              <span className="text-slate-600">
                {AGENT_PROFILES[selectedAgent].responsibilities.join(' · ')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Live Agent Interaction / Handoff Feed */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2 font-mono font-bold uppercase text-slate-700">
            <Bot className="w-4 h-4 text-indigo-600" />
            <span>
              Passagem de Bastão & Diálogo entre Agentes — Atividade {currentActivity.activityNumber}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            {messages.length} comunicações registradas
          </span>
        </div>

        <div className="space-y-3">
          {messages.map((msg, index) => {
            const senderAgent = AGENT_PROFILES[msg.sender];
            const isError = msg.status === 'error';
            const isSuccess = msg.status === 'success';

            return (
              <div
                key={msg.id || index}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  isError
                    ? 'border-rose-300 bg-rose-50/70'
                    : isSuccess
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded bg-slate-100">{getAgentIcon(msg.sender)}</div>
                    <span className="font-bold text-slate-900 font-mono text-[11px]">
                      {senderAgent.name}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                    <span className="text-slate-500 font-mono text-[11px]">
                      {msg.recipient === 'all'
                        ? 'Todos os Agentes'
                        : AGENT_PROFILES[msg.recipient as AgentRole]?.name || msg.recipient}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {msg.timestamp}
                  </span>
                </div>

                <div className="text-slate-800 leading-relaxed font-sans pl-6">
                  {msg.content}
                </div>

                {msg.technicalDetails && (
                  <div className="mt-2 ml-6 p-2 rounded bg-slate-100/80 border border-slate-200/80 font-mono text-[11px] text-slate-600">
                    {msg.technicalDetails}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
};
