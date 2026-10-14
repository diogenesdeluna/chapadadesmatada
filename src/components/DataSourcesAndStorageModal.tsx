import React, { useState, useEffect } from 'react';
import {
  Database,
  ExternalLink,
  Download,
  FolderOpen,
  FileCheck,
  Layers,
  Globe,
  HardDrive,
  ShieldCheck,
  X,
  Copy,
  Check,
  FileCode,
  Info,
  Server,
  Compass,
  Cpu,
  Search,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Filter,
  SlidersHorizontal,
  MapPin,
  Waves,
  Zap,
  Trees,
  Building
} from 'lucide-react';
import { ProjectMetadata, AuditRecord } from '../types/workflow';
import {
  downloadGeoJsonFile,
  downloadAuditRecordsGeoJsonFile,
  buildConsolidatedGeoJson,
  buildAuditRecordsGeoJson
} from '../services/spatialExportService';
import { downloadPublishedWebmapHtml } from '../services/webmapPublicationService';
import {
  PublicDataSourceSpec,
  ScraperResult,
  publicDataScraperService,
  OFFICIAL_PUBLIC_GEO_SOURCES
} from '../services/dataScraperService';
import {
  APA_ARARIPE_MUNICIPALITIES,
  CARIRI_RIVERS,
  CARIRI_WATER_BODIES,
  CONSERVATION_UNITS,
  ANEEL_CARIRI_PLANTS
} from '../data/caririSpatialData';

interface DataSourcesAndStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata;
  records: AuditRecord[];
}

export const DataSourcesAndStorageModal: React.FC<DataSourcesAndStorageModalProps> = ({
  isOpen,
  onClose,
  project,
  records
}) => {
  const [activeTab, setActiveTab] = useState<'sources' | 'apa_municipios' | 'rios_aguas' | 'storage' | 'artifacts' | 'scraper'>('sources');
  const [sourcesList, setSourcesList] = useState<PublicDataSourceSpec[]>([]);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [scrapingSourceId, setScrapingSourceId] = useState<string | null>(null);
  const [scraperResults, setScraperResults] = useState<Record<string, ScraperResult>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [apaStateFilter, setApaStateFilter] = useState<'ALL' | 'CE' | 'PE' | 'PI'>('ALL');

  // Source Editor Form Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<PublicDataSourceSpec | null>(null);
  const [formData, setFormData] = useState<Partial<PublicDataSourceSpec>>({
    name: '',
    authority: '',
    portalUrl: '',
    directDownloadUrl: '',
    apiEndpoint: '',
    availableFormats: ['Shapefile (.shp)', 'GeoJSON'],
    publicLicense: 'Dados Abertos Governamentais (Acesso Público)',
    nativeFormat: 'Shapefile (.shp)',
    nativeCrs: 'EPSG:4674 (SIRGAS 2000 Geográficas)',
    targetCalculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
    targetWebCrs: 'EPSG:3857 (Web Mercator)',
    description: '',
    category: 'customizada',
    suggestedLayerRole: 'Camada Temática',
    sampleFeatureCount: 1,
    notes: ''
  });

  // Load sources from service (including saved custom sources)
  useEffect(() => {
    if (isOpen) {
      setSourcesList(publicDataScraperService.getAllSources());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter sources
  const filteredSources = sourcesList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.authority.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.notes && s.notes.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'api') return Boolean(s.apiEndpoint);
    if (selectedCategory === 'hidrografia') return s.category === 'hidrografia';
    if (selectedCategory === 'regional') return s.category === 'regional';
    if (selectedCategory === 'energia') return s.category === 'energia';
    if (selectedCategory === 'custom') return Boolean(s.isCustom);
    return s.category === selectedCategory;
  });

  const handleOpenAddSource = () => {
    setEditingSource(null);
    setFormData({
      id: `custom_${Date.now()}`,
      name: '',
      authority: '',
      portalUrl: '',
      directDownloadUrl: '',
      apiEndpoint: '',
      availableFormats: ['Shapefile (.shp)', 'GeoJSON'],
      publicLicense: 'Dados Abertos Governamentais (Acesso Público)',
      nativeFormat: 'Shapefile (.shp)',
      nativeCrs: 'EPSG:4674 (SIRGAS 2000 Geográficas)',
      targetCalculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
      targetWebCrs: 'EPSG:3857 (Web Mercator)',
      description: '',
      category: 'customizada',
      suggestedLayerRole: 'Camada Temática',
      sampleFeatureCount: 1,
      notes: ''
    });
    setIsEditorOpen(true);
  };

  const handleOpenEditSource = (source: PublicDataSourceSpec) => {
    setEditingSource(source);
    setFormData({ ...source });
    setIsEditorOpen(true);
  };

  const handleSaveSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.portalUrl) return;

    const sourceToSave: PublicDataSourceSpec = {
      id: formData.id || `custom_${Date.now()}`,
      name: formData.name,
      authority: formData.authority || 'Autoridade Pública / Não informada',
      portalUrl: formData.portalUrl,
      directDownloadUrl: formData.directDownloadUrl || formData.portalUrl,
      apiEndpoint: formData.apiEndpoint || undefined,
      availableFormats: formData.availableFormats || ['Shapefile (.shp)'],
      publicLicense: formData.publicLicense || 'Dados Abertos Governamentais',
      nativeFormat: formData.nativeFormat || 'Shapefile (.shp)',
      nativeCrs: formData.nativeCrs || 'EPSG:4674 (SIRGAS 2000 Geográficas)',
      targetCalculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
      targetWebCrs: 'EPSG:3857 (Web Mercator)',
      description: formData.description || '',
      category: formData.category || 'customizada',
      suggestedLayerRole: formData.suggestedLayerRole || 'Camada Temática',
      sampleFeatureCount: formData.sampleFeatureCount || 1,
      isCustom: true,
      notes: formData.notes
    };

    publicDataScraperService.saveSource(sourceToSave);
    setSourcesList(publicDataScraperService.getAllSources());
    setIsEditorOpen(false);
  };

  const handleDeleteSource = (sourceId: string) => {
    if (confirm('Tem certeza de que deseja remover esta fonte da lista?')) {
      publicDataScraperService.deleteSource(sourceId);
      setSourcesList(publicDataScraperService.getAllSources());
    }
  };

  const handleResetSources = () => {
    if (confirm('Restaurar todas as fontes oficiais originais do protocolo? Suas alterações salvas serão redefinidas.')) {
      const reset = publicDataScraperService.resetToDefaults();
      setSourcesList(reset);
    }
  };

  const handleRunScraper = async (source: PublicDataSourceSpec) => {
    setScrapingSourceId(source.id);
    try {
      const res = await publicDataScraperService.scrapePublicSource(source);
      setScraperResults((prev) => ({ ...prev, [source.id]: res }));
    } catch (err) {
      console.error('Erro ao consultar API da fonte:', err);
    } finally {
      setScrapingSourceId(null);
    }
  };

  const handleDownloadPublicLayer = (
    source: PublicDataSourceSpec,
    mode: 'raw_epsg4674' | 'calculation_epsg10857' = 'calculation_epsg10857'
  ) => {
    publicDataScraperService.downloadPublicLayerSample(source, project.title || undefined, mode);
  };

  const handleCopyLink = (url: string, label: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleDownloadLayers = () => {
    const geo = buildConsolidatedGeoJson(records, project);
    downloadGeoJsonFile(geo, `mapeia_camadas_validadas_${project.id}_${Date.now()}.geojson`);
  };

  const handleDownloadAuditTrail = () => {
    downloadAuditRecordsGeoJsonFile(records, project);
  };

  const handleDownloadWebmap = () => {
    downloadPublishedWebmapHtml(project, records);
  };

  const handleExportDatabaseDump = () => {
    const dump = {
      plataforma: 'MapeIA - Plataforma de produção de mapas jornalísticos interativos',
      project,
      recordsCount: records.length,
      exportedAt: new Date().toISOString(),
      standards: 'Protocolo Metodológico Luna (2026c)',
      records
    };
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_banco_auditoria_indexeddb_${project.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter APA Municipalities by state
  const filteredApaMunicipalities = APA_ARARIPE_MUNICIPALITIES.filter((m) => {
    if (apaStateFilter === 'ALL') return true;
    return m.uf === apaStateFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-[#d4c5b9] max-w-6xl w-full overflow-hidden my-4 flex flex-col h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Top Header - Visual Identity: Terra / Ocre / Rubro / Branco / Preto */}
        <div className="bg-[#7b3819] text-white px-6 py-4 flex items-center justify-between border-b border-[#58240f] shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#c07d19] flex items-center justify-center shrink-0 shadow-md border border-[#8c570a]">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#fbf5e7] font-semibold uppercase tracking-wider">
                  MapeIA · Painel de Fontes & APIs Oficiais do Jornalista
                </span>
                <span className="text-[10px] bg-[#58240f] text-[#fbf5e7] border border-[#8c570a] px-2 py-0.5 rounded font-mono">
                  Edição & Consulta Livre
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Fontes Públicas, APIs Governamentais & Bases Cartográficas do Cariri
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenAddSource}
              className="hidden sm:flex btn-base btn-sm btn-ocre text-white shadow-xs cursor-pointer"
              title="Cadastrar uma nova fonte ou API para a apuração jornalística"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Fonte / API</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-[#58240f] transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher - Styled in Ocre, Terra, Branco, Preto */}
        <div className="bg-[#fbf5e7] border-b border-[#ecd8b3] px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('sources')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'sources'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>1. Catálogo & Edição de Fontes ({sourcesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('apa_municipios')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'apa_municipios'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>2. 27 Municípios APA Araripe (CE, PE, PI)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rios_aguas')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'rios_aguas'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>3. Rios & Águas do Cariri (ANA / COGERH)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scraper')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'scraper'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>4. Consulta de APIs (IBGE, ANA, ANEEL, MapBiomas)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('artifacts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'artifacts'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>5. Baixar Camadas QGIS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'storage'
                  ? 'bg-[#7b3819] text-white shadow-xs'
                  : 'text-[#58240f] hover:text-[#141210] hover:bg-[#f4eee3]'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5 text-[#c07d19]" />
              <span>6. Onde os Dados Estão Salvos</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetSources}
            className="text-[11px] text-[#731313] hover:text-[#9e1f1f] font-mono hover:underline shrink-0"
            title="Restaura a lista original de fontes oficiais governamentais"
          >
            Restaurar Padrões
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-[#faf7f2]">
          
          {/* TAB 1: DATA SOURCES CATALOG & JOURNALIST EDITING */}
          {activeTab === 'sources' && (
            <div className="space-y-4">
              {/* Guidance Banner */}
              <div className="bg-[#f6ede7] border border-[#e8d0c2] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#7b3819] shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-[#58240f] text-xs">
                      Painel Editável pelo Jornalista · Transparência & Autonomia Editorial
                    </h4>
                    <p className="text-[#7b3819] text-[11px] leading-relaxed">
                      O repórter define e audita as fontes oficiais. Você pode adicionar novas bases, editar endpoints de APIs governamentais (IBGE, ANA, ANEEL, MapBiomas, MMA) e baixar as camadas originais em Shapefile (EPSG:4674) ou para cálculo de área em Albers (EPSG:10857).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddSource}
                  className="btn-base btn-sm btn-primary shrink-0 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Fonte / API</span>
                </button>
              </div>

              {/* Search and Category Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#e8d0c2] shadow-2xs">
                <div className="relative w-full sm:w-80">
                  <Search className="w-3.5 h-3.5 text-[#8c570a] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por nome, autoridade ou descrição..."
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210] focus:ring-1 focus:ring-[#7b3819] focus:border-[#7b3819]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <span className="text-[11px] font-mono text-[#7b3819] font-medium mr-1">Filtrar:</span>
                  {[
                    { id: 'all', label: 'Todas' },
                    { id: 'api', label: 'Com API' },
                    { id: 'hidrografia', label: 'Rios & Águas' },
                    { id: 'regional', label: 'UCs & APA' },
                    { id: 'energia', label: 'Energia / ANEEL' },
                    { id: 'custom', label: 'Editadas' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedCategory === cat.id
                          ? 'bg-[#7b3819] text-white'
                          : 'bg-[#f6ede7] text-[#7b3819] hover:bg-[#e8d0c2]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sources Cards Grid */}
              <div className="grid grid-cols-1 gap-4">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    className="bg-white border border-[#e8d0c2] rounded-lg p-4.5 shadow-2xs hover:border-[#7b3819] transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[#f6ede7] pb-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                          <span className="font-bold text-[#7b3819] bg-[#f6ede7] px-2 py-0.5 rounded border border-[#e8d0c2]">
                            {source.suggestedLayerRole}
                          </span>
                          <span className="text-[#8c570a] font-semibold bg-[#fbf5e7] px-2 py-0.5 rounded border border-[#ecd8b3]">
                            Nativo: {source.nativeFormat} ({source.nativeCrs})
                          </span>
                          {source.apiEndpoint && (
                            <span className="text-[#9e1f1f] font-bold bg-[#fdf2f2] px-2 py-0.5 rounded border border-[#f4c6c6] flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              <span>API CONECTADA</span>
                            </span>
                          )}
                          {source.isCustom && (
                            <span className="text-white font-bold bg-[#c07d19] px-2 py-0.5 rounded">
                              EDITADA PELO JORNALISTA
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[#141210]">
                          {source.name}
                        </h3>
                        <p className="text-[11px] text-[#7b3819] font-medium">
                          {source.authority}
                        </p>
                      </div>

                      {/* Top Action Buttons for this source */}
                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditSource(source)}
                          className="px-2.5 py-1 text-[11px] font-mono text-[#58240f] hover:text-[#141210] bg-[#f6ede7] hover:bg-[#e8d0c2] rounded border border-[#e8d0c2] flex items-center gap-1 transition-colors cursor-pointer"
                          title="Editar metadados ou endpoint desta fonte"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Editar</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(source.portalUrl, source.name)}
                          className="px-2.5 py-1 text-[11px] font-mono text-[#141210] bg-white hover:bg-[#faf7f2] rounded border border-[#d4c5b9] flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {copiedLink === source.name ? (
                            <>
                              <Check className="w-3 h-3 text-[#c07d19]" />
                              <span className="text-[#c07d19] font-semibold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Link</span>
                            </>
                          )}
                        </button>

                        <a
                          href={source.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#141210] hover:bg-[#24201c] text-white rounded text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>Portal Oficial</span>
                          <ExternalLink className="w-3 h-3 text-[#c07d19]" />
                        </a>

                        {source.isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSource(source.id)}
                            className="p-1 text-[#9e1f1f] hover:bg-[#fdf2f2] rounded transition-colors cursor-pointer"
                            title="Remover fonte customizada"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-[#24201c] leading-relaxed bg-[#faf7f2] p-2.5 rounded border border-[#e8d0c2]">
                      {source.description}
                    </p>

                    {source.notes && (
                      <div className="p-2 bg-[#fbf5e7] border border-[#ecd8b3] rounded text-[11px] text-[#8c570a]">
                        <strong>Nota do Repórter:</strong> {source.notes}
                      </div>
                    )}

                    {/* API and Download Operations Box */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="text-[11px] font-mono text-[#58240f] truncate max-w-md">
                        {source.apiEndpoint ? (
                          <span className="flex items-center gap-1">
                            <span className="font-bold text-[#9e1f1f]">Endpoint API:</span>
                            <code className="text-[10px] text-[#141210] truncate">{source.apiEndpoint}</code>
                          </span>
                        ) : (
                          <span>Download vetorial oficial em Shapefile (EPSG:4674)</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRunScraper(source)}
                          disabled={scrapingSourceId === source.id}
                          className="btn-base btn-sm btn-secondary cursor-pointer"
                          title="Executa consulta em tempo real à API oficial do órgão governamental"
                        >
                          {scrapingSourceId === source.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#c07d19]" />
                              <span>Consultando...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-[#c07d19]" />
                              <span>Consultar API Oficial</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPublicLayer(source, 'raw_epsg4674')}
                          className="btn-base btn-sm btn-secondary cursor-pointer"
                          title="Baixar camada bruta correspondente ao Shapefile em SIRGAS 2000 (EPSG:4674)"
                        >
                          <Download className="w-3.5 h-3.5 text-[#7b3819]" />
                          <span>Baixar Bruto (EPSG:4674)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPublicLayer(source, 'calculation_epsg10857')}
                          className="btn-base btn-sm btn-primary cursor-pointer shadow-xs"
                          title="Baixar camada reprojetada para SIRGAS 2000 Albers (EPSG:10857) para cálculo métrico no QGIS"
                        >
                          <Download className="w-3.5 h-3.5 text-[#fbf5e7]" />
                          <span>Baixar p/ QGIS (Albers EPSG:10857)</span>
                        </button>
                      </div>
                    </div>

                    {/* Scraper / API Response Output */}
                    {scraperResults[source.id] && (
                      <div className="p-3 bg-[#fbf5e7] border border-[#ecd8b3] rounded-lg space-y-1.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="flex items-center gap-1.5 font-bold text-[#8c570a]">
                            <CheckCircle2 className="w-4 h-4 text-[#c07d19]" />
                            <span>Consulta à API Concluída — Status HTTP {scraperResults[source.id].httpStatus}</span>
                          </span>
                          <span className="text-[#7b3819] font-bold">{scraperResults[source.id].fileSizeBytes}</span>
                        </div>
                        <div className="text-[11px] font-mono text-[#58240f] space-y-0.5">
                          <div><strong>Hash de Integridade SHA-256:</strong> <code>{scraperResults[source.id].checksumSha256}</code></div>
                          <div><strong>CRS de Cálculo Auditado:</strong> <code className="font-bold text-[#7b3819]">{scraperResults[source.id].calculationCrs}</code></div>
                          <div className="text-[10px] text-[#8c570a] mt-1">{scraperResults[source.id].summary}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: 27 MUNICÍPIOS DA APA CHAPADA DO ARARIPE (CE, PE, PI) */}
          {activeTab === 'apa_municipios' && (
            <div className="space-y-4">
              <div className="bg-[#f6ede7] border border-[#e8d0c2] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#58240f] text-xs">
                    Polígonos dos 27 Municípios com Território Total ou Parcial na APA Chapada do Araripe
                  </h4>
                  <p className="text-[#7b3819] text-[11px] mt-0.5 leading-relaxed">
                    A Área de Proteção Ambiental Chapada do Araripe (Decreto s/nº de 04/08/1997) abrange 1.063.000 hectares distribuídos nos estados do <strong>Ceará (12 municípios)</strong>, <strong>Pernambuco (9 municípios)</strong> e <strong>Piauí (6 municípios)</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const source = sourcesList.find((s) => s.id === 'icmbio_apa_araripe_municipios') || OFFICIAL_PUBLIC_GEO_SOURCES[2];
                      handleDownloadPublicLayer(source, 'calculation_epsg10857');
                    }}
                    className="btn-base btn-sm btn-primary shadow-xs cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#fbf5e7]" />
                    <span>Baixar 27 Polígonos (.geojson)</span>
                  </button>
                </div>
              </div>

              {/* State Filter Buttons */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-[#58240f] font-semibold">Filtrar por Estado:</span>
                {[
                  { id: 'ALL', label: `Todos os Estados (${APA_ARARIPE_MUNICIPALITIES.length})` },
                  { id: 'CE', label: 'Ceará (12)' },
                  { id: 'PE', label: 'Pernambuco (9)' },
                  { id: 'PI', label: 'Piauí (6)' }
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setApaStateFilter(st.id as any)}
                    className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                      apaStateFilter === st.id
                        ? 'bg-[#7b3819] text-white shadow-xs'
                        : 'bg-white text-[#58240f] border border-[#d4c5b9] hover:bg-[#faf7f2]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              {/* Table of Municipalities */}
              <div className="bg-white border border-[#e8d0c2] rounded-lg overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#fbf5e7] border-b border-[#ecd8b3] text-[#58240f] font-mono text-[11px]">
                        <th className="p-3">Município</th>
                        <th className="p-3">UF</th>
                        <th className="p-3">Código IBGE</th>
                        <th className="p-3">Área Total (km²)</th>
                        <th className="p-3">Área na APA (km²)</th>
                        <th className="p-3">% na APA</th>
                        <th className="p-3">Condição Territorial</th>
                        <th className="p-3">Bacia Hidrográfica</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f6ede7]">
                      {filteredApaMunicipalities.map((mun) => (
                        <tr key={mun.id} className="hover:bg-[#faf7f2] transition-colors">
                          <td className="p-3 font-bold text-[#141210]">
                            {mun.name}
                          </td>
                          <td className="p-3 font-mono font-bold text-[#7b3819]">
                            {mun.uf}
                          </td>
                          <td className="p-3 font-mono text-[#58240f]">
                            {mun.ibgeCode}
                          </td>
                          <td className="p-3 font-mono text-[#141210]">
                            {mun.areaTotalKm2.toFixed(1)} km²
                          </td>
                          <td className="p-3 font-mono font-semibold text-[#8c570a]">
                            {mun.areaNaApaKm2.toFixed(1)} km²
                          </td>
                          <td className="p-3 font-mono font-bold text-[#7b3819]">
                            {mun.percentualNaApa}%
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                mun.statusTerritorial === 'Totalmente na APA'
                                  ? 'bg-[#c07d19] text-white'
                                  : 'bg-[#f6ede7] text-[#7b3819] border border-[#e8d0c2]'
                              }`}
                            >
                              {mun.statusTerritorial}
                            </span>
                          </td>
                          <td className="p-3 text-[11px] text-[#58240f]">
                            {mun.baciaHidrografica}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RIOS DO CARIRI E ÁGUAS NO CARIRI (ANA / COGERH / CPRM) */}
          {activeTab === 'rios_aguas' && (
            <div className="space-y-5">
              <div className="bg-[#fbf5e7] border border-[#ecd8b3] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-[#8c570a] text-xs flex items-center gap-2">
                    <Waves className="w-4 h-4 text-[#c07d19]" />
                    <span>Rede de Rios e Recursos Hídricos do Cariri e Chapada do Araripe</span>
                  </h4>
                  <p className="text-[#58240f] text-[11px] mt-0.5 leading-relaxed">
                    Eixos de drenagem fluvial da <strong>Bacia do Rio Salgado</strong> e emergências hidrogeológicas de encosta da Chapada (Formação Exu / Aquífero Missão Velha).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const source = sourcesList.find((s) => s.id === 'ana_rios_cariri') || OFFICIAL_PUBLIC_GEO_SOURCES[3];
                      handleDownloadPublicLayer(source, 'calculation_epsg10857');
                    }}
                    className="btn-base btn-sm btn-primary cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-[#fbf5e7]" />
                    <span>Baixar Rios do Cariri (.geojson)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const source = sourcesList.find((s) => s.id === 'ana_aguas_cariri') || OFFICIAL_PUBLIC_GEO_SOURCES[4];
                      handleDownloadPublicLayer(source, 'calculation_epsg10857');
                    }}
                    className="btn-base btn-sm btn-ocre text-white cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Águas & Nascentes (.geojson)</span>
                  </button>
                </div>
              </div>

              {/* Rios do Cariri Grid */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-[#141210] flex items-center gap-2">
                  <span>1. Eixos Fluviais do Cariri (ANA / COGERH)</span>
                  <span className="text-[10px] font-mono text-[#7b3819] bg-[#f6ede7] px-2 py-0.5 rounded border border-[#e8d0c2]">
                    {CARIRI_RIVERS.length} rios mapeados
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {CARIRI_RIVERS.map((river) => (
                    <div key={river.id} className="bg-white border border-[#e8d0c2] rounded-lg p-3.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#f6ede7] pb-1.5">
                        <strong className="text-[#141210] text-xs">{river.name}</strong>
                        <span className="font-mono text-[10px] font-bold text-[#7b3819] bg-[#f6ede7] px-2 py-0.5 rounded">
                          {river.tipo}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#24201c] leading-relaxed">
                        {river.descricao}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#58240f] pt-1 border-t border-[#f6ede7]">
                        <span>Extensão Aprox: <strong>{river.extensaoKmAprox} km</strong></span>
                        <span>{river.orgaoFonte}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Águas, Nascentes e Açudes do Cariri Grid */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-[#141210] flex items-center gap-2">
                  <span>2. Águas do Cariri: Nascentes, Balneários & Açudes</span>
                  <span className="text-[10px] font-mono text-[#8c570a] bg-[#fbf5e7] px-2 py-0.5 rounded border border-[#ecd8b3]">
                    {CARIRI_WATER_BODIES.length} feições hídricas
                  </span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {CARIRI_WATER_BODIES.map((body) => (
                    <div key={body.id} className="bg-white border border-[#e8d0c2] rounded-lg p-3.5 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#f6ede7] pb-1.5">
                        <strong className="text-[#141210] text-xs">{body.name}</strong>
                        <span className="font-mono text-[10px] font-bold text-[#8c570a] bg-[#fbf5e7] px-1.5 py-0.5 rounded">
                          {body.tipo}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#24201c] leading-relaxed">
                        {body.descricao}
                      </p>
                      <div className="text-[10px] font-mono text-[#7b3819] space-y-0.5 pt-1 border-t border-[#f6ede7]">
                        <div><strong>Localização:</strong> {body.municipio} - {body.uf}</div>
                        <div><strong>Vazão/Capacidade:</strong> {body.capacidadeOuVazao}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Unidades de Conservação do MMA */}
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-sm text-[#141210] flex items-center gap-2">
                  <Trees className="w-4 h-4 text-[#7b3819]" />
                  <span>3. Unidades de Conservação do MMA / ICMBio no Cariri</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {CONSERVATION_UNITS.map((uc) => (
                    <div key={uc.id} className="bg-white border border-[#e8d0c2] rounded-lg p-4 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between border-b border-[#f6ede7] pb-2">
                        <div>
                          <h4 className="text-xs font-bold text-[#141210]">{uc.name}</h4>
                          <span className="text-[10px] font-mono text-[#8c570a]">{uc.esfera} · {uc.categoria}</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#7b3819]">
                          {uc.areaTotalHa.toLocaleString('pt-BR')} ha
                        </span>
                      </div>
                      <div className="text-[11px] text-[#58240f] space-y-1">
                        <div><strong>Ato Legal:</strong> {uc.decretoCriacao}</div>
                        <div><strong>Órgão Gestor:</strong> {uc.orgaoGestor}</div>
                        <div><strong>Municípios:</strong> {uc.municipiosSede.join(', ')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: API SCRAPER / LIVE QUERY TEST */}
          {activeTab === 'scraper' && (
            <div className="space-y-4">
              <div className="bg-[#f6ede7] border border-[#e8d0c2] rounded-lg p-4 flex items-start gap-3">
                <Search className="w-5 h-5 text-[#7b3819] shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[#58240f] text-xs">
                    Consulta Direta às APIs Oficiais Governamentais (MapBiomas, IBGE, ANEEL, ANA)
                  </h4>
                  <div className="text-[#7b3819] text-[11px] leading-relaxed space-y-1">
                    <p>
                      <strong>1. Download Bruto:</strong> As bases governamentais utilizam nativamente o formato <strong>Shapefile (.shp)</strong> sob o sistema geográfico <strong>SIRGAS 2000 (EPSG:4674)</strong>.
                    </p>
                    <p>
                      <strong>2. Reprojeção para Albers:</strong> Para assegurar tolerância zero a distorções métricas em hectares, todas as operações de cálculo de área <strong>DEVEM ser executadas em SIRGAS 2000 Brasil Albers (EPSG:10857)</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct API Quick Query Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {sourcesList
                  .filter((s) => s.apiEndpoint)
                  .map((apiSource) => (
                    <div
                      key={apiSource.id}
                      className="bg-white border border-[#e8d0c2] rounded-lg p-3.5 space-y-2 flex flex-col justify-between shadow-2xs hover:border-[#7b3819] transition-all"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-[#c07d19] font-bold uppercase">
                          {apiSource.suggestedLayerRole}
                        </span>
                        <h4 className="text-xs font-bold text-[#141210] mt-0.5 line-clamp-2">
                          {apiSource.name}
                        </h4>
                        <p className="text-[10px] text-[#58240f] mt-1 line-clamp-2 font-mono">
                          {apiSource.authority}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#f6ede7] space-y-1.5">
                        <button
                          type="button"
                          onClick={() => handleRunScraper(apiSource)}
                          disabled={scrapingSourceId === apiSource.id}
                          className="w-full btn-base btn-sm btn-primary cursor-pointer shadow-xs text-xs"
                        >
                          {scrapingSourceId === apiSource.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Consultando API...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 text-[#fbf5e7]" />
                              <span>Testar Conexão</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadPublicLayer(apiSource, 'calculation_epsg10857')}
                          className="w-full btn-base btn-sm btn-secondary cursor-pointer text-xs"
                        >
                          <Download className="w-3 h-3 text-[#7b3819]" />
                          <span>Baixar Camada (Albers)</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: ARTIFACTS DOWNLOAD & GIS INSTRUCTIONS */}
          {activeTab === 'artifacts' && (
            <div className="space-y-4">
              <div className="bg-[#fbf5e7] border border-[#ecd8b3] rounded-lg p-4 flex items-start gap-3">
                <Compass className="w-5 h-5 text-[#8c570a] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-[#8c570a] text-xs">
                    Exportação para Auditoria Independente no QGIS 3.34 LTR
                  </h4>
                  <p className="text-[#58240f] text-[11px] leading-relaxed">
                    Baixe os arquivos vetoriais para abrir no QGIS. As camadas exportadas contêm polígonos RFC 7946 com cálculo de hectares em Albers e metadados de custódia científica.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white border border-[#e8d0c2] rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#c07d19] font-bold uppercase">
                      Padrão OGC RFC 7946
                    </span>
                    <h4 className="text-sm font-bold text-[#141210] mt-0.5">
                      Camadas Cartográficas Vetoriais
                    </h4>
                    <p className="text-[#58240f] text-[11px] mt-1 leading-relaxed">
                      Polígonos da APA Chapada do Araripe, malha municipal do Cariri, rios, alertas e buffers de amortecimento.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadLayers}
                    className="w-full btn-base btn-md btn-primary cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 text-[#fbf5e7]" />
                    <span>Baixar Camadas Vetoriais (.geojson)</span>
                  </button>
                </div>

                <div className="bg-white border border-[#e8d0c2] rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#7b3819] font-bold uppercase">
                      Tabela de Atributos Factual
                    </span>
                    <h4 className="text-sm font-bold text-[#141210] mt-0.5">
                      Trilha de Auditoria Metodológica SIG
                    </h4>
                    <p className="text-[#58240f] text-[11px] mt-1 leading-relaxed">
                      Todos os 64 checkpoints metodológicos gravados com perguntas, evidências, auditor e hashes SHA-256.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadAuditTrail}
                    className="w-full btn-base btn-md btn-ocre text-white cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Trilha SIG (.geojson)</span>
                  </button>
                </div>

                <div className="bg-white border border-[#e8d0c2] rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#8c570a] font-bold uppercase">
                      Artefato Autônomo da Fase 6
                    </span>
                    <h4 className="text-sm font-bold text-[#141210] mt-0.5">
                      Webmap Publicado em HTML Completo
                    </h4>
                    <p className="text-[#58240f] text-[11px] mt-1 leading-relaxed">
                      Arquivo HTML autônomo com Leaflet 1.9.4, Google Satélite e narrativa em 3 níveis. Funciona offline.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadWebmap}
                    className="w-full btn-base btn-md btn-secondary cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4 text-[#7b3819]" />
                    <span>Baixar Webmap em HTML (.html)</span>
                  </button>
                </div>

                <div className="bg-white border border-[#e8d0c2] rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#9e1f1f] font-bold uppercase">
                      Backup Completo de Auditoria
                    </span>
                    <h4 className="text-sm font-bold text-[#141210] mt-0.5">
                      Cópia de Segurança do Banco (IndexedDB Dump)
                    </h4>
                    <p className="text-[#58240f] text-[11px] mt-1 leading-relaxed">
                      Exporta todo o estado do banco de dados local com registros, eventos e retificações em formato JSON.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportDatabaseDump}
                    className="w-full btn-base btn-md btn-danger cursor-pointer shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar Dump do Banco (.json)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WHERE DATA IS STORED */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#e8d0c2] rounded-lg p-5 shadow-2xs space-y-3">
                <h4 className="font-bold text-[#58240f] text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#7b3819]" />
                  <span>Locais de Armazenamento e Cadeia de Custódia</span>
                </h4>
                <div className="space-y-2 text-[11px] text-[#24201c] leading-relaxed">
                  <p>
                    <strong>1. Disco Local (Downloads):</strong> Diretório <code>~/Downloads</code> ou <code>C:\Users\...\Downloads</code> ao exportar feições GeoJSON e HTML do Webmap.
                  </p>
                  <p>
                    <strong>2. Banco IndexedDB do Navegador:</strong> Banco <code>GeoJournalismAuditDB_v2</code> persistido no navegador com gravação de hashes SHA-256 e fontes personalizadas do jornalista.
                  </p>
                  <p>
                    <strong>3. Servidor Local e APIs:</strong> Rotas <code>/api/webmap/published</code> e ponte MCP do QGIS no ambiente de desenvolvimento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer - Visual Identity: Terra / Ocre / Rubro / Branco / Preto */}
        <div className="bg-white border-t border-[#e8d0c2] px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[#58240f] shrink-0">
          <span>MapeIA · Universidade Federal do Cariri (UFCA)</span>
          <div className="btn-group-center">
            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-md btn-primary"
            >
              Fechar Painel de Fontes
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT SOURCE BY JOURNALIST */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#7b3819] max-w-xl w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between border-b border-[#e8d0c2] pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#7b3819]" />
                <h3 className="font-bold text-sm text-[#141210]">
                  {editingSource ? 'Editar Fonte Oficial' : 'Cadastrar Nova Fonte / API Governamental'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="text-[#58240f] hover:text-[#141210] p-1 rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSource} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#141210] mb-1">
                  Nome da Fonte ou Camada *:
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: ANA - Rios do Cariri / IBGE Cidades..."
                  className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210] focus:ring-1 focus:ring-[#7b3819]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#141210] mb-1">
                    Autoridade / Órgão Emissor:
                  </label>
                  <input
                    type="text"
                    value={formData.authority || ''}
                    onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                    placeholder="Ex: IBGE, ANA, ICMBio, ANEEL, MapBiomas..."
                    className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#141210] mb-1">
                    Categoria:
                  </label>
                  <select
                    value={formData.category || 'customizada'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210]"
                  >
                    <option value="regional">Camada Regional (Nível 1)</option>
                    <option value="local">Camada Local (Nível 2)</option>
                    <option value="detalhe">Camada de Detalhe (Nível 3)</option>
                    <option value="hidrografia">Hidrografia & Águas</option>
                    <option value="energia">Energia & Infraestrutura</option>
                    <option value="tematica">Camada Temática</option>
                    <option value="customizada">Fonte Customizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#141210] mb-1">
                  URL do Portal Oficial *:
                </label>
                <input
                  type="url"
                  required
                  value={formData.portalUrl || ''}
                  onChange={(e) => setFormData({ ...formData, portalUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#141210] mb-1">
                  Endpoint da API Governamental (Opcional - REST / OGC WFS / WMS):
                </label>
                <input
                  type="text"
                  value={formData.apiEndpoint || ''}
                  onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                  placeholder="https://geoserver... / https://servicodados.ibge.gov.br..."
                  className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded font-mono text-[11px] text-[#141210]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#141210] mb-1">
                  Descrição & Justificativa Metodológica:
                </label>
                <textarea
                  rows={2}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Explique a utilidade jornalística e precisão desta base..."
                  className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#141210] mb-1">
                  Notas de Apuração do Repórter:
                </label>
                <input
                  type="text"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações para a redação ou verificação no QGIS..."
                  className="w-full p-2 bg-[#faf7f2] border border-[#d4c5b9] rounded text-[#141210]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e8d0c2]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="btn-base btn-sm btn-secondary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-base btn-sm btn-primary cursor-pointer shadow-xs"
                >
                  Salvar Fonte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
