import React, { useState } from 'react';
import { AlertOctagon, Wrench, ShieldAlert } from 'lucide-react';
import { AuditRecord } from '../types/workflow';

interface ParalyzedAlertProps {
  paralyzedRecord: AuditRecord;
  onResolveAndValidate: (
    diagnosis: string,
    action: string,
    recheckEvidence: string
  ) => void;
}

export const ParalyzedAlert: React.FC<ParalyzedAlertProps> = ({
  paralyzedRecord,
  onResolveAndValidate
}) => {
  const [diagnosis, setDiagnosis] = useState(
    paralyzedRecord.errorDiagnosis ||
      'Inconsistência detectada durante a checagem: divergência de parâmetros ou geometria fora do padrão requerido.'
  );
  const [correctiveAction, setCorrectiveAction] = useState(
    paralyzedRecord.correctiveAction ||
      'Executada rotina de correção no QGIS/SIG. Nova verificação atesta conformidade integral (erros = 0).'
  );
  const [recheckEvidence, setRecheckEvidence] = useState(
    'Rechecagem efetuada com sucesso: contagem de anomalias igual a 0. Todas as condições satisfeitas.'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim() || !correctiveAction.trim()) return;
    onResolveAndValidate(diagnosis, correctiveAction, recheckEvidence);
  };

  return (
    <div className="bg-rose-50 border-2 border-rose-500 rounded-lg p-5 my-6 shadow-sm">
      <div className="flex items-start gap-3.5">
        <div className="p-2 bg-rose-600 rounded text-white shrink-0 mt-0.5">
          <AlertOctagon className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-rose-800">
              Protocolo Paralisado por Imprecisão Detectada
            </span>
            <span className="text-xs font-mono text-rose-700">
              Hash: {paralyzedRecord.recordHash} · {new Date(paralyzedRecord.timestamp).toLocaleTimeString('pt-BR')}
            </span>
          </div>

          <h3 className="text-base font-bold text-rose-950">
            Atividade {paralyzedRecord.activityNumber}: {paralyzedRecord.activityTitle}
          </h3>

          <p className="text-xs text-rose-900 mt-1.5 leading-relaxed">
            <strong>Regra Metodológica Intransigente:</strong> A métrica de precisão é binária.
            Nenhuma atividade posterior pode ser executada enquanto esta permanecer invalidada
            (Luna, 2026c). O rastro do erro foi registrado no banco de dados para
            auditoria e controle.
          </p>

          <div className="mt-3 p-3 bg-white/80 rounded border border-rose-200 text-xs">
            <div className="text-slate-500 font-mono text-[11px] mb-0.5">Ponto de Checagem Reprovado:</div>
            <div className="font-semibold text-rose-950">
              "{paralyzedRecord.checkpointPrompt}"
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              <strong>Entrada Auditada:</strong> {paralyzedRecord.inputsChecked}
            </div>
          </div>

          {/* Corrective Action Form */}
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-rose-950 mb-1">
                1. Diagnóstico do Erro Identificado (Rastreabilidade):
              </label>
              <textarea
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                rows={2}
                className="w-full text-xs font-mono p-2.5 bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                placeholder="Descreva o erro exato detectado no arquivo ou operação..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-950 mb-1">
                2. Ação Corretiva Executada no SIG / Dados:
              </label>
              <textarea
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                rows={2}
                className="w-full text-xs font-mono p-2.5 bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                placeholder="Descreva os passos e ferramentas executadas para sanar o erro..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-rose-950 mb-1">
                3. Evidência Técnica da Nova Checagem (Resultado = 0 erros):
              </label>
              <input
                type="text"
                value={recheckEvidence}
                onChange={(e) => setRecheckEvidence(e.target.value)}
                className="w-full text-xs font-mono p-2.5 bg-white border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                placeholder="Laudo técnico pós-correção..."
                required
              />
            </div>

            <div className="pt-3 flex flex-col items-center justify-center gap-3 border-t border-rose-200">
              <span className="text-[11px] text-rose-800 font-mono flex items-center justify-center gap-1.5 text-center">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>A correção atualiza o banco de dados preservando a rastreabilidade do erro. O fluxo recomeça a partir desta atividade exata.</span>
              </span>

              <div className="btn-group-center w-full">
                <button
                  type="submit"
                  className="btn-base btn-md btn-success shadow-md cursor-pointer"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Salvar Correção e Retomar Fluxo (Sem Reiniciar da 1ª Etapa)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
