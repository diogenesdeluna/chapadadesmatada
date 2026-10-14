import React from 'react';
import { METHODOLOGY_PHASES } from '../data/methodologyData';
import { AuditRecord } from '../types/workflow';
import { CheckCircle2, AlertOctagon, Clock, Lock } from 'lucide-react';

interface WorkflowStepperProps {
  currentPhaseId: number;
  onSelectPhase: (phaseId: number) => void;
  auditRecords: AuditRecord[];
  isParalyzed: boolean;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  currentPhaseId,
  onSelectPhase,
  auditRecords,
  isParalyzed
}) => {
  const hasStarted = auditRecords.some((r) => r.evaluation === 'Sim' || r.evaluation === 'Não');

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>METODOLOGIA LUNA (2026c)</span>
              <span>·</span>
              <span>PONTOS DE CHECAGEM BINÁRIOS</span>
              <span>·</span>
              <span>RASTRO DO ERRO E AUDITORIA</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-0.5">
              Fluxo Metodológico com Dados Geográficos para Jornalismo
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Progresso Geral:</span>
              <span className="font-semibold text-slate-900 tabular-nums">
                {auditRecords.filter((r) => r.evaluation === 'Sim').length} / 64 atividades validadas
              </span>
            </div>
          </div>
        </div>

        {/* Phase Pills Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {METHODOLOGY_PHASES.map((phase) => {
            const phaseRecords = auditRecords.filter((r) => r.phaseId === phase.id);
            const verifiedCount = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
            const hasError = phaseRecords.some((r) => r.evaluation === 'Não');
            const totalInPhase = phase.activities.length;
            const isCompleted = verifiedCount === totalInPhase;
            const isCurrent = currentPhaseId === phase.id;

            // Strict rule: do not allow going backward once started, UNLESS there is an invalidation
            const isPastPhase = phase.id < currentPhaseId;
            const isFuturePhase = phase.id > currentPhaseId;
            const isRewindBlocked = hasStarted && isPastPhase && !hasError;
            const isForwardBlocked = isFuturePhase && !isCompleted && !auditRecords.some(r => r.phaseId === phase.id);
            const isClickable = !isRewindBlocked && !isForwardBlocked;

            return (
              <button
                key={phase.id}
                type="button"
                disabled={!isClickable}
                onClick={() => {
                  if (isClickable) onSelectPhase(phase.id);
                }}
                className={`flex flex-col text-left p-3 rounded-lg border transition-all text-xs relative ${
                  isCurrent
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/50 text-slate-800 hover:border-emerald-300'
                    : hasError
                    ? 'border-rose-400 bg-rose-50 text-slate-900 ring-1 ring-rose-400'
                    : isRewindBlocked
                    ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed opacity-75'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
                title={
                  isRewindBlocked
                    ? 'Volta bloqueada: fluxo sequencial estrito (permitido apenas se houver invalidação)'
                    : hasError
                    ? 'Fase com atividade invalidada! Clique para corrigir e retomar.'
                    : undefined
                }
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`font-mono font-semibold text-[11px] ${
                      isCurrent ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {phase.code}
                  </span>

                  {isCompleted ? (
                    <CheckCircle2
                      className={`w-3.5 h-3.5 ${
                        isCurrent ? 'text-emerald-400' : 'text-emerald-600'
                      }`}
                    />
                  ) : hasError ? (
                    <AlertOctagon
                      className={`w-3.5 h-3.5 ${
                        isCurrent ? 'text-rose-400' : 'text-rose-600'
                      }`}
                    />
                  ) : isRewindBlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <Clock
                      className={`w-3.5 h-3.5 ${
                        isCurrent ? 'text-slate-400' : 'text-slate-400'
                      }`}
                    />
                  )}
                </div>

                <div className="font-semibold text-sm leading-tight truncate w-full">
                  {phase.name}
                </div>

                <div
                  className={`mt-1 font-mono text-[11px] tabular-nums ${
                    isCurrent ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {verifiedCount}/{totalInPhase} validadas
                </div>

                {/* Progress bar inside card */}
                <div className="w-full bg-black/10 h-1 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCurrent ? 'bg-emerald-400' : isCompleted ? 'bg-emerald-600' : hasError ? 'bg-rose-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${(verifiedCount / totalInPhase) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
