import React, { useState, useEffect } from 'react';
import { ActivityDefinition, AuditRecord, PhaseDefinition } from '../types/workflow';
import {
  CheckCircle2,
  XCircle,
  Lock,
  ArrowRight,
  Database,
  FileCheck,
  Layers,
  HelpCircle,
  ShieldCheck,
  Globe,
  Wrench,
  AlertTriangle
} from 'lucide-react';

interface ActivityCardProps {
  phase: PhaseDefinition;
  activity: ActivityDefinition;
  record?: AuditRecord;
  isUnlocked: boolean;
  isCurrent: boolean;
  operatorName: string;
  onValidate: (
    evaluation: 'Sim' | 'Não',
    evidence: string,
    operator: string
  ) => void;
  onSelect: () => void;
  onErrorDetected?: (
    activity: ActivityDefinition,
    phase: PhaseDefinition,
    customDiagnosis?: string
  ) => void;
  onPublishHtml?: () => void;
  isPautaDefined?: boolean;
  onOpenPautaConfig?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({
  phase,
  activity,
  record,
  isUnlocked,
  isCurrent,
  operatorName,
  onValidate,
  onSelect,
  onErrorDetected,
  onPublishHtml,
  isPautaDefined = true,
  onOpenPautaConfig
}) => {
  const [selectedEvaluation, setSelectedEvaluation] = useState<'Sim' | 'Não' | null>(
    record ? record.evaluation : null
  );
  const [evidence, setEvidence] = useState(
    record?.technicalEvidence || ''
  );
  const [operator, setOperator] = useState(record?.operator || operatorName);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    if (record) {
      setSelectedEvaluation(record.evaluation);
      setEvidence(record.technicalEvidence || '');
      setOperator(record.operator || operatorName);
    } else {
      setSelectedEvaluation(null);
      setEvidence('');
    }
  }, [record, activity, operatorName]);

  const isValidated = record?.evaluation === 'Sim';
  const isFailed = record?.evaluation === 'Não';

  const handleSave = (evalType: 'Sim' | 'Não') => {
    if (!isPautaDefined && onOpenPautaConfig) {
      onOpenPautaConfig();
      return;
    }
    setSelectedEvaluation(evalType);
    onValidate(evalType, evidence, operator);
    if (evalType === 'Não' && onErrorDetected) {
      onErrorDetected(activity, phase);
    }
  };

  const handleTriggerDiagnosis = () => {
    if (onErrorDetected) {
      onErrorDetected(activity, phase);
    }
  };

  return (
    <div
      className={`border rounded-lg transition-all duration-200 ${
        isCurrent
          ? 'border-slate-900 bg-white ring-1 ring-slate-900/10 shadow-sm'
          : isValidated
          ? 'border-emerald-200 bg-white hover:border-emerald-300'
          : isFailed
          ? 'border-rose-300 bg-rose-50/40'
          : isUnlocked
          ? 'border-slate-200 bg-white hover:border-slate-300'
          : 'border-slate-200 bg-slate-50/60 opacity-60'
      }`}
    >
      {/* Header bar */}
      <div
        onClick={isUnlocked ? onSelect : undefined}
        className={`px-4 sm:px-5 py-3.5 flex items-start justify-between gap-3 cursor-pointer ${
          isCurrent ? 'bg-slate-50 border-b border-slate-200' : ''
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0">
            {isValidated ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : isFailed ? (
              <XCircle className="w-5 h-5 text-rose-600" />
            ) : isUnlocked ? (
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-mono font-bold ${
                  isCurrent
                    ? 'border-slate-900 text-slate-900 bg-slate-100'
                    : 'border-slate-400 text-slate-500'
                }`}
              >
                {activity.activityNumber}
              </div>
            ) : (
              <Lock className="w-4 h-4 text-slate-400 mt-0.5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
              <span>{phase.code}</span>
              <span>·</span>
              <span>ATIVIDADE {activity.activityNumber}</span>
              {record && (
                <>
                  <span>·</span>
                  <span className="text-slate-400 font-mono">
                    HASH: {record.recordHash}
                  </span>
                </>
              )}
            </div>

            <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
              {activity.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-[11px] font-mono uppercase font-medium px-2 py-0.5 rounded ${
              activity.checkpointVerb === 'Valide' || activity.checkpointVerb === 'Validar'
                ? 'bg-blue-50 text-blue-700'
                : activity.checkpointVerb === 'Verifique' || activity.checkpointVerb === 'Verificar'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-amber-50 text-amber-700'
            }`}
          >
            {activity.checkpointVerb}
          </span>

          <span
            className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
              isValidated
                ? 'bg-emerald-100 text-emerald-800'
                : isFailed
                ? 'bg-rose-100 text-rose-800'
                : isUnlocked
                ? 'bg-slate-100 text-slate-600'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            {isValidated
              ? 'SIM (VALIDADO)'
              : isFailed
              ? 'NÃO (PARALISADO)'
              : isUnlocked
              ? 'PENDENTE'
              : 'BLOQUEADO'}
          </span>
        </div>
      </div>

      {/* Body when current or clicked */}
      <div className="px-4 sm:px-5 py-4 border-t border-slate-100 space-y-4">
        <p className="text-xs text-slate-700 leading-relaxed">
          {activity.description}
        </p>

        {/* Technical Specs Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{showTechnicalDetails ? 'Ocultar' : 'Ver'} Parâmetros de Entrada / Operação / Saída</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                  1. Entrada Auditada:
                </span>
                <span className="text-slate-800 text-[11px] leading-tight block">
                  {activity.inputs}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                  2. Operação Executada:
                </span>
                <span className="text-slate-800 text-[11px] leading-tight block">
                  {activity.operations}
                </span>
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                  3. Saída Esperada:
                </span>
                <span className="text-slate-800 text-[11px] leading-tight block">
                  {activity.expectedOutput}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* The Exact Checkpoint Box */}
        <div className="p-3.5 bg-slate-50 rounded border border-slate-200">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="font-mono text-xs font-semibold uppercase text-slate-700">
              Ponto de Checagem Obrigatório ({activity.checkpointVerb}):
            </span>
          </div>

          <div className="text-xs font-medium text-slate-900 bg-white p-2.5 rounded border border-slate-200 mb-2 leading-relaxed">
            "{activity.checkpointPrompt}"
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Critério de Precisão: {activity.technicalCriterion}</span>
            <span>Métrica: Binária (Sim / Não)</span>
          </div>
        </div>

        {/* Phase 6 Final Publication Banner */}
        {activity.id === 'p6_a7' && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <div className="font-bold text-xs text-emerald-950">
                  Artefato Final: Mapa Narrativo Interativo em HTML
                </div>
                <div className="text-[11px] text-emerald-800">
                  Gere, visualize ao vivo e baixe o arquivo HTML autônomo completo com Leaflet e camadas GeoJSON auditadas.
                </div>
              </div>
            </div>
            {onPublishHtml && (
              <button
                type="button"
                onClick={onPublishHtml}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Publicar Mapa em HTML</span>
              </button>
            )}
          </div>
        )}

        {/* Binary Evaluation Control & Evidence Form */}
        {isUnlocked ? (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Evidência Técnica / Registro no SIG:
                </label>
                <input
                  type="text"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded text-slate-800 focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  placeholder="Ex: 0 nós corrompidos, checksum validado..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Administrador & Auditor Responsável (Exclusivo):
                </label>
                <div className="flex items-center gap-2 p-2 bg-slate-100 border border-slate-300 rounded text-xs font-mono text-slate-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Diógenes Luna</span>
                  <span className="text-slate-500">· UFCA (Administrador do Sistema)</span>
                </div>
              </div>
            </div>

            {/* Pauta Pending Warning Banner */}
            {!isPautaDefined && (
              <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Aguardando Definição Inicial da Pauta Editorial</span>
                </div>
                <p className="text-[11px] text-amber-900 leading-relaxed font-sans">
                  Conforme a regra metodológica, <strong>é proibido iniciar a etapa 1 com pautas pré-definidas ou aprovadas</strong> porque elas ainda não foram formuladas pelo jornalista. O repórter líder Diógenes Luna deve definir a pauta antes de validar atividades. Os valores e evidências só devem ser inseridos após esta definição inicial.
                </p>
                {onOpenPautaConfig && (
                  <button
                    type="button"
                    onClick={onOpenPautaConfig}
                    className="btn-base btn-sm btn-primary cursor-pointer shadow-xs"
                  >
                    <span>Configurar Pauta Editorial Inicial</span>
                  </button>
                )}
              </div>
            )}

            {/* Invalidation Fix Guidance (shown when activity was rejected) */}
            {isFailed && (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-rose-950 font-bold text-xs">
                  <Wrench className="w-4 h-4 text-rose-600" />
                  <span>Como Consertar Esta Invalidação (Sem Reiniciar o Fluxo):</span>
                </div>
                <div className="text-xs text-rose-900 space-y-1.5 pl-6 list-disc">
                  <p>1. <strong>Identificação:</strong> No QGIS, abra o <em>Verificador de Geometrias</em> para localizar os nós ou discrepâncias de SRC apontadas no ponto de checagem.</p>
                  <p>2. <strong>Correção:</strong> Execute a rotina de saneamento (ex: <code>native:fixgeometries</code> ou reprojeção para <code>EPSG:10857</code>).</p>
                  <p>3. <strong>Retomada:</strong> Insira a evidência técnica corrigida acima e clique em <em>Refazer e Validar Esta Atividade</em> para desparalisar e prosseguir imediatamente.</p>
                </div>
                <div className="pt-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => handleSave('Sim')}
                    className="btn-base btn-md btn-success shadow-md cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Refazer e Validar Esta Atividade (Sem Reiniciar da 1ª Etapa)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Binary Checkpoint Action Buttons (Standardized & Centered) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col items-center gap-3">
              <div className="btn-group-center w-full">
                {/* Button SIM with Help Icon & Tooltip */}
                <div className="relative group/sim-btn inline-flex">
                  <button
                    type="button"
                    disabled={!isPautaDefined}
                    onClick={() => handleSave('Sim')}
                    className={`btn-base btn-md ${
                      isValidated
                        ? 'btn-success'
                        : 'btn-success-light'
                    } ${!isPautaDefined ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={
                      !isPautaDefined
                        ? 'Defina e aprove a pauta editorial antes de validar atividades'
                        : 'Decisão definitiva: esta escolha é final e compõe a trilha permanente de auditoria.'
                    }
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SIM (Validar Ponto de Checagem)</span>
                    <span
                      className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-black/10 transition-colors opacity-75 group-hover/sim-btn:opacity-100"
                      aria-label="Ajuda sobre validação"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  {/* Tooltip */}
                  <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/sim-btn:flex flex-col items-center z-30 pointer-events-none w-64"
                  >
                    <div className="bg-slate-900 text-white text-[11px] leading-snug font-medium py-1.5 px-2.5 rounded shadow-xl text-center border border-slate-700">
                      Decisão definitiva: esta escolha é final e compõe a trilha permanente de auditoria.
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                  </div>
                </div>

                {/* Button NÃO with Help Icon & Tooltip */}
                <div className="relative group/nao-btn inline-flex">
                  <button
                    type="button"
                    disabled={!isPautaDefined}
                    onClick={() => handleSave('Não')}
                    className={`btn-base btn-md ${
                      isFailed
                        ? 'btn-danger'
                        : 'btn-danger-light'
                    } ${!isPautaDefined ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={
                      !isPautaDefined
                        ? 'Defina e aprove a pauta editorial antes de apontar erro'
                        : 'Decisão definitiva: esta escolha é final e compõe a trilha permanente de auditoria.'
                    }
                  >
                    <XCircle className="w-4 h-4" />
                    <span>NÃO (Apontar Erro / Invalidação)</span>
                    <span
                      className="inline-flex items-center justify-center p-0.5 rounded-full hover:bg-black/10 transition-colors opacity-75 group-hover/nao-btn:opacity-100"
                      aria-label="Ajuda sobre invalidação"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </span>
                  </button>

                  {/* Tooltip */}
                  <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/nao-btn:flex flex-col items-center z-30 pointer-events-none w-64"
                  >
                    <div className="bg-slate-900 text-white text-[11px] leading-snug font-medium py-1.5 px-2.5 rounded shadow-xl text-center border border-slate-700">
                      Decisão definitiva: este apontamento de erro é final e compõe a trilha permanente de auditoria.
                    </div>
                    <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1 border-r border-b border-slate-700"></div>
                  </div>
                </div>

                {isFailed && (
                  <button
                    type="button"
                    onClick={handleTriggerDiagnosis}
                    className="btn-base btn-md btn-danger shadow-xs animate-pulse cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Janela de Diagnóstico & Solução</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleTriggerDiagnosis}
                  className="btn-base btn-sm btn-secondary"
                  title="Abre a janela de aviso com diagnóstico técnico do erro e passo a passo de solução no QGIS"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                  <span>Simular/Inspecionar Erro</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-500 font-mono flex items-center justify-center gap-1.5 w-full">
                <Database className="w-3 h-3 text-slate-400" />
                <span>Auditoria Imutável em IndexedDB</span>
                <span>·</span>
                <span>Tolerância Zero a Imprecisões</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-slate-100 rounded text-xs text-slate-500 font-mono flex items-center justify-center gap-2 text-center">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Valide as atividades anteriores sequencialmente para desbloquear este ponto de checagem.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
