import React, { useState } from 'react';
import {
  SchemaAuditResult,
  AttributeDisparity,
  METHODOLOGY_SCHEMA_SPECS
} from '../services/schemaValidationService';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Wrench,
  X,
  Sliders,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Database,
  Code2
} from 'lucide-react';

interface AttributeSchemaDisparityModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditResult: SchemaAuditResult;
  onHarmonizeSchema: () => void;
  onSimulateDisparity: () => void;
  isSimulated: boolean;
}

export const AttributeSchemaDisparityModal: React.FC<AttributeSchemaDisparityModalProps> = ({
  isOpen,
  onClose,
  auditResult,
  onHarmonizeSchema,
  onSimulateDisparity,
  isSimulated
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedDisparity, setSelectedDisparity] = useState<AttributeDisparity | null>(null);

  if (!isOpen) return null;

  const filteredDisparities = auditResult.disparities.filter((d) => {
    if (filterType === 'all') return true;
    return d.disparityType === filterType;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-3 flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 shadow-md ${
                auditResult.isValid ? 'bg-emerald-600' : 'bg-amber-600'
              }`}
            >
              {auditResult.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Auditoria de Metadados Cartográficos · ET-EDGV IBGE (2024)
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  Luna (2026c)
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Auditoria e Monitoramento de Disparidade de Atributos GeoJSON
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!auditResult.isValid && (
              <button
                type="button"
                onClick={onHarmonizeSchema}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                title="Corrigir automaticamente as disparidades de atributos"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Harmonizar Esquema</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Strip & Simulator Controls */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-3">
            {auditResult.isValid ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                100% Conforme: 0 Disparidades no Esquema Oficial
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-900 font-semibold bg-amber-100 border border-amber-300 px-2.5 py-1 rounded">
                <AlertTriangle className="w-4 h-4 text-amber-600 animate-pulse" />
                {auditResult.disparitiesCount} Disparidades em {auditResult.featuresWithDisparityCount} Feições
              </span>
            )}

            <span className="text-slate-500">
              {auditResult.compliantFeaturesCount} de {auditResult.totalFeaturesAudited} feições em conformidade
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSimulated ? (
              <button
                type="button"
                onClick={onHarmonizeSchema}
                className="px-2.5 py-1 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-800 rounded font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-emerald-600" />
                <span>Restaurar Base Conforme</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSimulateDisparity}
                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 rounded text-xs flex items-center gap-1 transition-colors"
                title="Injeta anomalias controladas no esquema (campo ausente, tipagem errada e coluna espúria) para teste"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Simular Disparidade para Teste</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Strip */}
        <div className="bg-white border-b border-slate-100 px-6 py-2 flex items-center gap-2 overflow-x-auto shrink-0 text-xs">
          <span className="font-mono text-slate-500 font-bold text-[11px] uppercase">Filtrar:</span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todas ({auditResult.disparitiesCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('missing_field')}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
              filterType === 'missing_field'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            Campos Ausentes ({auditResult.disparities.filter((d) => d.disparityType === 'missing_field').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('type_mismatch')}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
              filterType === 'type_mismatch'
                ? 'bg-amber-700 text-white font-bold'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            Tipagem Divergente ({auditResult.disparities.filter((d) => d.disparityType === 'type_mismatch').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('spurious_field')}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
              filterType === 'spurious_field'
                ? 'bg-purple-700 text-white font-bold'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            Colunas Espúrias ({auditResult.disparities.filter((d) => d.disparityType === 'spurious_field').length})
          </button>

          <button
            type="button"
            onClick={() => setFilterType('null_value')}
            className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors ${
              filterType === 'null_value'
                ? 'bg-slate-800 text-white font-bold'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Valores Nulos ({auditResult.disparities.filter((d) => d.disparityType === 'null_value').length})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
          {auditResult.isValid ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto shadow-xs space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Esquema de Atributos em Conformidade Rigorosa
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Todas as <strong>{auditResult.totalFeaturesAudited} feições espaciais</strong> exportadas
                possuem os atributos requeridos, tipagem correta (SIRGAS 2000 Albers em ponto flutuante),
                ausência de colunas temporárias e classificações condicionais dentro do vocabulário controlado de Luna (2026c).
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onSimulateDisparity}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-mono text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Simular Disparidade de Esquema (Demonstração de Alerta)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDisparities.map((disp) => (
                <div
                  key={disp.id}
                  className={`p-4 rounded-lg border transition-all ${
                    disp.severity === 'error'
                      ? 'bg-white border-rose-300 shadow-2xs hover:border-rose-400'
                      : 'bg-white border-amber-300 shadow-2xs hover:border-amber-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase ${
                          disp.disparityType === 'missing_field'
                            ? 'bg-rose-100 text-rose-800'
                            : disp.disparityType === 'type_mismatch'
                            ? 'bg-amber-100 text-amber-800'
                            : disp.disparityType === 'spurious_field'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {disp.disparityType === 'missing_field'
                          ? 'Campo Obrigatório Ausente'
                          : disp.disparityType === 'type_mismatch'
                          ? 'Tipagem Divergente'
                          : disp.disparityType === 'spurious_field'
                          ? 'Coluna Espúria Transitória'
                          : 'Violação de Domínio / Nulo'}
                      </span>

                      <strong className="text-xs font-mono text-slate-900">
                        {disp.fieldName}
                      </strong>
                    </div>

                    <div className="text-[11px] font-mono text-slate-500">
                      Feição: <strong className="text-slate-800">{disp.featureId}</strong> ({disp.featureName})
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mb-3">
                    {disp.message}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono mb-2">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Esperado pelo Esquema Oficial:</span>
                      <strong className="text-emerald-700">{disp.expected}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Recebido no Arquivo GeoJSON:</span>
                      <strong className="text-rose-700">{disp.received}</strong>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Ação Corretiva: {disp.remedyHint}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 text-white px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Padrão Metodológico: Luna (2026c) · ET-EDGV IBGE · OGC RFC 7946</span>
          </div>

          <div className="flex items-center gap-3">
            {!auditResult.isValid && (
              <button
                type="button"
                onClick={onHarmonizeSchema}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
              >
                Harmonizar Agora
              </button>
            )}
            <span className="text-slate-600">·</span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
