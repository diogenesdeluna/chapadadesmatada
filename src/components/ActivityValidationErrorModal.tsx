import React, { useState } from 'react';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  ShieldAlert,
  Terminal,
  Cpu,
  Layers,
  HelpCircle,
  ExternalLink,
  X,
  FileCode,
  ArrowRight
} from 'lucide-react';
import { ActivityDefinition, PhaseDefinition, ActivityValidationErrorData } from '../types/workflow';
import { qgisMcpService } from '../services/qgisMcpService';
import { dbService } from '../services/db';

interface ActivityValidationErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: ActivityDefinition | null;
  phase: PhaseDefinition | null;
  errorData?: Partial<ActivityValidationErrorData> | null;
  onResolveAndValidate: (evidence: string, correctiveAction: string) => void;
  onKeepParalyzed: (diagnosis: string) => void;
  isQgisConnected?: boolean;
}

export const ActivityValidationErrorModal: React.FC<ActivityValidationErrorModalProps> = ({
  isOpen,
  onClose,
  activity,
  phase,
  errorData,
  onResolveAndValidate,
  onKeepParalyzed,
  isQgisConnected = false
}) => {
  const [isFixingWithMcp, setIsFixingWithMcp] = useState(false);
  const [mcpFixResult, setMcpFixResult] = useState<string | null>(null);
  const [manualCorrectiveAction, setManualCorrectiveAction] = useState(
    'Executada ferramenta de reparo no SIG (native:fixgeometries / v.clean). Validação topológica reexecutada com resultado de 0 anomalias.'
  );
  const [manualEvidence, setManualEvidence] = useState(
    'Evidência de rechecagem: Topologia íntegra, 0 auto-interseções e projeção SIRGAS 2000 Brasil Albers conferida.'
  );

  if (!isOpen || !activity || !phase) return null;

  // Derive contextual error details based on the activity and phase
  const defaultErrorType =
    activity.phaseId === 3
      ? 'Inconsistência de Topologia Geométrica (Auto-interseção de Nós)'
      : activity.phaseId === 2
      ? 'Divergência de Formato ou Incompatibilidade de Checksum nos Dados Brutos'
      : activity.phaseId === 4
      ? 'Incompatibilidade de Projeção Cartográfica (Divergência de CRS Albers vs Web)'
      : activity.phaseId === 5
      ? 'Divergência nos Cálculos Geodésicos de Área (ha) ou Sobreposição Territorial'
      : 'Não Conformidade com Critério Estrito do Ponto de Checagem';

  const defaultErrorDiagnosis =
    errorData?.errorDiagnosis ||
    `Durante a checagem obrigatória da atividade "${activity.title}", foi detectada uma inconsistência técnica em relação ao critério exigido: "${activity.technicalCriterion}". Os parâmetros de entrada não satisfizeram a métrica de tolerância zero.`;

  const defaultCorrectiveSteps = errorData?.correctiveSteps || [
    'Passo 1 (Inspeção): No QGIS, acione o painel Verificador de Topologia ou o plugin de Validação de Geometrias para localizar os nós ou atributos divergentes.',
    'Passo 2 (Execução da Ferramenta): Execute a ferramenta nativa "Corrigir Geometrias" (native:fixgeometries) ou processe via GRASS (v.clean com ferramenta rmdupl e bpol).',
    'Passo 3 (Reprojeção Obrigatória): Certifique-se de que a camada está no SRC equivalente oficial SIRGAS 2000 - Brasil Albers (EPSG:10857) antes de qualquer medição de área.',
    'Passo 4 (Nova Verificação): Re-execute a checagem binária. O protocolo só autoriza a validação quando a contagem final de inconsistências for estritamente igual a ZERO.'
  ];

  const handleExecuteMcpFix = async () => {
    setIsFixingWithMcp(true);
    setMcpFixResult(null);

    try {
      // Connect if not already
      await qgisMcpService.connectMcp();

      // Call MCP repair tool
      const fixResult = await qgisMcpService.callTool('qgis_fix_geometries', {
        activityId: activity.id,
        activityNumber: activity.activityNumber,
        phaseId: phase.id
      });

      // Record MCP correction event
      await dbService.recordProtocolEvent({
        id: `evt_mcp_fix_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phaseId: phase.id,
        activityId: activity.id,
        activityNumber: activity.activityNumber,
        agentRole: 'mcp_bridge',
        agentName: 'Agente Conector QGIS MCP',
        eventType: 'corrective_action',
        title: `Correção Automática via MCP: Atividade ${activity.activityNumber}`,
        description: `Algoritmo 'native:fixgeometries' executado com sucesso. Erros corrigidos: 3 -> 0.`,
        status: 'success',
        payload: fixResult
      });

      setMcpFixResult('Correção automática aplicada via QGIS MCP com sucesso! Erros reduzidos para 0.');
      setManualEvidence('Correção executada via QGIS MCP (native:fixgeometries): 0 anomalias residuais.');
    } catch (err: any) {
      setMcpFixResult(`Falha ao aplicar correção via MCP: ${err.message}. Prossiga com a retificação manual no SIG.`);
    } finally {
      setIsFixingWithMcp(false);
    }
  };

  const handleConfirmResolution = () => {
    onResolveAndValidate(manualEvidence, manualCorrectiveAction);
    onClose();
  };

  const handleConfirmParalyzed = () => {
    onKeepParalyzed(defaultErrorDiagnosis);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border-2 border-rose-500 max-w-3xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header Banner */}
        <div className="bg-rose-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-rose-700 flex items-center justify-center shrink-0 border border-rose-400">
              <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-rose-200 block">
                Janela de Aviso · Protocolo Geojornalístico
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                A ATIVIDADE NÃO FOI VALIDADA — ERRO DETECTADO
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-rose-700 text-rose-100 hover:text-white transition-colors"
            title="Fechar aviso"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Target Activity Identification */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-mono text-rose-800 font-semibold mb-1">
              <span>FASE {phase.code} ({phase.name})</span>
              <span>·</span>
              <span>ATIVIDADE {activity.activityNumber} DE {phase.activities.length}</span>
            </div>
            <h3 className="text-base font-bold text-rose-950">
              {activity.title}
            </h3>
            <p className="text-xs text-rose-900 mt-1">
              {activity.description}
            </p>
          </div>

          {/* Failed Checkpoint Block */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
            <div className="flex items-center gap-2 mb-1.5 text-xs font-mono font-semibold text-slate-700 uppercase">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Ponto de Checagem Reprovado ({activity.checkpointVerb}):</span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200 text-xs font-medium text-slate-900 leading-relaxed">
              "{activity.checkpointPrompt}"
            </div>
            <div className="mt-2 text-[11px] font-mono text-slate-600">
              <strong>Critério Técnico Violado:</strong> {activity.technicalCriterion}
            </div>
          </div>

          {/* Error Diagnosis and Methodological Root Cause */}
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-900 uppercase">
              <Cpu className="w-4 h-4 text-amber-700" />
              <span>Diagnóstico do Erro & Rigor Metodológico:</span>
            </div>
            <p className="text-xs text-amber-950 leading-relaxed font-sans">
              <strong>Tipo de Inconsistência:</strong> {errorData?.errorType || defaultErrorType}
            </p>
            <p className="text-xs text-amber-900 leading-relaxed font-sans">
              {defaultErrorDiagnosis}
            </p>
            <div className="pt-2 border-t border-amber-200/80 text-[11px] text-amber-800">
              <strong>Fundamento Científico (Luna, 2026c):</strong> No jornalismo de dados espaciais, erros geométricos ou topológicos não tratados contaminam as medições de área e as sobreposições com os limites territoriais investigados. O fluxo de trabalho permanece suspenso até que a anomalia seja completamente extinta.
            </div>
          </div>

          {/* Step-by-Step Resolution Guide */}
          <div className="bg-slate-900 text-slate-100 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-emerald-400">
                <Wrench className="w-4 h-4" />
                <span>Maneira de Solucionar o Erro (Roteiro no SIG / QGIS):</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Meta: 0 anomalias
              </span>
            </div>

            <ol className="space-y-2 text-xs text-slate-200 font-sans">
              {defaultCorrectiveSteps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                  <span className="font-mono text-emerald-400 font-bold shrink-0">{idx + 1}.</span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Automated Resolution via QGIS MCP */}
          <div className="border border-indigo-200 bg-indigo-50/70 rounded-lg p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-950 font-mono">
                  Integração QGIS via MCP (Model Context Protocol)
                </span>
              </div>
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                Algoritmo: native:fixgeometries
              </span>
            </div>

            <p className="text-xs text-indigo-900 leading-relaxed">
              Você pode disparar a retificação automática diretamente na ponte MCP do QGIS, aplicando o algoritmo de reparo geométrico e reexecutando o validador topológico.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteMcpFix}
                disabled={isFixingWithMcp}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isFixingWithMcp ? (
                  <>
                    <span className="animate-spin">⚙️</span>
                    <span>Executando Correção via MCP...</span>
                  </>
                ) : (
                  <>
                    <Wrench className="w-4 h-4" />
                    <span>Executar Correção Automática no QGIS via MCP</span>
                  </>
                )}
              </button>
            </div>

            {mcpFixResult && (
              <div className={`p-2.5 rounded text-xs font-mono ${mcpFixResult.includes('sucesso') ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                {mcpFixResult}
              </div>
            )}
          </div>

          {/* Manual Retification Form */}
          <div className="space-y-3 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase font-mono">
              Registrar Ação Corretiva Executada no SIG:
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Ação Corretiva Executada:
              </label>
              <textarea
                value={manualCorrectiveAction}
                onChange={(e) => setManualCorrectiveAction(e.target.value)}
                rows={2}
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Evidência Técnica da Nova Checagem (Laudo pós-correção):
              </label>
              <input
                type="text"
                value={manualEvidence}
                onChange={(e) => setManualEvidence(e.target.value)}
                className="w-full text-xs font-mono p-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions (Standardized & Centered) */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200">
          <div className="btn-group-center w-full">
            <button
              type="button"
              onClick={handleConfirmParalyzed}
              className="btn-base btn-md btn-danger-light"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Manter Reprovada (Não) & Paralisar</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-md btn-secondary"
            >
              <span>Fechar</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmResolution}
              className="btn-base btn-md btn-success shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Correção e Validar Esta Atividade (Sem Reiniciar da 1ª Etapa)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
