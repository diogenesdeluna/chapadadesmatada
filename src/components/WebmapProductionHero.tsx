import React, { useState } from 'react';
import { METHODOLOGY_PHASES } from '../data/methodologyData';
import { AuditRecord, ProjectMetadata } from '../types/workflow';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Globe,
  Lock,
  FolderOpen,
  Database,
  TrendingUp,
  FileText,
  Users,
  Sparkles,
  MapPin,
  Check,
  ChevronRight
} from 'lucide-react';

interface WebmapProductionHeroProps {
  project: ProjectMetadata;
  currentPhaseId: number;
  onSelectPhase: (phaseId: number) => void;
  auditRecords: AuditRecord[];
  isParalyzed: boolean;
  onStartOrResume: () => void;
  onResetToInitial: () => void;
  onPublishHtml?: () => void;
  onOpenDataSources?: () => void;
  onOpenAuditoria?: () => void;
  onOpenAnalytics?: () => void;
  onOpenAgents?: () => void;
  onOpenDesignEngine?: () => void;
  onExportReport?: () => void;
  onAbortFlow?: () => void;
  onOpenConfig?: () => void;
}

export const WebmapProductionHero: React.FC<WebmapProductionHeroProps> = ({
  currentPhaseId,
  onSelectPhase,
  auditRecords,
  isParalyzed,
  onStartOrResume,
  onResetToInitial,
  onPublishHtml,
  onOpenDataSources,
  onOpenAuditoria,
  onOpenAnalytics,
  onOpenAgents,
  onOpenDesignEngine,
  onExportReport,
  onAbortFlow
}) => {
  const TOTAL_ACTIVITIES = 64;
  const validatedCount = auditRecords.filter((r) => r.evaluation === 'Sim').length;
  const hasStarted = auditRecords.some((r) => r.evaluation === 'Sim' || r.evaluation === 'Não');
  const isInitial = validatedCount === 0 && !hasStarted;
  const percentage = Math.min(100, Math.round((validatedCount / TOTAL_ACTIVITIES) * 1000) / 10);
  const isFinished = percentage === 100 || validatedCount === TOTAL_ACTIVITIES;
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const handleResetClick = () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 4000);
    } else {
      setIsConfirmingReset(false);
      onResetToInitial();
    }
  };

  return (
    <section className="bg-[#faf7f2] text-stone-900 border-b border-[#e8d0c2] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* If isInitial: Center the canvas with prominent start button and single title statement */}
        {isInitial ? (
          <div className="text-center py-6 sm:py-9 max-w-4xl mx-auto space-y-5">
            {/* Replaced previous metadata and subtitles with ONE ONLY STATEMENT as required */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-stone-950 leading-tight font-serif">
                MapeIA - Plataforma de produção de mapas jornalísticos com dados geográficos
              </h1>
            </div>

            {/* Prominent Operational Button Sequence */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              {/* Primary Call to Action */}
              <button
                type="button"
                onClick={onStartOrResume}
                className="btn-base btn-lg bg-[#c07d19] hover:bg-[#8c570a] text-white font-bold px-8 py-4 text-base shadow-lg shadow-[#c07d19]/20 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                title="Iniciar o protocolo de produção a partir da Fase 1"
              >
                <Play className="w-5 h-5 fill-white" />
                <span>INICIAR PRODUÇÃO DO WEBMAP</span>
              </button>

              {/* 1. Fontes Oficiais - Only accessible in Etapa 1 */}
              {onOpenDataSources && currentPhaseId === 1 && (
                <button
                  type="button"
                  onClick={onOpenDataSources}
                  className="btn-base btn-lg bg-white text-[#7b3819] hover:text-[#58240f] hover:bg-stone-50 border border-[#e8d0c2] cursor-pointer text-sm font-semibold px-5 py-4 shadow-2xs"
                  title="Acessar painel de fontes oficiais editável pelo jornalista (MapBiomas, IBGE, ANEEL, ANA, MMA)"
                >
                  <FolderOpen className="w-4 h-4 text-[#c07d19]" />
                  <span>Fontes Oficiais</span>
                </button>
              )}

              {/* 2. Auditoria - Inserted immediately after Fontes Oficiais */}
              {onOpenAuditoria && (
                <button
                  type="button"
                  onClick={onOpenAuditoria}
                  className="btn-base btn-lg bg-white text-stone-800 hover:text-stone-950 hover:bg-stone-50 border border-stone-300 cursor-pointer text-sm font-semibold px-5 py-4 shadow-2xs"
                  title="Acessar Banco de Auditoria Científica e registros permanentes"
                >
                  <Database className="w-4 h-4 text-[#7b3819]" />
                  <span>Auditoria</span>
                </button>
              )}

              {/* 3. Métricas e Indicadores - Inserted immediately after Auditoria */}
              {onOpenAnalytics && (
                <button
                  type="button"
                  onClick={onOpenAnalytics}
                  className="btn-base btn-lg bg-white text-stone-800 hover:text-stone-950 hover:bg-stone-50 border border-stone-300 cursor-pointer text-sm font-semibold px-5 py-4 shadow-2xs"
                  title="Acessar Métricas e Indicadores estatísticos"
                >
                  <TrendingUp className="w-4 h-4 text-[#c07d19]" />
                  <span>Métricas e Indicadores</span>
                </button>
              )}

              {/* 4. Agentes & QGIS MCP */}
              {onOpenAgents && (
                <button
                  type="button"
                  onClick={onOpenAgents}
                  className="btn-base btn-lg bg-white text-stone-800 hover:text-stone-950 hover:bg-stone-50 border border-stone-300 cursor-pointer text-sm font-semibold px-5 py-4 shadow-2xs"
                  title="Acessar Diagrama dos Agentes (Repórter, Auditor, Analista SIG) e Ponte QGIS MCP"
                >
                  <Users className="w-4 h-4 text-[#7b3819]" />
                  <span>Agentes & QGIS MCP</span>
                </button>
              )}

              {/* 5. Estúdio de Design Journalístico */}
              {onOpenDesignEngine && (
                <button
                  type="button"
                  onClick={onOpenDesignEngine}
                  className="btn-base btn-lg bg-white text-stone-800 hover:text-stone-950 hover:bg-stone-50 border border-stone-300 cursor-pointer text-sm font-semibold px-5 py-4 shadow-2xs"
                  title="Abrir gerador automatizado de paletas e tipografia jornalística"
                >
                  <Sparkles className="w-4 h-4 text-[#c07d19]" />
                  <span>Estúdio de Design</span>
                </button>
              )}

              {/* 6. Relatório - Kept strictly for the end of the workflow */}
              {onExportReport && (isFinished || currentPhaseId === 6) && (
                <button
                  type="button"
                  onClick={onExportReport}
                  className="btn-base btn-lg bg-[#7b3819] text-white hover:bg-[#58240f] border border-[#58240f] cursor-pointer text-sm font-bold px-5 py-4 shadow-xs"
                  title="Exportar Relatório Final de Auditoria"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Relatório</span>
                </button>
              )}
            </div>

            <div className="text-[11px] font-mono text-stone-500 pt-1">
              * Validação binária sequencial estrita (Sim / Não) em 64 atividades distribuídas em 6 fases metodológicas (Luna, 2026c).
            </div>
          </div>
        ) : (
          /* Running / In-Progress Operational Ribbon with ONE ONLY STATEMENT */
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-stone-950 leading-tight font-serif">
                MapeIA - Plataforma de produção de mapas jornalísticos com dados geográficos
              </h1>
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
                <span>Fase Ativa: {METHODOLOGY_PHASES[currentPhaseId - 1]?.name}</span>
                <span>·</span>
                <span>Atividades Validadas: {validatedCount} de {TOTAL_ACTIVITIES}</span>
              </div>
            </div>

            {/* Primary Action Button and Action Sequence */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-center lg:items-end gap-2.5 shrink-0">
              {isParalyzed ? (
                <button
                  type="button"
                  onClick={onStartOrResume}
                  className="btn-base btn-lg bg-[#9e1f1f] hover:bg-[#731313] text-white font-bold px-6 py-3.5 text-sm shadow-md shadow-[#9e1f1f]/25 animate-pulse cursor-pointer"
                  title="Ir diretamente para a atividade com erro e resolver no SIG sem reiniciar o fluxo"
                >
                  <AlertOctagon className="w-4 h-4" />
                  <span>RESOLVER ERRO E RETOMAR FLUXO</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStartOrResume}
                  className="btn-base btn-lg bg-[#c07d19] hover:bg-[#8c570a] text-white font-bold px-6 py-3 text-sm shadow-md shadow-[#c07d19]/20 cursor-pointer"
                  title="Continuar avanço na atividade atual"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>CONTINUAR PRODUÇÃO (Fase {currentPhaseId})</span>
                </button>
              )}

              {/* Quick Actions (Fontes Oficiais -> Auditoria -> Métricas e Indicadores -> Agentes -> Design -> Relatório no fim) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {/* 1. Fontes Oficiais - Only accessible in Etapa 1 */}
                {onOpenDataSources && currentPhaseId === 1 && (
                  <button
                    type="button"
                    onClick={onOpenDataSources}
                    className="btn-base btn-sm text-[#7b3819] hover:text-[#58240f] bg-white hover:bg-stone-50 border border-[#e8d0c2] shadow-2xs cursor-pointer"
                    title="Ver fontes públicas oficiais (MapBiomas, IBGE, ANEEL, ANA, MMA) - Apenas Etapa 1"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-[#c07d19]" />
                    <span>Fontes Oficiais</span>
                  </button>
                )}

                {/* 2. Auditoria - Inserted immediately after Fontes Oficiais */}
                {onOpenAuditoria && (
                  <button
                    type="button"
                    onClick={onOpenAuditoria}
                    className="btn-base btn-sm text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-300 shadow-2xs cursor-pointer"
                    title="Acessar Banco de Auditoria Científica e Histórico de Eventos"
                  >
                    <Database className="w-3.5 h-3.5 text-[#7b3819]" />
                    <span>Auditoria</span>
                  </button>
                )}

                {/* 3. Métricas e Indicadores - Inserted immediately after Auditoria */}
                {onOpenAnalytics && (
                  <button
                    type="button"
                    onClick={onOpenAnalytics}
                    className="btn-base btn-sm text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-300 shadow-2xs cursor-pointer"
                    title="Acessar Métricas e Indicadores estatísticos"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-[#c07d19]" />
                    <span>Métricas e Indicadores</span>
                  </button>
                )}

                {/* 4. Agentes & QGIS MCP */}
                {onOpenAgents && (
                  <button
                    type="button"
                    onClick={onOpenAgents}
                    className="btn-base btn-sm text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-300 shadow-2xs cursor-pointer"
                    title="Acessar Diagrama de Fluxo dos Agentes (Repórter, Auditor, Analista SIG) e QGIS MCP"
                  >
                    <Users className="w-3.5 h-3.5 text-[#7b3819]" />
                    <span>Agentes & MCP</span>
                  </button>
                )}

                {/* 5. Estúdio de Design Journalístico */}
                {onOpenDesignEngine && (
                  <button
                    type="button"
                    onClick={onOpenDesignEngine}
                    className="btn-base btn-sm text-stone-800 hover:text-stone-950 bg-white hover:bg-stone-50 border border-stone-300 shadow-2xs cursor-pointer"
                    title="Abrir estúdio de design, paletas e tipografia jornalística"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#c07d19]" />
                    <span>Design</span>
                  </button>
                )}

                {/* 6. Relatório - Kept strictly for the end of the workflow */}
                {onExportReport && (isFinished || currentPhaseId === 6) && (
                  <button
                    type="button"
                    onClick={onExportReport}
                    className="btn-base btn-sm bg-[#7b3819] text-white hover:bg-[#58240f] border border-[#58240f] font-semibold cursor-pointer shadow-xs"
                    title="Exportar Relatório Científico Final"
                  >
                    <FileText className="w-3.5 h-3.5 text-white" />
                    <span>Relatório</span>
                  </button>
                )}

                {onPublishHtml && (
                  <button
                    type="button"
                    disabled={!isFinished}
                    onClick={isFinished ? onPublishHtml : undefined}
                    className={`btn-base btn-sm font-semibold transition-all ${
                      isFinished
                        ? 'btn-success cursor-pointer'
                        : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      isFinished
                        ? 'Publicar e visualizar o mapa narrativo final em formato HTML autônomo com Leaflet'
                        : 'Publicar Mapa: bloqueado até a conclusão de 100% das etapas do protocolo.'
                    }
                  >
                    {isFinished ? (
                      <Globe className="w-3.5 h-3.5" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-stone-400" />
                    )}
                    <span>Publicar Webmap</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onAbortFlow ? onAbortFlow : handleResetClick}
                  className="btn-base btn-sm bg-[#fdf2f2] text-[#9e1f1f] hover:bg-[#f4c6c6] border border-[#f4c6c6] font-semibold cursor-pointer"
                  title="Aborta imediatamente o fluxo atual, remove quaisquer registros e inicia do zero"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isConfirmingReset ? 'Confirmar Zerar?' : 'Zerar Fluxo'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Progress Track */}
        <div className="space-y-1.5 pt-2 border-t border-[#e8d0c2]">
          <div className="flex items-center justify-between text-xs font-mono text-stone-700">
            <span>Progresso da Produção: {validatedCount} de {TOTAL_ACTIVITIES} atividades validadas</span>
            <span className="text-stone-950 font-bold text-sm tabular-nums">{percentage.toFixed(1)}%</span>
          </div>

          <div className="w-full h-2.5 bg-stone-200 rounded-full overflow-hidden border border-stone-300">
            <div
              className={`h-full transition-all duration-300 ${
                isParalyzed
                  ? 'bg-[#9e1f1f]'
                  : percentage === 100
                  ? 'bg-[#059669]'
                  : 'bg-[#c07d19]'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* 6-Phase Segmented Navigation (Strict Sequence Preserved) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {METHODOLOGY_PHASES.map((phase) => {
            const phaseRecords = auditRecords.filter((r) => r.phaseId === phase.id);
            const verifiedInPhase = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
            const hasError = phaseRecords.some((r) => r.evaluation === 'Não');
            const isPhaseComplete = verifiedInPhase === phase.activities.length && phase.activities.length > 0;
            const isSelected = currentPhaseId === phase.id;

            // Strict sequential rule: cannot skip forward to future phases that haven't been unlocked
            const isPhaseUnlocked =
              phase.id === 1 ||
              auditRecords.some((r) => r.phaseId === phase.id) ||
              auditRecords.filter((r) => r.phaseId === phase.id - 1 && r.evaluation === 'Sim').length ===
                METHODOLOGY_PHASES[phase.id - 2]?.activities.length;

            return (
              <button
                key={phase.id}
                type="button"
                disabled={!isPhaseUnlocked}
                onClick={() => isPhaseUnlocked && onSelectPhase(phase.id)}
                className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-white border-[#7b3819] ring-2 ring-[#7b3819]/25 shadow-sm'
                    : isPhaseComplete
                    ? 'bg-white/90 border-[#c07d19]/40 hover:border-[#c07d19] text-stone-800'
                    : hasError
                    ? 'bg-[#fdf2f2] border-[#9e1f1f] text-stone-900'
                    : isPhaseUnlocked
                    ? 'bg-white/70 border-stone-200 hover:border-stone-400 text-stone-700'
                    : 'bg-stone-100/60 border-stone-200 text-stone-400 opacity-60 cursor-not-allowed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-stone-600">ETAPA {phase.id}</span>
                    {isPhaseComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                    ) : hasError ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-[#9e1f1f]" />
                    ) : !isPhaseUnlocked ? (
                      <Lock className="w-3 h-3 text-stone-400" />
                    ) : null}
                  </div>
                  <h3 className="text-xs font-bold leading-tight line-clamp-1 font-serif text-stone-900">
                    {phase.name}
                  </h3>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-stone-500">
                    {verifiedInPhase}/{phase.activities.length}
                  </span>
                  <span className="text-stone-400">
                    {Math.round((verifiedInPhase / phase.activities.length) * 100)}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
