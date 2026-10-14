import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  MapPin,
  Layers,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Info,
  Database,
  Globe,
  GitCompare,
  FileCheck,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
  Compass,
  Sliders,
  Eye,
  EyeOff
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AuditRecord, ProjectMetadata, DatabaseAdjustment } from '../types/workflow';
import {
  SPATIAL_ACTIVITIES_MAP,
  isSpatialActivityRecord,
  buildConsolidatedGeoJson,
  buildGeoJsonForSingleRecord,
  buildAuditRecordsGeoJson,
  downloadGeoJsonFile,
  downloadAuditRecordsGeoJsonFile,
  getSpatialAuditStats,
  getRepresentativeCoordinatesForRecord,
  APA_ARARIPE_POLYGON_COORDS,
  MUNICIPIO_CRATO_COORDS,
  MUNICIPIO_BARBALHA_COORDS,
  MUNICIPIO_SANTANA_CARIRI_COORDS,
  ALERTA_809_COORDS,
  ALERTA_114_COORDS,
  ALERTA_162_COORDS,
  ALERTA_205_COORDS,
  BUFFER_10KM_COORDS
} from '../services/spatialExportService';

export const EXPORT_BASEMAP_OPTIONS = [
  {
    id: 'google_hybrid',
    name: 'Google Satellite (Híbrido)',
    shortLabel: 'Google Satélite',
    icon: '🛰️',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps / Google Earth',
    maxZoom: 20
  },
  {
    id: 'google_satellite',
    name: 'Google Satellite (Puro)',
    shortLabel: 'Satélite Puro',
    icon: '🌍',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps / Google Earth',
    maxZoom: 20
  },
  {
    id: 'google_streets',
    name: 'Google Maps (Ruas)',
    shortLabel: 'Google Ruas',
    icon: '🗺️',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20
  },
  {
    id: 'dark_mode',
    name: 'Modo Noturno (Dark)',
    shortLabel: 'Dark Mode',
    icon: '🌙',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, OpenStreetMap',
    maxZoom: 16
  },
  {
    id: 'osm',
    name: 'OpenStreetMap',
    shortLabel: 'OSM',
    icon: '🌐',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  }
];

function ringsToLeaflet(rings: number[][][]): [number, number][][] {
  return rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

function ExportMapController() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);
  return null;
}

interface SpatialGeoJsonExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata;
  records: AuditRecord[];
  adjustments?: DatabaseAdjustment[];
  onPublishHtml?: () => void;
  onOpenDiff?: () => void;
  onOpenSchemaMonitor?: () => void;
}

export const SpatialGeoJsonExportModal: React.FC<SpatialGeoJsonExportModalProps> = ({
  isOpen,
  onClose,
  project,
  records,
  adjustments = [],
  onPublishHtml,
  onOpenDiff,
  onOpenSchemaMonitor
}) => {
  const [selectedLayerFilter, setSelectedLayerFilter] = useState<'all' | 'regional' | 'local' | 'detalhe' | 'analitico'>('all');
  const [hasCopied, setHasCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'map' | 'audit_trail' | 'layers' | 'json_code'>('map');
  const [codeDatasetType, setCodeDatasetType] = useState<'audit_trail' | 'layers'>('audit_trail');
  const [searchFilter, setSearchFilter] = useState('');
  const [evaluationFilter, setEvaluationFilter] = useState<'all' | 'Sim' | 'Não'>('all');
  const [mapBasemapId, setMapBasemapId] = useState<string>('google_hybrid');
  const [showMapApa, setShowMapApa] = useState<boolean>(true);
  const [showMapMunicipios, setShowMapMunicipios] = useState<boolean>(true);
  const [showMapAlertas, setShowMapAlertas] = useState<boolean>(true);
  const [showMapBuffer, setShowMapBuffer] = useState<boolean>(false);
  const [showMapAuditPoints, setShowMapAuditPoints] = useState<boolean>(true);
  const [mapAuditPointFilter, setMapAuditPointFilter] = useState<'all' | 'Sim' | 'Não'>('all');
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<{
    title: string;
    level: string;
    areaHa?: number;
    intersectionHa?: number;
    condition?: string;
    source?: string;
    evidence?: string;
    hash?: string;
  } | null>(null);

  const activeExportBasemap = useMemo(() => {
    return EXPORT_BASEMAP_OPTIONS.find((b) => b.id === mapBasemapId) || EXPORT_BASEMAP_OPTIONS[0];
  }, [mapBasemapId]);

  const apaPositions = useMemo(() => ringsToLeaflet(APA_ARARIPE_POLYGON_COORDS), []);
  const cratoPositions = useMemo(() => ringsToLeaflet(MUNICIPIO_CRATO_COORDS), []);
  const barbalhaPositions = useMemo(() => ringsToLeaflet(MUNICIPIO_BARBALHA_COORDS), []);
  const santanaPositions = useMemo(() => ringsToLeaflet(MUNICIPIO_SANTANA_CARIRI_COORDS), []);
  const bufferPositions = useMemo(() => ringsToLeaflet(BUFFER_10KM_COORDS), []);
  const alerta809Positions = useMemo(() => ringsToLeaflet(ALERTA_809_COORDS), []);
  const alerta114Positions = useMemo(() => ringsToLeaflet(ALERTA_114_COORDS), []);
  const alerta162Positions = useMemo(() => ringsToLeaflet(ALERTA_162_COORDS), []);
  const alerta205Positions = useMemo(() => ringsToLeaflet(ALERTA_205_COORDS), []);

  // Compute spatial stats
  const stats = useMemo(() => getSpatialAuditStats(records), [records]);

  // Validated records that have spatial output
  const validatedSpatialRecords = useMemo(() => {
    return records.filter((r) => r.evaluation === 'Sim' && isSpatialActivityRecord(r));
  }, [records]);

  // Consolidated GeoJSON dataset (Cartographic Polygons)
  const consolidatedGeoJson = useMemo(() => {
    return buildConsolidatedGeoJson(records, project);
  }, [records, project]);

  // Audit Records GeoJSON dataset (Audit trail for external GIS)
  const auditRecordsGeoJson = useMemo(() => {
    return buildAuditRecordsGeoJson(records, project, adjustments);
  }, [records, project, adjustments]);

  // Active GeoJSON preview string
  const activeGeoJsonPreview = useMemo(() => {
    const dataset = codeDatasetType === 'audit_trail' ? auditRecordsGeoJson : consolidatedGeoJson;
    return JSON.stringify(dataset, null, 2);
  }, [codeDatasetType, auditRecordsGeoJson, consolidatedGeoJson]);

  // Filtered audit records for the audit trail tab
  const filteredAuditRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesEval = evaluationFilter === 'all' || r.evaluation === evaluationFilter;
      const term = searchFilter.toLowerCase();
      const matchesSearch =
        !term ||
        r.activityTitle.toLowerCase().includes(term) ||
        r.checkpointPrompt.toLowerCase().includes(term) ||
        r.phaseName.toLowerCase().includes(term) ||
        r.recordHash.toLowerCase().includes(term) ||
        r.technicalEvidence.toLowerCase().includes(term) ||
        `f${r.phaseId}.a${r.activityNumber}`.includes(term);
      return matchesEval && matchesSearch;
    });
  }, [records, evaluationFilter, searchFilter]);

  if (!isOpen) return null;

  // Download Cartographic Layers GeoJSON
  const handleDownloadLayersGeoJson = () => {
    const filename = `geojornalismo_camadas_validadas_${project.id}_${Date.now()}.geojson`;
    downloadGeoJsonFile(consolidatedGeoJson, filename);
  };

  // Download Audit Records Trail GeoJSON for external GIS
  const handleDownloadAuditRecordsGeoJson = () => {
    downloadAuditRecordsGeoJsonFile(records, project, adjustments);
  };

  // Download both files for complete package
  const handleDownloadAllDatasets = () => {
    handleDownloadAuditRecordsGeoJson();
    setTimeout(() => {
      handleDownloadLayersGeoJson();
    }, 500);
  };

  const handleDownloadSingleRecord = (record: AuditRecord) => {
    const singleGeoJson = buildGeoJsonForSingleRecord(record, project);
    const filename = `geojornalismo_ativ_${record.activityNumber}_${record.activityId}.geojson`;
    downloadGeoJsonFile(singleGeoJson, filename);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeGeoJsonPreview);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  const totalSim = records.filter((r) => r.evaluation === 'Sim').length;
  const totalNao = records.filter((r) => r.evaluation === 'Não').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Exportação Espacial · Padrão OGC RFC 7946 & SIG Externo
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.2 rounded font-mono">
                  WGS 84 (EPSG:4326)
                </span>
                <span className="text-[10px] bg-teal-900 text-teal-300 border border-teal-700 px-2 py-0.2 rounded font-mono font-semibold">
                  QGIS / ArcGIS Ready
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Exportar Dados e Registros de Auditoria em Formato GeoJSON
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Scientific Disclaimer / Status Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-950 text-xs">
                  Auditabilidade Externa em SIG (Luna, 2026c)
                </h4>
                <p className="text-emerald-900 text-[11px] mt-0.5 leading-relaxed">
                  Esta ferramenta permite exportar tanto a <strong>Trilha de Auditoria Metodológica</strong> (com todos os metadados, perguntas de checagem, evidências e hashes SHA-256 de cada etapa) quanto as <strong>Camadas Cartográficas Vetoriais</strong> para averiguação independente no <strong>QGIS</strong>, <strong>ArcGIS</strong> ou softwares de geoprocessamento.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 bg-white/90 px-3 py-2 rounded border border-emerald-200 font-mono text-center">
              <div>
                <span className="text-[10px] text-slate-500 block">Etapas Auditadas</span>
                <span className="text-sm font-bold text-emerald-700">
                  {totalSim} / {records.length}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] text-slate-500 block">Feições Vetoriais</span>
                <span className="text-sm font-bold text-slate-900">
                  {consolidatedGeoJson.features.length}
                </span>
              </div>
            </div>
          </div>

          {/* Two Primary Export Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Registros de Auditoria para SIG (Destaque do Requisito) */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-teal-950 text-white rounded-xl p-5 shadow-sm border border-teal-800/60 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-teal-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Auditabilidade Externa em SIG</span>
                  </span>
                  <span className="text-[9px] bg-teal-950 text-teal-300 border border-teal-700 px-2 py-0.5 rounded font-mono font-semibold">
                    NOVA FUNCIONALIDADE
                  </span>
                </div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Trilha de Registros de Auditoria ({records.length} Etapas)</span>
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Exporta cada etapa do protocolo como uma feição GeoJSON contendo todos os <strong>metadados técnicos na Tabela de Atributos</strong>: código da etapa, pergunta de checagem, avaliação Sim/Não, hash SHA-256, evidência documental, auditor e carimbo de data/hora para auditoria no QGIS.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-slate-800/80 p-2.5 rounded border border-teal-900/50">
                  <div>
                    <span className="text-slate-400 block">Conformes</span>
                    <span className="text-emerald-400 font-bold text-xs">{totalSim} (Sim)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Inconformidades</span>
                    <span className="text-rose-400 font-bold text-xs">{totalNao} (Não)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Compatível</span>
                    <span className="text-teal-300 font-bold text-xs">QGIS / ArcGIS</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAuditRecordsGeoJson}
                  className="w-full px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 fill-slate-950" />
                  <span>BAIXAR REGISTROS DE AUDITORIA (GEOJSON SIG)</span>
                </button>
              </div>
            </div>

            {/* Card 2: Coleção de Camadas Cartográficas Consolidadas */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-800 text-white rounded-xl p-5 shadow-sm border border-slate-700/80 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Camadas Vetoriais Físicas</span>
                  </span>
                  <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                    RFC 7946 Polígonos
                  </span>
                </div>
                <h3 className="text-base font-bold text-white">
                  Camadas Cartográficas Consolidadas ({consolidatedGeoJson.features.length} Feições)
                </h3>
                <p className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                  Exporta as geometrias físicas poligonais validadas (APA Chapada do Araripe ICMBio, Malha Municipal IBGE, Alertas MapBiomas/DETER com cálculo de hectares e Buffer perimetral de 10 km).
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-slate-800/80 p-2.5 rounded border border-slate-700/60">
                  <div>
                    <span className="text-slate-400 block">Área Alertas</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      {consolidatedGeoJson.metadata.auditSummary.totalAlertsAnalyzedHa} ha
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Interseção APA</span>
                    <span className="text-rose-400 font-bold text-xs">
                      {consolidatedGeoJson.metadata.auditSummary.totalAreaInsideApaHa} ha
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Projeção SRC</span>
                    <span className="text-slate-200 font-bold text-xs">EPSG:4326</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadLayersGeoJson}
                  disabled={consolidatedGeoJson.features.length === 0}
                  className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4 fill-slate-950" />
                  <span>BAIXAR CAMADAS VETORIAIS (GEOJSON)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Dual-Download Action Bar */}
          <div className="bg-slate-100 border border-slate-300 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Database className="w-4 h-4 text-slate-500 shrink-0" />
              <span>
                <strong>Pacote Completo de Auditoria Metodológica:</strong> Baixe ambos os arquivos para abrir lado a lado no QGIS (Camada de Polígonos + Camada de Registros de Auditoria com Tabela de Atributos).
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadAllDatasets}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-300" />
              <span>Baixar Ambos os Arquivos (Pacote Completo)</span>
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewTab('map')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'map'
                    ? 'bg-slate-900 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mapa das Feições Exportadas</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded font-mono font-semibold">
                  Ao Vivo
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('audit_trail')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'audit_trail'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Trilha de Registros de Auditoria para SIG ({records.length} Etapas)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('layers')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'layers'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>Camadas Individuais ({validatedSpatialRecords.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('json_code')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  previewTab === 'json_code'
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Pré-visualização do Código GeoJSON</span>
              </button>
            </div>

            {previewTab === 'json_code' && (
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[11px] transition-colors cursor-pointer"
              >
                {hasCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-semibold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar GeoJSON</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* VIEW 0: INTERACTIVE EXPORT MAP PREVIEW */}
          {previewTab === 'map' && (
            <div className="space-y-3">
              {/* Top Controls Toolbar: Basemap & Layer Toggles */}
              <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                {/* Basemap Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-emerald-400" />
                    <span>Basemap:</span>
                  </span>
                  {EXPORT_BASEMAP_OPTIONS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setMapBasemapId(b.id)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1 cursor-pointer ${
                        mapBasemapId === b.id
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                      }`}
                      title={b.name}
                    >
                      <span>{b.icon}</span>
                      <span>{b.shortLabel}</span>
                    </button>
                  ))}
                </div>

                {/* Layer Toggles */}
                <div className="flex items-center gap-3 flex-wrap text-[11px] font-mono">
                  <span className="text-slate-400 font-bold uppercase tracking-wider">Camadas:</span>

                  <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMapApa}
                      onChange={(e) => setShowMapApa(e.target.checked)}
                      className="rounded text-emerald-500 accent-emerald-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block"></span>
                    <span className="text-slate-200">APA Araripe</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMapMunicipios}
                      onChange={(e) => setShowMapMunicipios(e.target.checked)}
                      className="rounded text-blue-500 accent-blue-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block"></span>
                    <span className="text-slate-200">Municípios</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMapAlertas}
                      onChange={(e) => setShowMapAlertas(e.target.checked)}
                      className="rounded text-rose-500 accent-rose-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block"></span>
                    <span className="text-slate-200">Alertas (48,7 ha)</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMapBuffer}
                      onChange={(e) => setShowMapBuffer(e.target.checked)}
                      className="rounded text-purple-500 accent-purple-500"
                    />
                    <span className="w-2.5 h-2.5 rounded-xs bg-purple-500 inline-block"></span>
                    <span className="text-slate-200">Buffer 10km</span>
                  </label>

                  <label className="flex items-center gap-1 cursor-pointer hover:text-white">
                    <input
                      type="checkbox"
                      checked={showMapAuditPoints}
                      onChange={(e) => setShowMapAuditPoints(e.target.checked)}
                      className="rounded text-teal-400 accent-teal-400"
                    />
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block"></span>
                    <span className="text-slate-200">Pontos SIG</span>
                  </label>
                </div>
              </div>

              {/* Map Canvas with Leaflet */}
              <div className="relative w-full h-[440px] rounded-xl overflow-hidden border border-slate-300 bg-slate-950 shadow-inner">
                {/* HUD Overlay inside map: CRS & Stats */}
                <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 text-slate-200 text-[11px] font-mono shadow-md flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WGS 84 (EPSG:4326) · {activeExportBasemap.name}</span>
                </div>

                {/* Audit Point Filter overlay if points layer is active */}
                {showMapAuditPoints && (
                  <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-2.5 py-1 rounded-md border border-slate-700 text-[10px] font-mono shadow-md flex items-center gap-1.5 text-slate-300">
                    <span className="text-slate-400 font-bold">Pontos:</span>
                    <button
                      type="button"
                      onClick={() => setMapAuditPointFilter('all')}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        mapAuditPointFilter === 'all' ? 'bg-slate-700 text-white font-bold' : 'hover:text-white'
                      }`}
                    >
                      Todos ({records.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapAuditPointFilter('Sim')}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        mapAuditPointFilter === 'Sim' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-400 hover:text-white'
                      }`}
                    >
                      ✓ Sim ({totalSim})
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapAuditPointFilter('Não')}
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        mapAuditPointFilter === 'Não' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-white'
                      }`}
                    >
                      ✗ Não ({totalNao})
                    </button>
                  </div>
                )}

                <MapContainer
                  center={[-7.234, -39.412]}
                  zoom={12}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%', background: '#090d16' }}
                >
                  <TileLayer
                    key={mapBasemapId}
                    url={activeExportBasemap.url}
                    attribution={activeExportBasemap.attribution}
                    maxZoom={activeExportBasemap.maxZoom}
                  />

                  <ExportMapController />

                  {/* Layer: APA Araripe */}
                  {showMapApa && (
                    <Polygon
                      positions={apaPositions}
                      pathOptions={{
                        color: '#059669',
                        weight: 2.5,
                        opacity: 0.9,
                        fillColor: '#10b981',
                        fillOpacity: 0.12,
                        dashArray: '6, 4'
                      }}
                    >
                      <Popup>
                        <div className="font-sans text-xs space-y-1 p-0.5">
                          <h4 className="font-bold text-slate-900">APA Chapada do Araripe (ICMBio)</h4>
                          <p className="text-[11px] text-slate-600">Poligonal federal: 1.063.000 ha nos estados CE, PE e PI.</p>
                          <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 p-1 rounded">
                            SRC Oficial: SIRGAS 2000 Brasil Albers · Validado
                          </div>
                        </div>
                      </Popup>
                      <Tooltip>APA Chapada do Araripe (1.063.000 ha)</Tooltip>
                    </Polygon>
                  )}

                  {/* Layer: Municípios Cariri */}
                  {showMapMunicipios && (
                    <>
                      <Polygon
                        positions={cratoPositions}
                        pathOptions={{ color: '#2563eb', weight: 1.8, opacity: 0.85, fillColor: '#3b82f6', fillOpacity: 0.14 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <h4 className="font-bold text-slate-900">Município de Crato - CE</h4>
                            <p className="text-[11px] text-slate-600">Malha municipal IBGE (2024). Área: 100.920 ha.</p>
                            <span className="text-[10px] font-mono text-blue-700">Geometria e Topologia Limpas</span>
                          </div>
                        </Popup>
                        <Tooltip>Crato - CE</Tooltip>
                      </Polygon>

                      <Polygon
                        positions={barbalhaPositions}
                        pathOptions={{ color: '#3b82f6', weight: 1.8, opacity: 0.85, fillColor: '#60a5fa', fillOpacity: 0.14 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <h4 className="font-bold text-slate-900">Município de Barbalha - CE</h4>
                            <p className="text-[11px] text-slate-600">Área: 60.815 ha. Recarga do Aquífero Missão Velha.</p>
                          </div>
                        </Popup>
                        <Tooltip>Barbalha - CE</Tooltip>
                      </Polygon>

                      <Polygon
                        positions={santanaPositions}
                        pathOptions={{ color: '#1d4ed8', weight: 1.8, opacity: 0.85, fillColor: '#93c5fd', fillOpacity: 0.14 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <h4 className="font-bold text-slate-900">Município de Santana do Cariri - CE</h4>
                            <p className="text-[11px] text-slate-600">Borda da Chapada do Araripe e Bacia Sedimentar.</p>
                          </div>
                        </Popup>
                        <Tooltip>Santana do Cariri - CE</Tooltip>
                      </Polygon>
                    </>
                  )}

                  {/* Layer: Buffer 10km Amortecimento */}
                  {showMapBuffer && (
                    <Polygon
                      positions={bufferPositions}
                      pathOptions={{ color: '#7e22ce', weight: 1.5, opacity: 0.7, fillColor: '#9333ea', fillOpacity: 0.08, dashArray: '4, 4' }}
                    >
                      <Popup>
                        <div className="font-sans text-xs space-y-1 p-0.5">
                          <h4 className="font-bold text-purple-900">Zona de Amortecimento (Buffer 10 km)</h4>
                          <p className="text-[11px] text-slate-600">Faixa perimetral regulamentada pelo SNUC / Conama 13/1990.</p>
                        </div>
                      </Popup>
                      <Tooltip>Zona de Amortecimento (Buffer 10 km)</Tooltip>
                    </Polygon>
                  )}

                  {/* Layer: Alertas de Supressão */}
                  {showMapAlertas && (
                    <>
                      <Polygon
                        positions={alerta809Positions}
                        pathOptions={{ color: '#be123c', weight: 2.2, opacity: 0.95, fillColor: '#e11d48', fillOpacity: 0.55 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <span className="text-[10px] font-mono font-bold text-rose-700">ALT-2024-089</span>
                            <h4 className="font-bold text-slate-900">Alerta Encosta da Chapada (Crato)</h4>
                            <div className="text-[11px] text-slate-700">
                              <p><strong>Área:</strong> 142.85 ha (Totalmente Dentro da APA)</p>
                              <p><strong>Detecção:</strong> 14/03/2024 · MapBiomas Alerta / DETER</p>
                            </div>
                          </div>
                        </Popup>
                        <Tooltip>Alerta ALT-2024-089 (142.85 ha)</Tooltip>
                      </Polygon>

                      <Polygon
                        positions={alerta114Positions}
                        pathOptions={{ color: '#be123c', weight: 2.2, opacity: 0.95, fillColor: '#e11d48', fillOpacity: 0.55 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <span className="text-[10px] font-mono font-bold text-rose-700">ALT-2024-114</span>
                            <h4 className="font-bold text-slate-900">Alerta Santana do Cariri</h4>
                            <p className="text-[11px]"><strong>Área:</strong> 284.10 ha (198.40 ha na APA / 85.70 ha fora)</p>
                          </div>
                        </Popup>
                        <Tooltip>Alerta ALT-2024-114 (284.10 ha)</Tooltip>
                      </Polygon>

                      <Polygon
                        positions={alerta162Positions}
                        pathOptions={{ color: '#9f1239', weight: 2, opacity: 0.9, fillColor: '#f43f5e', fillOpacity: 0.45 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <span className="text-[10px] font-mono font-bold text-rose-700">ALT-2024-162</span>
                            <h4 className="font-bold text-slate-900">Alerta Polo Agrícola Sul</h4>
                            <p className="text-[11px]">Área: 95.30 ha (Adjacente ao Vale do Cariri)</p>
                          </div>
                        </Popup>
                        <Tooltip>Alerta ALT-2024-162 (95.30 ha)</Tooltip>
                      </Polygon>

                      <Polygon
                        positions={alerta205Positions}
                        pathOptions={{ color: '#be123c', weight: 2.2, opacity: 0.95, fillColor: '#e11d48', fillOpacity: 0.55 }}
                      >
                        <Popup>
                          <div className="font-sans text-xs space-y-1 p-0.5">
                            <span className="text-[10px] font-mono font-bold text-rose-700">ALT-2024-205</span>
                            <h4 className="font-bold text-slate-900">Alerta Encosta do Caldas (Barbalha)</h4>
                            <p className="text-[11px]">Área: 73.45 ha (100% sobreposta na APA Araripe)</p>
                          </div>
                        </Popup>
                        <Tooltip>Alerta ALT-2024-205 (73.45 ha)</Tooltip>
                      </Polygon>
                    </>
                  )}

                  {/* Layer: Audit Stations Points (External SIG trail) */}
                  {showMapAuditPoints &&
                    records
                      .filter((r) => mapAuditPointFilter === 'all' || r.evaluation === mapAuditPointFilter)
                      .map((r) => {
                        const coords = getRepresentativeCoordinatesForRecord(r);
                        const isSim = r.evaluation === 'Sim';

                        return (
                          <CircleMarker
                            key={r.id}
                            center={[coords[1], coords[0]]}
                            radius={isSim ? 6 : 8}
                            pathOptions={{
                              color: isSim ? '#059669' : '#dc2626',
                              fillColor: isSim ? '#10b981' : '#f43f5e',
                              fillOpacity: 0.9,
                              weight: 2
                            }}
                          >
                            <Popup>
                              <div className="font-sans text-xs space-y-1.5 p-1 max-w-xs">
                                <div className="flex items-center justify-between gap-1 border-b pb-1">
                                  <span className="font-mono text-[10px] font-bold text-slate-700">
                                    F{r.phaseId}.A{r.activityNumber}
                                  </span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                                      isSim
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {isSim ? '✓ Conforme (Sim)' : '✗ Inconformidade (Não)'}
                                  </span>
                                </div>
                                <h4 className="font-bold text-slate-900 leading-tight">
                                  {r.activityTitle}
                                </h4>
                                <p className="text-[11px] text-slate-600">
                                  <strong>Pergunta:</strong> {r.checkpointPrompt}
                                </p>
                                <div className="bg-slate-50 p-1.5 rounded font-mono text-[10px] text-slate-700 border">
                                  <p><strong>Evidência:</strong> {r.technicalEvidence}</p>
                                  <p className="text-slate-500 truncate mt-0.5">HASH: {r.recordHash}</p>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Auditor: {r.operator} · {new Date(r.timestamp).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                            </Popup>
                            <Tooltip>
                              F{r.phaseId}.A{r.activityNumber}: {r.activityTitle} ({r.evaluation})
                            </Tooltip>
                          </CircleMarker>
                        );
                      })}
                </MapContainer>
              </div>

              {/* Informative Bottom Note */}
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 font-mono">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Todas as geometrias exibidas acima estão em conformidade com o padrão <strong>OGC RFC 7946</strong> e prontas para exportação.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadLayersGeoJson}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar Polígonos (.geojson)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadAuditRecordsGeoJson}
                    className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Baixar Trilha SIG (.geojson)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* View 1: Audit Trail for External GIS (QGIS/ArcGIS) */}
          {previewTab === 'audit_trail' && (
            <div className="space-y-3">
              {/* Instructions Box for GIS Users */}
              <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-teal-900 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Como utilizar este GeoJSON no QGIS / ArcGIS para auditoria factual:
                  </p>
                  <ol className="list-decimal pl-4 space-y-0.5 text-[11px] text-teal-950">
                    <li>Arraste o arquivo <code>trilha_auditoria_etapas_geojornalismo_*.geojson</code> para dentro do QGIS.</li>
                    <li>Abra a <strong>Tabela de Atributos (tecla F6)</strong>: cada linha exibirá a pergunta de checagem, avaliação binária, hash SHA-256 e evidências técnicas da etapa.</li>
                    <li>Na simbologia de camadas, estilize usando categorização pelo campo <code>avaliacao_binaria</code> (Verde para 'Sim' e Vermelho para 'Não').</li>
                  </ol>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar etapas, perguntas, evidências..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-mono self-end sm:self-auto">
                  <span className="text-slate-500">Filtrar Avaliação:</span>
                  <button
                    type="button"
                    onClick={() => setEvaluationFilter('all')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      evaluationFilter === 'all'
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({records.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluationFilter('Sim')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      evaluationFilter === 'Sim'
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Sim ({totalSim})
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvaluationFilter('Não')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      evaluationFilter === 'Não'
                        ? 'bg-rose-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Não ({totalNao})
                  </button>
                </div>
              </div>

              {/* Records List */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[380px] overflow-y-auto">
                {filteredAuditRecords.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    Nenhum registro encontrado para o filtro aplicado.
                  </div>
                ) : (
                  filteredAuditRecords.map((r) => {
                    const coords = getRepresentativeCoordinatesForRecord(r);
                    const isConforme = r.evaluation === 'Sim';

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              F{r.phaseId}.A{r.activityNumber}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">
                              {r.phaseName}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 ${
                                isConforme
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {isConforme ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Sim (Conforme)</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-rose-600" />
                                  <span>Não (Inconformidade)</span>
                                </>
                              )}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              HASH: {r.recordHash}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-xs">
                            {r.activityTitle}
                          </h4>

                          <div className="bg-slate-50 p-2 rounded border border-slate-200/80 text-[11px] space-y-1 font-mono">
                            <p className="text-slate-800">
                              <strong className="text-slate-900">Checkpoint:</strong> {r.checkpointPrompt}
                            </p>
                            <p className="text-slate-600 truncate">
                              <strong className="text-slate-700">Evidência:</strong> {r.technicalEvidence}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                            <span>Auditor: {r.operator}</span>
                            <span>·</span>
                            <span>Coords WGS84: [{coords[0]}, {coords[1]}]</span>
                            <span>·</span>
                            <span>{new Date(r.timestamp).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* View 2: List of Validated Spatial Activities (Cartographic Layers) */}
          {previewTab === 'layers' && (
            <div className="space-y-3">
              {validatedSpatialRecords.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700 text-xs">
                    Nenhuma atividade espacial com validação "Sim" foi encontrada até o momento.
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                    Conforme o protocolo avança nas Fases 2 (Obter), 3 (Limpar), 4 (Estruturar), 5 (Analisar) e 6 (Apresentar), as atividades com saídas espaciais validadas aparecerão listadas aqui para download individual.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white max-h-[380px] overflow-y-auto">
                  {validatedSpatialRecords.map((r) => {
                    const spec = SPATIAL_ACTIVITIES_MAP[r.activityId];
                    const levelBadge = spec ? spec.level : 'Espacial';

                    return (
                      <div
                        key={r.id}
                        className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              Fase {r.phaseId} · Ativ. {r.activityNumber}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                                levelBadge === 'Regional'
                                  ? 'bg-amber-100 text-amber-800'
                                  : levelBadge === 'Local'
                                  ? 'bg-blue-100 text-blue-800'
                                  : levelBadge === 'Detalhe'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-purple-100 text-purple-800'
                              }`}
                            >
                              Nível {levelBadge}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              HASH: {r.recordHash}
                            </span>
                          </div>

                          <h4 className="font-bold text-slate-900 text-xs">
                            {spec?.layerTitle || r.activityTitle}
                          </h4>

                          <p className="text-[11px] text-slate-600 leading-tight">
                            {spec?.description || r.outputProduced}
                          </p>

                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-0.5">
                            <span>Fonte: {spec?.officialSource || 'SIG Oficial'}</span>
                            <span>·</span>
                            <span>Auditado por: {r.operator}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadSingleRecord(r)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 hover:text-slate-900 font-medium text-xs transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                            title="Baixar arquivo GeoJSON desta camada específica"
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Baixar Camada (.geojson)</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* View 3: GeoJSON Code Preview */}
          {previewTab === 'json_code' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Visualizando Dataset:</span>
                  <button
                    type="button"
                    onClick={() => setCodeDatasetType('audit_trail')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      codeDatasetType === 'audit_trail'
                        ? 'bg-teal-900 text-teal-200 font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Trilha de Auditoria SIG ({records.length} Feições)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeDatasetType('layers')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      codeDatasetType === 'layers'
                        ? 'bg-emerald-900 text-emerald-200 font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Camadas Vetoriais ({consolidatedGeoJson.features.length} Feições)
                  </button>
                </div>

                <span>Padrão RFC 7946 GeoJSON</span>
              </div>

              <div className="bg-slate-950 text-slate-200 rounded-lg p-4 font-mono text-[11px] max-h-80 overflow-y-auto border border-slate-800 shadow-inner">
                <pre className="whitespace-pre-wrap leading-relaxed">
                  {activeGeoJsonPreview}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono shrink-0">
          <span>
            Padrão OGC RFC 7946 · Compatível com QGIS 3.x, ArcGIS, Leaflet, GeoPandas e Mapbox
          </span>

          <div className="btn-group-center">
            {onOpenDiff && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDiff();
                }}
                className="btn-base btn-sm btn-indigo cursor-pointer"
                title="Comparar visualmente as camadas exportadas com o estado original das camadas (Diff Visual)"
              >
                <GitCompare className="w-3.5 h-3.5 text-indigo-200" />
                <span>Diff Visual</span>
              </button>
            )}

            {onOpenSchemaMonitor && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSchemaMonitor();
                }}
                className="btn-base btn-sm btn-secondary cursor-pointer"
                title="Auditar conformidade dos atributos contra o esquema metodológico oficial (ET-EDGV / Luna 2026c)"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Monitor de Esquema</span>
              </button>
            )}

            {onPublishHtml && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPublishHtml();
                }}
                className="btn-base btn-sm btn-primary cursor-pointer"
                title="Publicar e baixar o webmap interativo completo em arquivo HTML autônomo com Leaflet"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-400" />
                <span>Publicar Webmap</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadAuditRecordsGeoJson}
              className="btn-base btn-sm btn-secondary cursor-pointer"
              title="Baixar a trilha completa de auditoria em GeoJSON para SIG externo"
            >
              <Download className="w-3.5 h-3.5 text-teal-600" />
              <span>Baixar Trilha SIG</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadLayersGeoJson}
              className="btn-base btn-sm btn-success cursor-pointer shadow-xs"
              title="Baixar arquivo GeoJSON consolidado com as geometrias validadas"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar GeoJSON Consolidado</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-base btn-sm btn-secondary cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
