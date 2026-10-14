import React from 'react';
import { METHODOLOGY_PHASES } from '../data/methodologyData';
import { AuditRecord } from '../types/workflow';
import { CheckCircle2, AlertOctagon, ShieldCheck, TrendingUp, Flag } from 'lucide-react';

interface OverallProgressBarProps {
  auditRecords: AuditRecord[];
  isParalyzed: boolean;
  currentPhaseId?: number;
  onSelectPhase?: (phaseId: number) => void;
}

export const OverallProgressBar: React.FC<OverallProgressBarProps> = ({
  auditRecords,
  isParalyzed,
  currentPhaseId,
  onSelectPhase
}) => {
  const TOTAL_ACTIVITIES = 64;
  const validatedCount = auditRecords.filter((r) => r.evaluation === 'Sim').length;
  const errorCount = auditRecords.filter((r) => r.evaluation === 'Não').length;
  const percentage = Math.min(100, Math.round((validatedCount / TOTAL_ACTIVITIES) * 1000) / 10);
  const isComplete = validatedCount === TOTAL_ACTIVITIES;

  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        {/* Top Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                isComplete
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : isParalyzed
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'bg-slate-900 border-slate-800 text-white'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : isParalyzed ? (
                <AlertOctagon className="w-5 h-5 text-rose-600 animate-pulse" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-700">
                  Progresso Geral do Protocolo
                </span>
                <span>·</span>
                <span>64 ATIVIDADES CRÍTICAS</span>
                <span>·</span>
                <span>MÉTRICA BINÁRIA (SIM/NÃO)</span>
              </div>
              <h2 className="text-base font-bold text-slate-900 mt-0.5">
                {isComplete
                  ? 'Protocolo 100% Validado — Artefato Pronto para Publicação'
                  : isParalyzed
                  ? 'Fluxo Paralisado por Imprecisão — Ação Corretiva Exigida'
                  : 'Avanço Sistemático do Pipeline Geojornalístico'}
              </h2>
            </div>
          </div>

          {/* Big Percentage & Count Badge */}
          <div className="flex items-center gap-4 sm:text-right shrink-0">
            <div className="flex flex-col sm:items-end">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 tracking-tight tabular-nums">
                  {percentage.toFixed(1)}%
                </span>
                <span className="text-xs font-mono text-slate-500 uppercase">
                  Concluído
                </span>
              </div>
              <div className="text-xs font-mono text-slate-500 tabular-nums">
                <strong className="text-slate-800 font-semibold">{validatedCount}</strong> de{' '}
                {TOTAL_ACTIVITIES} atividades validadas
                {errorCount > 0 && (
                  <span className="text-rose-600 font-medium ml-1.5">
                    ({errorCount} {errorCount === 1 ? 'erro registrado' : 'erros registrados'})
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Master Visual Progress Bar Track */}
        <div className="relative mt-3">
          {/* Track background */}
          <div
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresso geral das 64 atividades do protocolo"
            className="w-full h-3 sm:h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 relative shadow-inner"
          >
            {/* Fill bar with smooth animated transition */}
            <div
              className={`h-full transition-all duration-500 ease-out rounded-full ${
                isComplete
                  ? 'bg-emerald-600'
                  : isParalyzed
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.max(percentage, 0.5)}%` }}
            />
          </div>

          {/* Cumulative Phase Marker Dividers */}
          <div className="w-full flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-0.5 select-none">
            {METHODOLOGY_PHASES.map((phase, idx) => {
              // Cumulative activity boundaries: 4, 9, 21, 38, 57, 64
              let cumulative = 0;
              for (let i = 0; i <= idx; i++) {
                cumulative += METHODOLOGY_PHASES[i].activities.length;
              }
              const phaseRecords = auditRecords.filter((r) => r.phaseId === phase.id);
              const phaseValid = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
              const isPhaseDone = phaseValid === phase.activities.length;
              const isPhaseActive = currentPhaseId === phase.id;

              return (
                <button
                  key={phase.id}
                  onClick={() => onSelectPhase?.(phase.id)}
                  title={`Fase ${phase.code} ${phase.name}: ${phaseValid}/${phase.activities.length} validadas`}
                  className={`flex flex-col items-center group transition-colors text-left sm:text-center ${
                    isPhaseActive
                      ? 'text-slate-900 font-bold'
                      : isPhaseDone
                      ? 'text-emerald-700 hover:text-emerald-900'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="flex items-center gap-1 font-semibold">
                    <span className="hidden md:inline">{phase.code}</span>
                    <span>{phase.name}</span>
                    {isPhaseDone && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                    )}
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                    {phaseValid}/{phase.activities.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
