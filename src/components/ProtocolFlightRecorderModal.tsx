import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Trash2,
  X,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  Terminal,
  Cpu,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { ProtocolRecordedEvent, AgentRole } from '../types/workflow';
import { dbService } from '../services/db';
import { AGENT_PROFILES } from '../data/agentData';

interface ProtocolFlightRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProtocolFlightRecorderModal: React.FC<ProtocolFlightRecorderModalProps> = ({
  isOpen,
  onClose
}) => {
  const [events, setEvents] = useState<ProtocolRecordedEvent[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<number | 'all'>('all');
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | 'all'>('all');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadEvents = async () => {
    setIsLoading(true);
    try {
      const list = await dbService.getProtocolEvents();
      setEvents(list);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    if (selectedPhase !== 'all' && e.phaseId !== selectedPhase) return false;
    if (selectedAgent !== 'all' && e.agentRole !== selectedAgent) return false;
    return true;
  });

  const handleDownloadJSON = async () => {
    const jsonStr = await dbService.exportProtocolLogsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gravacao_protocolo_geojornalismo_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMarkdown = async () => {
    const mdStr = await dbService.exportProtocolLogsMarkdown();
    const blob = new Blob([mdStr], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo_gravacao_protocolo_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyLogs = async () => {
    const mdStr = await dbService.exportProtocolLogsMarkdown();
    navigator.clipboard.writeText(mdStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = async () => {
    if (confirm('Tem certeza de que deseja limpar os registros de voo do protocolo deste ambiente?')) {
      await dbService.clearProtocolEvents();
      await loadEvents();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
              <Cpu className="w-5 h-5 text-indigo-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-indigo-300 font-semibold">
                  Gravador de Sessão do Protocolo
                </span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-700/60 px-2 py-0.2 rounded-full font-mono">
                  Flight Recorder do Ambiente
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Registro Contínuo de Todas as Etapas e Ações do Protocolo
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadEvents}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Recarregar eventos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700 font-mono">Fase:</span>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs font-mono p-1 bg-white border border-slate-300 rounded text-slate-800"
              >
                <option value="all">Todas as Fases (1 a 6)</option>
                <option value="1">Fase 1: Conceber</option>
                <option value="2">Fase 2: Compilar</option>
                <option value="3">Fase 3: Limpar</option>
                <option value="4">Fase 4: Contextualizar</option>
                <option value="5">Fase 5: Analisar</option>
                <option value="6">Fase 6: Comunicar</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 font-mono">Agente:</span>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value as any)}
                className="text-xs font-mono p-1 bg-white border border-slate-300 rounded text-slate-800"
              >
                <option value="all">Todos os Agentes</option>
                <option value="reporter">Repórter Investigativo</option>
                <option value="gis_analyst">Analista SIG (QGIS)</option>
                <option value="precision_auditor">Auditor Metodológico</option>
                <option value="iag_communicator">Comunicador IAG (Gemini)</option>
                <option value="mcp_bridge">Conector QGIS-MCP</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              title="Copiar relatório em Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar MD'}</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Baixar Laudo MD</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar JSON</span>
            </button>

            <button
              onClick={handleClear}
              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
              title="Limpar gravações"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Event List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 bg-slate-50/50">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              Nenhum evento registrado ainda com os filtros selecionados.
              <p className="mt-1 text-slate-400">
                Execute atividades, pontos de checagem ou comandos MCP para gravar automaticamente as etapas aqui.
              </p>
            </div>
          ) : (
            filteredEvents.map((e, index) => {
              const isError = e.status === 'error';
              const isSuccess = e.status === 'success';
              const isWarning = e.status === 'warning';

              return (
                <div
                  key={e.id || index}
                  className={`p-3.5 rounded-lg border bg-white text-xs transition-all ${
                    isError
                      ? 'border-rose-300 bg-rose-50/40'
                      : isSuccess
                      ? 'border-emerald-200'
                      : isWarning
                      ? 'border-amber-300 bg-amber-50/40'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {e.activityNumber ? `Ativ. ${e.activityNumber}` : `Fase ${e.phaseId}`}
                      </span>

                      <span className="font-mono text-[11px] font-bold text-slate-800">
                        {e.agentName}
                      </span>

                      <span className="text-[10px] font-mono text-slate-400">
                        ({e.eventType})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(e.timestamp).toLocaleString('pt-BR')}</span>
                      {e.hash && <span className="text-slate-400">· {e.hash}</span>}
                    </div>
                  </div>

                  <div className="font-semibold text-slate-900 mb-1">
                    {e.title}
                  </div>

                  <div className="text-slate-700 leading-relaxed font-sans">
                    {e.description}
                  </div>

                  {e.payload && (
                    <div className="mt-2 p-2 rounded bg-slate-100/70 border border-slate-200 font-mono text-[11px] text-slate-600 overflow-x-auto max-h-32">
                      <pre>{JSON.stringify(e.payload, null, 2)}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>
            Total de {events.length} etapas e operações gravadas com persistência local e no servidor.
          </span>
          <span>Cadeia de Custódia Ativa</span>
        </div>
      </div>
    </div>
  );
};
