import React, { useState, useMemo } from 'react';
import { AuditRecord, DatabaseAdjustment, ProjectMetadata } from '../types/workflow';
import { dbService, generateAuditHash } from '../services/db';
import { AnalysisDashboard } from './AnalysisDashboard';
import { downloadAuditDossierPdf } from '../services/pdfExportService';
import { SpatialGeoJsonExportModal } from './SpatialGeoJsonExportModal';
import { GeoJsonVisualDiffModal } from './GeoJsonVisualDiffModal';
import { AttributeSchemaDisparityModal } from './AttributeSchemaDisparityModal';
import {
  isSpatialActivityRecord,
  buildGeoJsonForSingleRecord,
  buildConsolidatedGeoJson,
  downloadGeoJsonFile,
  downloadAuditRecordsGeoJsonFile,
  getSpatialAuditStats
} from '../services/spatialExportService';
import {
  auditGeoJsonSchema,
  injectSyntheticSchemaDisparity,
  SchemaAuditResult
} from '../services/schemaValidationService';
import {
  Database,
  Download,
  Upload,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  FileCheck,
  RefreshCw,
  PlusCircle,
  Shield,
  Layers,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  Globe,
  GitCompare,
  ShieldAlert,
  Wrench,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { AuditTimeline } from './AuditTimeline';

interface AuditDatabaseViewProps {
  project: ProjectMetadata;
  records: AuditRecord[];
  adjustments: DatabaseAdjustment[];
  onRefresh: () => void;
  onExportReport: () => void;
  onPublishHtml?: () => void;
  onReturnToWorkflow?: () => void;
}

export const AuditDatabaseView: React.FC<AuditDatabaseViewProps> = ({
  project,
  records,
  adjustments,
  onRefresh,
  onExportReport,
  onPublishHtml,
  onReturnToWorkflow
}) => {
  const [activeDbTab, setActiveDbTab] = useState<'records' | 'timeline' | 'analytics'>('records');
  const [phaseFilter, setPhaseFilter] = useState<number | 'all'>('all');
  const [evalFilter, setEvalFilter] = useState<'all' | 'Sim' | 'Não'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [isGeoJsonModalOpen, setIsGeoJsonModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  // Schema Monitoring State
  const [isSimulatedDisparity, setIsSimulatedDisparity] = useState<boolean>(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState<boolean>(false);

  // Consolidated GeoJSON dataset
  const currentGeoJson = useMemo(() => {
    const base = buildConsolidatedGeoJson(records, project);
    if (isSimulatedDisparity) {
      return injectSyntheticSchemaDisparity(base);
    }
    return base;
  }, [records, project, isSimulatedDisparity]);

  // Real-time Schema Audit Result
  const schemaAudit: SchemaAuditResult = useMemo(() => {
    return auditGeoJsonSchema(currentGeoJson);
  }, [currentGeoJson]);

  const handleHarmonizeSchema = () => {
    setIsSimulatedDisparity(false);
  };

  const handleSimulateDisparity = () => {
    setIsSimulatedDisparity(true);
  };

  // Spatial stats from validated activities
  const spatialStats = getSpatialAuditStats(records);

  // New Adjustment Modal / Form State
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [newEval, setNewEval] = useState<'Sim' | 'Não'>('Sim');
  const [newEvidence, setNewEvidence] = useState('');
  const [adjustedBy, setAdjustedBy] = useState(project.researcher);

  // Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Filter records
  const filteredRecords = records.filter((r) => {
    if (phaseFilter !== 'all' && r.phaseId !== phaseFilter) return false;
    if (evalFilter !== 'all' && r.evaluation !== evalFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        r.activityTitle.toLowerCase().includes(q) ||
        r.checkpointPrompt.toLowerCase().includes(q) ||
        r.technicalEvidence.toLowerCase().includes(q) ||
        r.operator.toLowerCase().includes(q) ||
        r.recordHash.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const handleDownloadJSON = async () => {
    const jsonStr = await dbService.exportFullDatabaseJSON(project.id);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banco_dados_geojornalismo_${project.id}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = async () => {
    const csvStr = await dbService.exportAuditCSV(project.id);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trilha_auditoria_geojornalismo_${project.id}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    downloadAuditDossierPdf(project, records, adjustments, {
      includeFullAuditTrail: true,
      includeAdjustments: true,
      includeMethodologyStatement: true
    });
  };

  const handleCreateAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId || !adjustmentReason.trim()) return;

    const target = records.find((r) => r.id === selectedRecordId);
    if (!target) return;

    const adjustment: DatabaseAdjustment = {
      id: `adj_${Date.now()}`,
      projectId: project.id,
      targetRecordId: target.id,
      adjustedAt: new Date().toISOString(),
      adjustedBy: adjustedBy || project.researcher,
      justification: adjustmentReason,
      previousEvaluation: target.evaluation,
      newEvaluation: newEval,
      previousEvidence: target.technicalEvidence,
      newEvidence: newEvidence || target.technicalEvidence
    };

    await dbService.saveAdjustment(adjustment);

    // Update target record with Retificado status
    const updatedRecord: AuditRecord = {
      ...target,
      evaluation: newEval,
      status: 'Retificado',
      technicalEvidence: newEvidence || target.technicalEvidence,
      timestamp: new Date().toISOString(),
      recordHash: generateAuditHash({
        projectId: project.id,
        phaseId: target.phaseId,
        activityNumber: target.activityNumber,
        evaluation: newEval,
        timestamp: new Date().toISOString(),
        operator: adjustedBy
      })
    };
    await dbService.saveAuditRecord(updatedRecord);

    setShowAdjustmentForm(false);
    setAdjustmentReason('');
    setSelectedRecordId('');
    onRefresh();
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    if (!importText.trim()) return;

    const success = await dbService.importDatabaseJSON(importText);
    if (success) {
      setImportStatus('sucesso');
      setTimeout(() => {
        setShowImportModal(false);
        setImportText('');
        onRefresh();
      }, 1000);
    } else {
      setImportStatus('erro');
    }
  };

  const handleDownloadAuditGeoJsonDirect = () => {
    downloadAuditRecordsGeoJsonFile(records, project, adjustments);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner & DB Metrics */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            {onReturnToWorkflow && (
              <button
                type="button"
                onClick={onReturnToWorkflow}
                className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#7b3819] hover:text-[#58240f] transition-colors mb-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Painel Operacional MapeIA</span>
              </button>
            )}
            <div className="flex items-center gap-2 text-xs font-mono text-stone-500 mb-1">
              <Database className="w-3.5 h-3.5 text-[#7b3819]" />
              <span>MOTOR DE BANCO DE DADOS: INDEXEDDB + AUDITORIA PERSISTENTE</span>
              <span>·</span>
              <span>LUNA (2026c)</span>
            </div>
            <h2 className="text-lg font-bold text-stone-900 font-serif">
              Banco de Dados de Auditoria, Controle, Registros e Ajustes
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Armazenamento estruturado de cada checagem realizada, rastros dos erros detectados,
              evidências de conformidade técnica e controle retrospectivo de ajustes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {onPublishHtml && (
              <button
                onClick={onPublishHtml}
                className="btn-base btn-sm btn-primary cursor-pointer"
                title="Publicar e visualizar o mapa narrativo final em formato HTML autônomo com Leaflet"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Publicar Webmap</span>
              </button>
            )}

            <button
              onClick={() => setIsDiffModalOpen(true)}
              className="btn-base btn-sm btn-indigo cursor-pointer"
              title="Comparar visualmente o GeoJSON exportado com o estado original bruto das camadas (Diff Visual com Sobreposição)"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff Visual GeoJSON</span>
            </button>

            <button
              onClick={() => setIsSchemaModalOpen(true)}
              className={`btn-base btn-sm cursor-pointer ${
                !schemaAudit.isValid
                  ? 'btn-danger animate-pulse'
                  : 'btn-secondary'
              }`}
              title="Sistema de Monitoramento de Esquema GeoJSON: detecta discrepâncias de atributos conforme ET-EDGV IBGE e Luna (2026c)"
            >
              {!schemaAudit.isValid ? (
                <ShieldAlert className="w-3.5 h-3.5" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>Monitor de Esquema</span>
              <span className="font-mono text-[10px] opacity-80">
                ({schemaAudit.isValid ? 'OK' : `${schemaAudit.disparitiesCount} alertas`})
              </span>
            </button>

            <button
              onClick={() => setIsGeoJsonModalOpen(true)}
              className="btn-base btn-sm btn-success cursor-pointer"
              title="Exportar dados espaciais das atividades validadas em formato GeoJSON (RFC 7946)"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Exportar GeoJSON</span>
              {spatialStats.validatedCount > 0 && (
                <span className="font-mono text-[10px] opacity-80">
                  ({spatialStats.validatedCount})
                </span>
              )}
            </button>

            <button
              onClick={handleDownloadAuditGeoJsonDirect}
              className="btn-base btn-sm btn-secondary cursor-pointer"
              title="Exportar os registros de auditoria em formato GeoJSON contendo os metadados de cada etapa para softwares de SIG externos (QGIS, ArcGIS)"
            >
              <FileCheck className="w-3.5 h-3.5 text-teal-600" />
              <span>Trilha SIG (GeoJSON)</span>
              <span className="font-mono text-[10px] text-slate-500">
                ({records.length})
              </span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn-base btn-sm btn-secondary cursor-pointer text-rose-700"
              title="Gerar e baixar laudo metodológico completo em PDF (jspdf)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF (Laudo)</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="btn-base btn-sm btn-secondary cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleDownloadCSV}
              className="btn-base btn-sm btn-secondary cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={onExportReport}
              className="btn-base btn-sm btn-secondary cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Relatório</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="btn-base btn-sm btn-secondary cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => setShowAdjustmentForm(true)}
              className="btn-base btn-sm btn-primary cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Novo Ajuste</span>
            </button>
          </div>
        </div>

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[11px] font-mono uppercase text-slate-500 block">
              Registros no Banco
            </span>
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {records.length}
            </span>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200">
            <span className="text-[11px] font-mono uppercase text-emerald-800 block">
              Validados ("Sim")
            </span>
            <span className="text-xl font-bold font-mono text-emerald-900 tabular-nums">
              {records.filter((r) => r.evaluation === 'Sim').length}
            </span>
          </div>

          <div className="p-3 bg-rose-50/60 rounded border border-rose-200">
            <span className="text-[11px] font-mono uppercase text-rose-800 block">
              Rastros de Erros ("Não")
            </span>
            <span className="text-xl font-bold font-mono text-rose-900 tabular-nums">
              {records.filter((r) => r.evaluation === 'Não').length}
            </span>
          </div>

          <div className="p-3 bg-amber-50/60 rounded border border-amber-200">
            <span className="text-[11px] font-mono uppercase text-amber-800 block">
              Ajustes Retrospectivos
            </span>
            <span className="text-xl font-bold font-mono text-amber-900 tabular-nums">
              {adjustments.length}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Alert System: Schema Disparity Detected */}
      {!schemaAudit.isValid && (
        <div className="bg-amber-50/90 border-2 border-amber-500/80 rounded-xl p-4 sm:p-5 shadow-sm text-slate-800 space-y-3.5 border-l-8 border-l-amber-600 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200 text-amber-900 uppercase">
                    Alerta de Não-Conformidade Cartográfica
                  </span>
                  <span className="text-[11px] font-mono text-amber-800">
                    ET-EDGV IBGE 2024 · Luna (2026c)
                  </span>
                </div>
                <h3 className="text-base font-bold text-amber-950 mt-0.5">
                  Disparidade de Atributos Detectada no Arquivo GeoJSON Exportado
                </h3>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed max-w-3xl">
                  O sistema de monitoramento identificou divergências entre as propriedades do GeoJSON e o esquema metodológico oficial normatizado. Campos obrigatórios ausentes, tipos de dados incompatíveis ou violações de domínio foram detectados nas camadas exportadas.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setIsSchemaModalOpen(true)}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Examinar Disparidades & Diagnóstico</span>
              </button>
              <button
                type="button"
                onClick={handleHarmonizeSchema}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-400 text-xs font-medium rounded transition-colors cursor-pointer"
                title="Restaurar a conformidade metodológica dos atributos originais"
              >
                <span>Harmonizar Esquema</span>
              </button>
            </div>
          </div>

          {/* Metrics & Preview of Disparities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-amber-200/80 text-xs">
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Feições Afetadas</span>
              <span className="text-sm font-bold font-mono text-amber-900">
                {schemaAudit.featuresWithDisparityCount} de {schemaAudit.totalFeaturesAudited}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Erros Críticos</span>
              <span className="text-sm font-bold font-mono text-rose-700">
                {schemaAudit.errorCount}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200">
              <span className="text-[10px] font-mono text-slate-500 uppercase block">Advertências de Domínio</span>
              <span className="text-sm font-bold font-mono text-amber-800">
                {schemaAudit.warningCount}
              </span>
            </div>
            <div className="bg-white/80 p-2 rounded border border-amber-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase block">Modo Atual</span>
                <span className="text-xs font-bold text-slate-800">
                  {isSimulatedDisparity ? 'Simulação Ativa' : 'Disparidade Real'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDiffModalOpen(true)}
                className="text-[11px] text-indigo-700 hover:text-indigo-900 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <GitCompare className="w-3 h-3" />
                <span>Diff Visual</span>
              </button>
            </div>
          </div>

          {/* Quick list of detected disparities */}
          {schemaAudit.disparities.length > 0 && (
            <div className="bg-amber-100/60 rounded-lg p-2.5 border border-amber-300/80 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-amber-900 font-semibold">
                <span>Resumo das Principais Inconformidades Detectadas:</span>
                <button
                  type="button"
                  onClick={() => setIsSchemaModalOpen(true)}
                  className="text-amber-800 underline hover:text-amber-950 font-sans cursor-pointer"
                >
                  Ver todas as {schemaAudit.disparities.length} ocorrências →
                </button>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {schemaAudit.disparities.slice(0, 3).map((disp) => (
                  <div
                    key={disp.id}
                    className="flex items-center justify-between gap-2 text-[11px] bg-white/90 px-2 py-1 rounded border border-amber-200 font-mono"
                  >
                    <span className="font-semibold text-slate-900 truncate">
                      [{disp.layerKey}] {disp.featureName} · campo <code className="text-rose-700 font-bold">{disp.fieldName}</code>
                    </span>
                    <span className="text-amber-800 shrink-0 text-[10px]">
                      {disp.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Alert System: Schema Conforming */}
      {schemaAudit.isValid && (
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 sm:p-4 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950">
                  Monitoramento de Esquema GeoJSON: 100% Conforme
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  ET-EDGV OK
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Todas as feições exportadas em GeoJSON cumprem integralmente a especificação dos atributos metodológicos (Luna 2026c; IBGE 2024). Nenhum campo obrigatório ausente ou disparidade detectada.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsSchemaModalOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span>Ver Esquema ({schemaAudit.totalFeaturesAudited} feições)</span>
            </button>
            <button
              type="button"
              onClick={handleSimulateDisparity}
              className="px-2.5 py-1 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Injetar disparidades artificiais para testar o alerta visual e fluxo de mitigação"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Simular Disparidade (Teste)</span>
            </button>
          </div>
        </div>
      )}

      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-2 border-b border-stone-200">
        <button
          onClick={() => setActiveDbTab('records')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeDbTab === 'records'
              ? 'border-[#7b3819] text-[#7b3819]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Database className="w-4 h-4 text-[#7b3819]" />
          <span>Registros & Trilha de Auditoria</span>
        </button>

        <button
          onClick={() => setActiveDbTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeDbTab === 'timeline'
              ? 'border-[#7b3819] text-[#7b3819]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Clock className="w-4 h-4 text-[#c07d19]" />
          <span>Histórico de Eventos (Timeline)</span>
        </button>

        <button
          onClick={() => setActiveDbTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeDbTab === 'analytics'
              ? 'border-[#7b3819] text-[#7b3819]'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-[#7b3819]" />
          <span>Análise de Precisão (Gráficos)</span>
        </button>
      </div>

      {activeDbTab === 'timeline' ? (
        <AuditTimeline
          project={project}
          records={records}
          adjustments={adjustments}
          onSelectRecord={(recId) => {
            setExpandedRecordId(recId);
            setActiveDbTab('records');
          }}
        />
      ) : activeDbTab === 'analytics' ? (
        <AnalysisDashboard
          records={records}
          adjustments={adjustments}
          project={project}
        />
      ) : (
        <>
          {/* Filter and Search Bar */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              {/* Phase Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">Fase:</span>
                <select
                  value={phaseFilter}
                  onChange={(e) =>
                    setPhaseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="p-1.5 border border-slate-300 rounded font-mono text-xs text-slate-800 bg-white"
                >
                  <option value="all">Todas as 6 Fases</option>
                  <option value="1">4.1. Conceber</option>
                  <option value="2">4.2. Compilar</option>
                  <option value="3">4.3. Limpar</option>
                  <option value="4">4.4. Contextualizar</option>
                  <option value="5">4.5. Analisar</option>
                  <option value="6">4.6. Comunicar</option>
                </select>
              </div>

              {/* Metric Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-mono">Avaliação:</span>
                <select
                  value={evalFilter}
                  onChange={(e) => setEvalFilter(e.target.value as any)}
                  className="p-1.5 border border-slate-300 rounded font-mono text-xs text-slate-800 bg-white"
                >
                  <option value="all">Todas (Sim e Não)</option>
                  <option value="Sim">Apenas Validadas ("Sim")</option>
                  <option value="Não">Apenas Erros ("Não")</option>
                </select>
              </div>
            </div>

            {/* Search input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por prompt, hash, evidência..."
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

      {/* Main Records Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider">
            Registros Gravados no Banco ({filteredRecords.length})
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Ordenado cronologicamente (Rastreabilidade)
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <Database className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">Nenhum registro encontrado no banco.</p>
            <p className="mt-1">
              Inicie o fluxo na aba "Fluxo e Protocolo" e valide os pontos de checagem.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-mono uppercase text-slate-500">
                  <th className="py-2.5 px-4">Hash / ID</th>
                  <th className="py-2.5 px-4">Fase & Atividade</th>
                  <th className="py-2.5 px-4">Ponto de Checagem</th>
                  <th className="py-2.5 px-4">Métrica</th>
                  <th className="py-2.5 px-4">Auditor / Data</th>
                  <th className="py-2.5 px-4 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredRecords.map((r) => {
                  const isExpanded = expandedRecordId === r.id;
                  const isSim = r.evaluation === 'Sim';

                  return (
                    <React.Fragment key={r.id}>
                      <tr
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !isSim ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-[11px] text-slate-600 whitespace-nowrap">
                          <span className="font-semibold text-slate-800">{r.recordHash}</span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-sans font-semibold text-slate-900 text-xs flex items-center gap-1.5 flex-wrap">
                            <span>{r.activityTitle}</span>
                            {isSpatialActivityRecord(r) && isSim && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <MapPin className="w-2.5 h-2.5 text-emerald-700" />
                                GeoJSON
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Fase {r.phaseId}: {r.phaseName} · Ativ. {r.activityNumber}
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs truncate font-sans text-xs text-slate-700">
                          <span className="font-semibold font-mono text-[10px] uppercase text-blue-700 mr-1">
                            [{r.checkpointVerb}]
                          </span>
                          "{r.checkpointPrompt}"
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isSim ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              SIM
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                              <XCircle className="w-3 h-3" />
                              NÃO
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap text-[11px] text-slate-600">
                          <div className="text-slate-800">{r.operator}</div>
                          <div className="text-[10px] text-slate-400">
                            {new Date(r.timestamp).toLocaleDateString('pt-BR')} {new Date(r.timestamp).toLocaleTimeString('pt-BR')}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() =>
                              setExpandedRecordId(isExpanded ? null : r.id)
                            }
                            className="p-1 hover:bg-slate-200 rounded transition-colors text-slate-600"
                            title="Expandir dados técnicos"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded View */}
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <td colSpan={6} className="p-4 font-sans text-xs text-slate-800">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded border border-slate-200 mb-3">
                              <div>
                                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                                  Entrada Auditada:
                                </span>
                                <span className="text-[11px] text-slate-700">
                                  {r.inputsChecked}
                                </span>
                              </div>
                              <div>
                                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                                  Operação Realizada no SIG:
                                </span>
                                <span className="text-[11px] text-slate-700">
                                  {r.operationsPerformed}
                                </span>
                              </div>
                              <div>
                                <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                                  Saída Gerada:
                                </span>
                                <span className="text-[11px] text-slate-700">
                                  {r.outputProduced}
                                </span>
                              </div>
                            </div>

                            <div className="p-3 bg-white rounded border border-slate-200 space-y-1.5">
                              <div>
                                <span className="font-mono text-[10px] uppercase text-slate-500 block">
                                  Evidência Técnica Registrada:
                                </span>
                                <p className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 mt-1">
                                  {r.technicalEvidence || 'Nenhuma observação informada.'}
                                </p>
                              </div>

                              {r.errorDiagnosis && (
                                <div className="mt-2 pt-2 border-t border-rose-100 text-rose-950">
                                  <span className="font-mono text-[10px] uppercase text-rose-700 font-bold block">
                                    Diagnóstico do Erro & Rastreabilidade:
                                  </span>
                                  <p className="font-mono text-xs bg-rose-50 p-2 rounded border border-rose-200 mt-1 text-rose-900">
                                    {r.errorDiagnosis}
                                  </p>
                                  {r.correctiveAction && (
                                    <p className="font-mono text-xs bg-emerald-50 p-2 rounded border border-emerald-200 mt-1 text-emerald-900">
                                      <strong>Ação Corretiva:</strong> {r.correctiveAction}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Spatial GeoJSON Download Action Block */}
                              {isSpatialActivityRecord(r) && isSim && (
                                <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                      <MapPin className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-emerald-950 text-xs">
                                          Resultado Espacial Validado · GeoJSON (RFC 7946)
                                        </span>
                                        <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono font-semibold">
                                          WGS 84 / EPSG:4326
                                        </span>
                                      </div>
                                      <span className="text-[11px] text-emerald-800 leading-tight block mt-0.5">
                                        Esta atividade produziu camadas e geometrias auditadas. Você pode baixar diretamente o arquivo GeoJSON desta camada.
                                      </span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const singleGeoJson = buildGeoJsonForSingleRecord(r, project);
                                      downloadGeoJsonFile(
                                        singleGeoJson,
                                        `geojornalismo_ativ_${r.activityNumber}_${r.activityId}`
                                      );
                                    }}
                                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold font-mono flex items-center justify-center gap-1.5 transition-colors shrink-0 shadow-2xs cursor-pointer"
                                    title="Baixar arquivo GeoJSON desta atividade específica"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Baixar GeoJSON (.geojson)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjustments History Table */}
      {adjustments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Trilha de Ajustes e Retificações Futuras ({adjustments.length})
            </h3>
          </div>
          <div className="space-y-2">
            {adjustments.map((adj) => (
              <div
                key={adj.id}
                className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 mb-1">
                  <span>
                    Ajustado por: <strong className="text-slate-800">{adj.adjustedBy}</strong>
                  </span>
                  <span>{new Date(adj.adjustedAt).toLocaleString('pt-BR')}</span>
                </div>
                <div className="text-slate-800 font-sans">
                  <strong>Justificativa Metodológica:</strong> {adj.justification}
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Transição: <span className="text-rose-700 font-semibold">{adj.previousEvaluation}</span> → <span className="text-emerald-700 font-semibold">{adj.newEvaluation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </>
      )}

      {/* New Adjustment Modal */}
      {showAdjustmentForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Registrar Ajuste / Retificação Metodológica
            </h3>
            <p className="text-xs text-slate-600 mb-4">
              Qualquer alteração em registros anteriores exige justificativa formal para
              preservar a integridade da auditoria científica (Luna, 2026c).
            </p>

            <form onSubmit={handleCreateAdjustment} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Selecione a Atividade para Ajuste:
                </label>
                <select
                  value={selectedRecordId}
                  onChange={(e) => setSelectedRecordId(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded bg-white text-slate-800"
                  required
                >
                  <option value="">-- Selecione uma atividade registrada --</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      [{r.recordHash}] Fase {r.phaseId}: {r.activityTitle} ({r.evaluation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nova Avaliação:
                  </label>
                  <select
                    value={newEval}
                    onChange={(e) => setNewEval(e.target.value as 'Sim' | 'Não')}
                    className="w-full text-xs font-mono p-2 border border-slate-300 rounded bg-white text-slate-800"
                  >
                    <option value="Sim">Sim (Validar)</option>
                    <option value="Não">Não (Acusar Erro)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Auditor / Responsável:
                  </label>
                  <input
                    type="text"
                    value={adjustedBy}
                    onChange={(e) => setAdjustedBy(e.target.value)}
                    className="w-full text-xs font-mono p-2 border border-slate-300 rounded text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Justificativa Científica do Ajuste:
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  rows={3}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded text-slate-800"
                  placeholder="Explique o motivo do ajuste, nova literatura, rechecagem de parâmetro do SIG..."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nova Evidência Técnica:
                </label>
                <input
                  type="text"
                  value={newEvidence}
                  onChange={(e) => setNewEvidence(e.target.value)}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded text-slate-800"
                  placeholder="Nova evidência gerada pós-ajuste..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentForm(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded hover:bg-slate-800"
                >
                  Gravar Ajuste no Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Importar Backup do Banco de Dados
            </h3>
            <p className="text-xs text-slate-600 mb-3">
              Cole o conteúdo JSON gerado anteriormente para restaurar a sessão de auditoria.
            </p>

            <form onSubmit={handleImportSubmit} className="space-y-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={8}
                className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded text-slate-800"
                placeholder='Cole o JSON completo do banco de dados aqui...'
                required
              />

              {importStatus === 'sucesso' && (
                <div className="p-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-xs font-mono">
                  Banco de dados importado com sucesso!
                </div>
              )}
              {importStatus === 'erro' && (
                <div className="p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded text-xs font-mono">
                  Erro ao importar. Certifique-se de que o JSON seja um backup válido do sistema.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Restaurar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spatial GeoJSON Export Modal */}
      <SpatialGeoJsonExportModal
        isOpen={isGeoJsonModalOpen}
        onClose={() => setIsGeoJsonModalOpen(false)}
        project={project}
        records={records}
        adjustments={adjustments}
        onPublishHtml={onPublishHtml}
        onOpenDiff={() => {
          setIsGeoJsonModalOpen(false);
          setIsDiffModalOpen(true);
        }}
        onOpenSchemaMonitor={() => {
          setIsGeoJsonModalOpen(false);
          setIsSchemaModalOpen(true);
        }}
      />

      {/* GeoJSON Visual Diff & Topology Overlay Modal */}
      <GeoJsonVisualDiffModal
        isOpen={isDiffModalOpen}
        onClose={() => setIsDiffModalOpen(false)}
        project={project}
        records={records}
      />

      {/* Attribute Schema Disparity Monitoring Modal */}
      <AttributeSchemaDisparityModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
        auditResult={schemaAudit}
        onHarmonizeSchema={handleHarmonizeSchema}
        onSimulateDisparity={handleSimulateDisparity}
        isSimulated={isSimulatedDisparity}
      />
    </div>
  );
};
