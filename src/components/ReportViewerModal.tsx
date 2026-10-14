import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { ProjectMetadata, AuditRecord, DatabaseAdjustment } from '../types/workflow';
import { downloadAuditDossierPdf } from '../services/pdfExportService';
import {
  FileText,
  Download,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  FileCheck,
  Loader2
} from 'lucide-react';

interface ReportViewerModalProps {
  project: ProjectMetadata;
  records?: AuditRecord[];
  adjustments?: DatabaseAdjustment[];
  isOpen: boolean;
  onClose: () => void;
}

export const ReportViewerModal: React.FC<ReportViewerModalProps> = ({
  project,
  records: propRecords,
  adjustments: propAdjustments,
  isOpen,
  onClose
}) => {
  const [reportMarkdown, setReportMarkdown] = useState('');
  const [internalRecords, setInternalRecords] = useState<AuditRecord[]>(propRecords || []);
  const [internalAdjustments, setInternalAdjustments] = useState<DatabaseAdjustment[]>(
    propAdjustments || []
  );
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'summary' | 'markdown'>('summary');

  useEffect(() => {
    if (isOpen) {
      dbService.exportScientificReportMarkdown(project.id).then((md) => {
        setReportMarkdown(md);
      });

      // Ensure records and adjustments are loaded if not provided in props
      if (!propRecords || propRecords.length === 0) {
        dbService.getAuditRecords(project.id).then((recs) => {
          setInternalRecords(recs);
        });
      } else {
        setInternalRecords(propRecords);
      }

      if (!propAdjustments) {
        dbService.getAdjustments(project.id).then((adjs) => {
          setInternalAdjustments(adjs);
        });
      } else {
        setInternalAdjustments(propAdjustments);
      }
    }
  }, [isOpen, project.id, propRecords, propAdjustments]);

  if (!isOpen) return null;

  const validCount = internalRecords.filter((r) => r.evaluation === 'Sim').length;
  const errorCount = internalRecords.filter((r) => r.evaluation === 'Não').length;

  const handleDownloadMarkdown = () => {
    const blob = new Blob([reportMarkdown], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_auditoria_geojornalismo_${project.id}_${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    try {
      setIsExportingPdf(true);
      setPdfSuccessMessage(null);

      // Short delay for smooth UI feedback
      await new Promise((resolve) => setTimeout(resolve, 150));

      const filename = downloadAuditDossierPdf(
        project,
        internalRecords,
        internalAdjustments,
        {
          includeFullAuditTrail: true,
          includeAdjustments: true,
          includeMethodologyStatement: true
        }
      );

      setPdfSuccessMessage(`Laudo PDF gerado com sucesso: "${filename}"`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Erro ao gerar laudo PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PROVA DOCUMENTAL DA METODOLOGIA</span>
              <span>·</span>
              <span>LUNA (2026c)</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-700" />
              <span>Laudo e Trilha de Auditoria Científica</span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Pauta: <strong className="text-slate-800">{project.title}</strong> ({project.territoryDescription})
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Primary PDF Export Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              title="Gerar e baixar prova documental em PDF (jsPDF)"
            >
              {isExportingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span className="font-mono">Exportar Laudo PDF</span>
            </button>

            <button
              onClick={handleDownloadMarkdown}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-mono hover:bg-slate-800 transition-colors shadow-xs"
              title="Baixar em formato Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Baixar (.md)</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono hover:bg-slate-50 text-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado!' : 'Copiar'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 text-base font-mono px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Feedback message when PDF is generated */}
        {pdfSuccessMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {/* Tab switcher: Summary vs Raw Markdown */}
        <div className="flex border-b border-slate-200 mt-4 gap-2">
          <button
            onClick={() => setViewTab('summary')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              viewTab === 'summary'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Dossiê Sintético & Métricas
          </button>
          <button
            onClick={() => setViewTab('markdown')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              viewTab === 'markdown'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Conteúdo Bruto (.md)
          </button>
        </div>

        {/* Tab Content */}
        {viewTab === 'summary' ? (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Auditado</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {internalRecords.length} / 64
                </span>
                <span className="text-[10px] text-slate-500 block">atividades</span>
              </div>

              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-emerald-700 block">Validados ("Sim")</span>
                <span className="text-lg font-bold text-emerald-700 font-mono">
                  {validCount}
                </span>
                <span className="text-[10px] text-emerald-600 block">
                  {internalRecords.length > 0
                    ? `${Math.round((validCount / internalRecords.length) * 100)}% de conformidade`
                    : 'Sem registros'}
                </span>
              </div>

              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-rose-700 block">Paradas ("Não")</span>
                <span className="text-lg font-bold text-rose-700 font-mono">
                  {errorCount}
                </span>
                <span className="text-[10px] text-rose-600 block">rastros de erro (Luna)</span>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
                <span className="text-[10px] uppercase font-mono text-blue-700 block">Retificações</span>
                <span className="text-lg font-bold text-blue-700 font-mono">
                  {internalAdjustments.length}
                </span>
                <span className="text-[10px] text-blue-600 block">ajustes rastreados</span>
              </div>
            </div>

            {/* Project Parameters Card */}
            <div className="p-4 bg-slate-900 text-white rounded-lg space-y-2 font-mono text-xs">
              <div className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                Parâmetros Oficiais da Investigação
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                <div>
                  <span className="text-slate-400">Pauta: </span>
                  <span className="text-white font-medium">{project.title}</span>
                </div>
                <div>
                  <span className="text-slate-400">Responsável: </span>
                  <span className="text-white font-medium">{project.researcher} ({project.institution})</span>
                </div>
                <div>
                  <span className="text-slate-400">Território: </span>
                  <span className="text-emerald-300 font-medium">{project.territoryDescription}</span>
                </div>
                <div>
                  <span className="text-slate-400">Objeto: </span>
                  <span className="text-slate-200">{project.targetObject}</span>
                </div>
                <div>
                  <span className="text-slate-400">SRC Cálculo: </span>
                  <span className="text-amber-300 font-medium">{project.calculationCrs}</span>
                </div>
                <div>
                  <span className="text-slate-400">SRC Design Web: </span>
                  <span className="text-blue-300 font-medium">{project.outputCrs}</span>
                </div>
              </div>
            </div>

            {/* Explanation box on PDF archival value */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Valor Arquivístico do Laudo em PDF (jspdf):</strong>
                O documento PDF gerado contém a chancela metodológica completa, tabelas estruturadas de cada fase,
                todas as evidências técnicas, assinaturas criptográficas SHA-256 e termo de responsabilidade para
                publicação científica ou verificação editorial.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2">
            <pre className="text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">
              {reportMarkdown}
            </pre>
          </div>
        )}

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">
            Hash SHA-256 verificado em todas as etapas auditadas
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Baixar Prova em PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
