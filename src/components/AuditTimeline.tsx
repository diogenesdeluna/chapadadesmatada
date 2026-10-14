import React, { useState, useMemo } from 'react';
import { AuditRecord, DatabaseAdjustment, ProjectMetadata } from '../types/workflow';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ArrowDownUp
} from 'lucide-react';

export interface AuditEvent {
  id: string;
  type: 'validation_sim' | 'validation_nao' | 'adjustment' | 'protocol_start';
  timestamp: string;
  dateObj: Date;
  phaseId: number;
  activityCode?: string;
  title: string;
  description: string;
  operator: string;
  recordHash?: string;
  statusColor: 'ocre' | 'terra' | 'rubro' | 'cinza';
  details?: {
    technicalEvidence?: string;
    adjustmentReason?: string;
    previousEvaluation?: string;
    newEvaluation?: string;
  };
}

interface AuditTimelineProps {
  project: ProjectMetadata;
  records: AuditRecord[];
  adjustments: DatabaseAdjustment[];
  onSelectRecord?: (recordId: string) => void;
}

export const AuditTimeline: React.FC<AuditTimelineProps> = ({
  project,
  records,
  adjustments,
  onSelectRecord
}) => {
  const [filterType, setFilterType] = useState<'all' | 'validation' | 'adjustment' | 'errors'>('all');
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Compile all chronological events from records and adjustments
  const events: AuditEvent[] = useMemo(() => {
    const list: AuditEvent[] = [];

    // Protocol genesis event
    if (project.createdAt) {
      list.push({
        id: `genesis-${project.id}`,
        type: 'protocol_start',
        timestamp: project.createdAt,
        dateObj: new Date(project.createdAt),
        phaseId: 1,
        title: 'Inicialização do Protocolo de Geojornalismo',
        description: `Projeto "${project.title || 'Início do Zero'}" registrado sob a metodologia Luna (2026c).`,
        operator: project.researcher || 'Diógenes Luna',
        statusColor: 'terra'
      });
    }

    // Checkpoint validations (Sim and Não)
    records.forEach((record) => {
      const isSim = record.evaluation === 'Sim';
      const actCode = `${record.phaseId}.${record.activityNumber}`;
      list.push({
        id: `val-${record.id}`,
        type: isSim ? 'validation_sim' : 'validation_nao',
        timestamp: record.timestamp,
        dateObj: new Date(record.timestamp),
        phaseId: record.phaseId,
        activityCode: actCode,
        title: `Ponto de Checagem [${actCode}]: ${record.activityTitle}`,
        description: record.checkpointPrompt,
        operator: record.operator,
        recordHash: record.recordHash,
        statusColor: isSim ? 'ocre' : 'rubro',
        details: {
          technicalEvidence: record.technicalEvidence,
          newEvaluation: record.evaluation
        }
      });
    });

    // Retrospective adjustments
    adjustments.forEach((adj) => {
      const targetRecord = records.find(r => r.id === adj.targetRecordId);
      const actCode = targetRecord ? `${targetRecord.phaseId}.${targetRecord.activityNumber}` : 'Retificação';
      const actTitle = targetRecord ? targetRecord.activityTitle : 'Registro de Auditoria';
      list.push({
        id: `adj-${adj.id}`,
        type: 'adjustment',
        timestamp: adj.adjustedAt,
        dateObj: new Date(adj.adjustedAt),
        phaseId: targetRecord ? targetRecord.phaseId : 1,
        activityCode: actCode,
        title: `Ajuste Retrospectivo [${actCode}]: ${actTitle}`,
        description: `Retificação formal: "${adj.previousEvaluation}" → "${adj.newEvaluation}". Justificativa: ${adj.justification}`,
        operator: adj.adjustedBy,
        recordHash: targetRecord?.recordHash,
        statusColor: 'terra',
        details: {
          adjustmentReason: adj.justification,
          previousEvaluation: adj.previousEvaluation,
          newEvaluation: adj.newEvaluation,
          technicalEvidence: adj.newEvidence
        }
      });
    });

    // Sort chronologically
    return list.sort((a, b) => {
      const diff = a.dateObj.getTime() - b.dateObj.getTime();
      return sortOrder === 'desc' ? -diff : diff;
    });
  }, [project, records, adjustments, sortOrder]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (filterType === 'validation' && !ev.type.startsWith('validation_')) return false;
      if (filterType === 'adjustment' && ev.type !== 'adjustment') return false;
      if (filterType === 'errors' && ev.type !== 'validation_nao') return false;
      if (phaseFilter !== 'all' && ev.phaseId !== phaseFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesText =
          ev.title.toLowerCase().includes(q) ||
          ev.description.toLowerCase().includes(q) ||
          ev.operator.toLowerCase().includes(q) ||
          (ev.activityCode && ev.activityCode.toLowerCase().includes(q)) ||
          (ev.recordHash && ev.recordHash.toLowerCase().includes(q));
        if (!matchesText) return false;
      }

      return true;
    });
  }, [events, filterType, phaseFilter, searchQuery]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getBadgeStyle = (statusColor: AuditEvent['statusColor']) => {
    switch (statusColor) {
      case 'ocre':
        return 'bg-[#fbf5e7] text-[#8c570a] border-[#ecd8b3]';
      case 'terra':
        return 'bg-[#f6ede7] text-[#58240f] border-[#e8d0c2]';
      case 'rubro':
        return 'bg-[#fdf2f2] text-[#731313] border-[#f4c6c6]';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getTimelineDotColor = (statusColor: AuditEvent['statusColor']) => {
    switch (statusColor) {
      case 'ocre':
        return 'bg-[#c07d19] ring-[#ecd8b3]';
      case 'terra':
        return 'bg-[#7b3819] ring-[#e8d0c2]';
      case 'rubro':
        return 'bg-[#9e1f1f] ring-[#f4c6c6]';
      default:
        return 'bg-stone-500 ring-stone-200';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Controls */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
              <Clock className="w-3.5 h-3.5 text-[#7b3819]" />
              <span>TRILHA IMUTÁVEL DE AUDITORIA CRONOLÓGICA</span>
              <span>·</span>
              <span>{events.length} EVENTOS REGISTRADOS</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              Histórico de Eventos de Validação e Ajustes
            </h3>
            <p className="text-xs text-stone-600 mt-0.5 max-w-3xl">
              Sequência temporal permanente de cada ponto de checagem deliberado, verificação criptográfica SHA-256 e retificação formal no banco de dados com a identidade visual MapeIA.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="px-3 py-1.5 bg-[#fbf5e7] hover:bg-[#f4eee3] text-[#7b3819] border border-[#ecd8b3] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Alternar ordem cronológica"
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span>{sortOrder === 'desc' ? 'Mais Recentes Primeiro' : 'Mais Antigos Primeiro'}</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone-200 text-xs">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar evento, operador, hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#7b3819]"
            />
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-stone-50 border border-stone-200 rounded text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#7b3819]"
            >
              <option value="all">Todos os Tipos ({events.length})</option>
              <option value="validation">Apenas Validações ({events.filter(e => e.type.startsWith('val')).length})</option>
              <option value="errors">Apenas Erros / Não ({events.filter(e => e.type === 'validation_nao').length})</option>
              <option value="adjustment">Apenas Ajustes ({adjustments.length})</option>
            </select>
          </div>

          {/* Phase Filter */}
          <div>
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full py-1.5 px-2 bg-stone-50 border border-stone-200 rounded text-stone-800 font-medium focus:outline-none focus:ring-1 focus:ring-[#7b3819]"
            >
              <option value="all">Todas as Fases (1 a 6)</option>
              <option value={1}>Fase 1: Pauta & Fontes Oficiais</option>
              <option value={2}>Fase 2: Estruturação & CRS</option>
              <option value={3}>Fase 3: Geoprocessamento</option>
              <option value={4}>Fase 4: Análise Espacial</option>
              <option value={5}>Fase 5: Design Cartográfico</option>
              <option value={6}>Fase 6: Exportação & Webmap</option>
            </select>
          </div>

          {/* Identity Palette Legend */}
          <div className="flex items-center justify-end gap-3 text-[11px] font-mono text-stone-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c07d19]" />
              <span>Ocre (Validação)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#7b3819]" />
              <span>Terra (Ajuste)</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9e1f1f]" />
              <span>Rubro (Erro)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-lg p-10 text-center text-stone-500 font-mono text-xs">
          Nenhum evento corresponde aos critérios de filtragem selecionados.
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-stone-200">
          {filteredEvents.map((event, index) => {
            const isExpanded = expandedEventId === event.id;
            const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }).format(event.dateObj);

            return (
              <div
                key={event.id}
                className="relative group transition-all"
              >
                {/* Timeline Dot with Identity Colors */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1.5 w-5 h-5 rounded-full ring-4 flex items-center justify-center text-white ${getTimelineDotColor(
                    event.statusColor
                  )} shadow-xs`}
                >
                  {event.type === 'validation_sim' && <CheckCircle2 className="w-3 h-3" />}
                  {event.type === 'validation_nao' && <AlertTriangle className="w-3 h-3" />}
                  {event.type === 'adjustment' && <RotateCcw className="w-3 h-3" />}
                  {event.type === 'protocol_start' && <ShieldCheck className="w-3 h-3" />}
                </div>

                {/* Event Card */}
                <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5 shadow-xs hover:border-stone-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {/* Event type badge */}
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${getBadgeStyle(
                            event.statusColor
                          )}`}
                        >
                          {event.type === 'validation_sim' && 'VALIDAÇÃO CONFORME'}
                          {event.type === 'validation_nao' && 'ERRO DETECTADO / PARALISADO'}
                          {event.type === 'adjustment' && 'AJUSTE RETROSPECTIVO'}
                          {event.type === 'protocol_start' && 'GÊNESE DO PROTOCOLO'}
                        </span>

                        <span className="text-stone-400 font-mono">·</span>

                        <span className="text-stone-500 font-mono text-[11px]">
                          Fase {event.phaseId}
                        </span>

                        <span className="text-stone-400 font-mono">·</span>

                        <span className="text-stone-600 font-mono text-[11px]">
                          {dateFormatted}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-stone-900 leading-snug font-serif">
                        {event.title}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                      <button
                        type="button"
                        onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                        className="p-1 text-stone-500 hover:text-stone-800 rounded hover:bg-stone-100 transition-colors cursor-pointer"
                        title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 mt-2 leading-relaxed">
                    {event.description}
                  </p>

                  {/* Collapsible / Expandable Details */}
                  {isExpanded && (
                    <div className="mt-3.5 pt-3.5 border-t border-stone-200 space-y-2 text-xs">
                      {event.details?.technicalEvidence && (
                        <div>
                          <span className="font-semibold text-stone-800 block text-[11px] uppercase font-mono">
                            Evidência Técnica Registrada:
                          </span>
                          <p className="bg-stone-50 p-2.5 rounded border border-stone-200 text-stone-800 font-mono text-[11px] mt-1 whitespace-pre-wrap">
                            {event.details.technicalEvidence}
                          </p>
                        </div>
                      )}

                      {event.details?.adjustmentReason && (
                        <div>
                          <span className="font-semibold text-stone-800 block text-[11px] uppercase font-mono">
                            Justificativa do Ajuste Retrospectivo:
                          </span>
                          <p className="bg-[#f6ede7] p-2.5 rounded border border-[#e8d0c2] text-[#58240f] text-[11px] mt-1">
                            {event.details.adjustmentReason}
                          </p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] font-mono text-stone-600">
                        <div>
                          <span className="text-stone-400">Operador / Jornalista:</span>{' '}
                          <span className="font-semibold text-stone-900">{event.operator}</span>
                        </div>
                        {event.details?.previousEvaluation && (
                          <div>
                            <span className="text-stone-400">Transição de Estado:</span>{' '}
                            <span className="line-through text-rose-700">{event.details.previousEvaluation}</span>{' '}
                            → <span className="font-bold text-emerald-700">{event.details.newEvaluation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Hash and Operator Strip */}
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400">Operador:</span>
                      <span className="text-stone-700 font-semibold">{event.operator}</span>
                    </div>

                    {event.recordHash && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-stone-400">SHA-256:</span>
                        <code className="text-[#7b3819] font-bold bg-[#fbf5e7] px-1.5 py-0.5 rounded border border-[#ecd8b3] text-[10px]">
                          {event.recordHash.slice(0, 16)}...
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(event.recordHash!)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors cursor-pointer"
                          title="Copiar Hash SHA-256 Completo"
                        >
                          {copiedHash === event.recordHash ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
