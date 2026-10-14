import React, { useState, useMemo } from 'react';
import { ProjectMetadata, AuditRecord } from '../types/workflow';
import {
  generatePublishedWebmapHtml,
  downloadPublishedWebmapHtml,
  getEmbedIframeSnippet
} from '../services/webmapPublicationService';
import {
  Download,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Globe,
  X,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Sparkles,
  FileCode,
  Layers,
  FileText
} from 'lucide-react';

interface PublishedWebmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata;
  records: AuditRecord[];
}

export const PublishedWebmapModal: React.FC<PublishedWebmapModalProps> = ({
  isOpen,
  onClose,
  project,
  records
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'embed'>('preview');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  // Generate full HTML content
  const htmlContent = useMemo(() => {
    return generatePublishedWebmapHtml(project, records);
  }, [project, records]);

  // Generate iframe embed snippet
  const embedSnippet = useMemo(() => {
    return getEmbedIframeSnippet(project);
  }, [project]);

  if (!isOpen) return null;

  const validatedCount = records.filter((r) => r.evaluation === 'Sim').length;

  const handleDownloadHtml = () => {
    const filename = downloadPublishedWebmapHtml(project, records);
    setDownloadSuccessMessage(`Arquivo HTML gerado e baixado: "${filename}"`);
    setTimeout(() => setDownloadSuccessMessage(null), 4500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(htmlContent);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const handleOpenInNewTab = () => {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-6xl w-full overflow-hidden my-4 flex flex-col h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-md">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Artefato Final da Fase 6 (Comunicar) · Pronto para Publicação
                </span>
                <span className="text-[10px] bg-slate-800 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">
                  HTML5 + Leaflet 1.9.4
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Mapa Narrativo Interativo Publicado em HTML
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow-sm"
              title="Baixar arquivo HTML autônomo completo"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Baixar HTML</span>
            </button>

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

        {/* Action and Tab Selector Toolbar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'preview'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Visualização ao Vivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('code')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'code'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Código HTML Completo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('embed')}
              className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'embed'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Código de Incorporação (Embed iFrame)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="px-2.5 py-1 text-slate-700 hover:text-slate-950 bg-white border border-slate-300 rounded text-xs font-medium flex items-center gap-1 shadow-2xs hover:bg-slate-100"
              title="Abrir página em aba cheia"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Nova Aba</span>
            </button>

            {activeTab === 'code' && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center gap-1 shadow-2xs"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copiado!' : 'Copiar HTML'}</span>
              </button>
            )}

            {activeTab === 'embed' && (
              <button
                type="button"
                onClick={handleCopyEmbed}
                className="px-3 py-1 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded text-xs font-medium flex items-center gap-1 shadow-2xs"
              >
                {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedEmbed ? 'Copiado!' : 'Copiar iFrame'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Success Alert Banner if download triggered */}
        {downloadSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-900 font-mono flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{downloadSuccessMessage}</span>
          </div>
        )}

        {/* Modal Main Body */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-100">
          {/* TAB 1: LIVE PREVIEW IFRAME */}
          {activeTab === 'preview' && (
            <div className="w-full h-full relative flex flex-col">
              <iframe
                title="Webmap Publicado Preview"
                srcDoc={htmlContent}
                className="w-full flex-1 border-0 bg-white"
              />
            </div>
          )}

          {/* TAB 2: FULL HTML CODE VIEW */}
          {activeTab === 'code' && (
            <div className="w-full h-full p-4 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-2 text-xs font-mono text-slate-500">
                <span>Arquivo HTML completo, autônomo e portátil ({Math.round(htmlContent.length / 1024)} KB)</span>
                <span>Padrão W3C HTML5 · CSS3 · Leaflet 1.9.4</span>
              </div>
              <div className="flex-1 bg-slate-900 text-slate-100 rounded-lg p-4 font-mono text-xs overflow-auto border border-slate-800 shadow-inner">
                <pre>{htmlContent}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: EMBED IFRAME SNIPPET */}
          {activeTab === 'embed' && (
            <div className="w-full h-full p-6 space-y-5 overflow-y-auto">
              <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
                <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600" />
                  Código de Incorporação para Portais e Noticiários
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Copie e cole o código abaixo no seu CMS (WordPress, Arc Publishing, Medium, Ghost ou portal de notícias) para incorporar o mapa narrativo interativo com os três níveis territoriais:
                </p>

                <div className="relative">
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-x-auto border border-slate-800">
                    {embedSnippet}
                  </pre>
                  <button
                    type="button"
                    onClick={handleCopyEmbed}
                    className="absolute top-2.5 right-2.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmbed ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Publication Specs Checklist */}
              <div className="max-w-2xl bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase text-slate-500">
                  Especificações de Entrega Editorial
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Responsável Técnico & Auditor:</span>
                    <strong className="text-slate-900 font-mono">Diógenes Luna · UFCA</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Projeção Cartográfica Web:</span>
                    <strong className="text-slate-900 font-mono">EPSG:3857 (Web Mercator)</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Cálculo Geodésico Auditado:</span>
                    <strong className="text-slate-900 font-mono">SIRGAS 2000 Brasil Albers</strong>
                  </div>

                  <div className="p-3 bg-slate-50 rounded border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">Atividades Validadas no Banco:</span>
                    <strong className="text-emerald-700 font-mono">{validatedCount} de 64 (100% Sim)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Status Footer (Standardized & Centered) */}
        <div className="bg-slate-900 text-white px-6 py-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Artefato em conformidade estrita com o protocolo de Luna (2026c).</span>
          </div>

          <div className="btn-group-center">
            <button
              type="button"
              onClick={handleDownloadHtml}
              className="btn-base btn-sm btn-success cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar HTML (.html)</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-sm bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
