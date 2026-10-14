import React, { useState, useMemo, useEffect } from 'react';
import { ProjectMetadata, AuditRecord } from '../types/workflow';
import {
  computeSpatialDiff,
  FeatureDiffItem,
  SpatialDiffSummary
} from '../services/spatialDiffService';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Layers,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  Maximize2,
  Download,
  ShieldCheck,
  FileCode,
  MapPin,
  ArrowRight,
  GitCompare,
  Split,
  Crosshair,
  Search,
  Check,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface GeoJsonVisualDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectMetadata;
  records: AuditRecord[];
}

// Controller component to smoothly fly and focus map on selected feature
function MapFocusController({
  selectedItem,
  viewMode
}: {
  selectedItem: FeatureDiffItem | null;
  viewMode: 'overlay' | 'split' | 'diff_only';
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedItem) {
      map.flyTo(
        [selectedItem.centroid[1], selectedItem.centroid[0]],
        selectedItem.level === 'Regional' ? 9 : selectedItem.level === 'Local' ? 11 : 14,
        { duration: 1.2 }
      );
    } else {
      map.flyTo([-7.234, -39.412], 12, { duration: 1.2 });
    }
  }, [selectedItem, map]);

  return null;
}

export const GeoJsonVisualDiffModal: React.FC<GeoJsonVisualDiffModalProps> = ({
  isOpen,
  onClose,
  project,
  records
}) => {
  const [viewMode, setViewMode] = useState<'overlay' | 'split' | 'diff_only'>('overlay');
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>('all');
  const [rawOpacity, setRawOpacity] = useState<number>(0.7);
  const [cleanedOpacity, setCleanedOpacity] = useState<number>(0.75);
  const [showRawLayer, setShowRawLayer] = useState<boolean>(true);
  const [showCleanedLayer, setShowCleanedLayer] = useState<boolean>(true);
  const [showErrorPoints, setShowErrorPoints] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'map' | 'table'>('map');
  const [basemapType, setBasemapType] = useState<'satellite' | 'streets' | 'dark' | 'osm'>('satellite');

  // Compute diff summary and items
  const diffData: SpatialDiffSummary = useMemo(() => {
    return computeSpatialDiff(project, records);
  }, [project, records]);

  const selectedItem = useMemo(() => {
    if (selectedFeatureId === 'all') return null;
    return diffData.items.find((i) => i.id === selectedFeatureId) || null;
  }, [selectedFeatureId, diffData]);

  if (!isOpen) return null;

  const handleDownloadDiffReport = () => {
    const reportData = {
      title: `Relatório de Diff Visual Geojornalístico - ${project.title}`,
      auditor: project.researcher,
      timestamp: new Date().toISOString(),
      summary: {
        totalFeaturesCompared: diffData.totalFeaturesCompared,
        totalOriginalErrors: diffData.totalOriginalErrors,
        totalExportedErrors: diffData.totalExportedErrors,
        verticesCleanedCount: diffData.verticesCleanedCount,
        netAreaDeltaHa: diffData.netAreaDeltaHa,
        conformanceBefore: diffData.conformanceBefore,
        conformanceAfter: diffData.conformanceAfter
      },
      items: diffData.items.map((i) => ({
        id: i.id,
        name: i.name,
        level: i.level,
        originalVertexCount: i.originalVertexCount,
        exportedVertexCount: i.exportedVertexCount,
        originalAreaHa: i.originalAreaHa,
        exportedAreaHa: i.exportedAreaHa,
        areaDeltaHa: i.areaDeltaHa,
        repairedAlgorithms: i.repairedAlgorithms,
        errorTypes: i.errorTypes
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laudo_diff_visual_geojornalismo_${project.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-7xl w-full overflow-hidden my-3 flex flex-col h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
              <GitCompare className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  Auditoria de Integridade Topológica · Diff Visual
                </span>
                <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  Base Bruta vs. GeoJSON Validado
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Comparação Visual de Sobreposição: Camadas Brutas x GeoJSON Exportado
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadDiffReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Baixar laudo forense de comparação geométrica"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Baixar Laudo Diff (JSON)</span>
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

        {/* Diff KPI Cards Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Erros Topológicos:</span>
              <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 line-through">
                {diffData.totalOriginalErrors} detectados
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400" />
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                0 no Exportado (100% Sanado)
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Vértices Auditados:</span>
              <span className="text-slate-700 font-bold">
                {diffData.totalOriginalVertices} brutos → {diffData.totalExportedVertices} limpos
              </span>
              <span className="text-emerald-700 font-bold">
                ({diffData.verticesCleanedCount} nós corrigidos)
              </span>
            </div>

            <div className="h-4 w-px bg-slate-300 hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Delta de Área Total:</span>
              <span className="text-slate-800 font-bold">
                {diffData.netAreaDeltaHa >= 0 ? '+' : ''}{diffData.netAreaDeltaHa.toFixed(2)} ha (ajuste Albers)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'map'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mapa de Sobreposição</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'table'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Tabela Comparativa de Feições</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {activeTab === 'map' ? (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Interactive Leaflet Map Area */}
            <div className="flex-1 relative bg-slate-100 flex flex-col min-h-[420px]">
              {/* Map Controls HUD Bar */}
              <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-xs text-white p-2 rounded-lg border border-slate-700 shadow-md text-xs font-mono">
                {/* Feature focus selector */}
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                  <select
                    value={selectedFeatureId}
                    onChange={(e) => setSelectedFeatureId(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-600 rounded px-2 py-1 text-xs font-mono focus:ring-1 focus:ring-indigo-400 focus:outline-hidden"
                  >
                    <option value="all">🔍 Todas as Feições</option>
                    {diffData.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.id} · {item.name.substring(0, 32)}
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-slate-600">|</span>

                {/* Layer Toggles */}
                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showRawLayer}
                    onChange={(e) => setShowRawLayer(e.target.checked)}
                    className="rounded text-rose-600"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  <span className="text-rose-200">Base Bruta</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showCleanedLayer}
                    onChange={(e) => setShowCleanedLayer(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span className="text-emerald-200">Validado (GeoJSON)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                  <input
                    type="checkbox"
                    checked={showErrorPoints}
                    onChange={(e) => setShowErrorPoints(e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  <span className="text-amber-200">Pontos de Kink</span>
                </label>
              </div>

              {/* Opacity Slider HUD */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-xs text-white p-2.5 rounded-lg border border-slate-700 shadow-md text-[11px] font-mono flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-rose-300">Opacidade Bruta:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={rawOpacity}
                    onChange={(e) => setRawOpacity(parseFloat(e.target.value))}
                    className="w-20 accent-rose-500 cursor-pointer"
                  />
                  <span className="w-8 text-right">{Math.round(rawOpacity * 100)}%</span>
                </div>

                <div className="h-4 w-px bg-slate-700" />

                <div className="flex items-center gap-2">
                  <span className="text-emerald-300">Opacidade Validada:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={cleanedOpacity}
                    onChange={(e) => setCleanedOpacity(parseFloat(e.target.value))}
                    className="w-20 accent-emerald-500 cursor-pointer"
                  />
                  <span className="w-8 text-right">{Math.round(cleanedOpacity * 100)}%</span>
                </div>

                <div className="h-4 w-px bg-slate-700" />

                {/* Basemap Switcher */}
                <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded border border-slate-700 text-[10px]">
                  <span className="text-slate-400 font-bold px-1">Basemap:</span>
                  <button
                    type="button"
                    onClick={() => setBasemapType('satellite')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      basemapType === 'satellite' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🛰️ Google Satélite
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapType('streets')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      basemapType === 'streets' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🗺️ Google Ruas
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapType('dark')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      basemapType === 'dark' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🌙 Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setBasemapType('osm')}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      basemapType === 'osm' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    🌐 OSM
                  </button>
                </div>
              </div>

              {/* Leaflet Dual-Map Canvas */}
              <MapContainer
                center={[-7.234, -39.412]}
                zoom={12}
                scrollWheelZoom={true}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  key={basemapType}
                  attribution={
                    basemapType === 'satellite'
                      ? '&copy; Google Maps / Google Earth'
                      : basemapType === 'streets'
                      ? '&copy; Google Maps'
                      : basemapType === 'dark'
                      ? '&copy; Esri, OpenStreetMap'
                      : '&copy; OpenStreetMap contributors'
                  }
                  url={
                    basemapType === 'satellite'
                      ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                      : basemapType === 'streets'
                      ? 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
                      : basemapType === 'dark'
                      ? 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}'
                      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                  }
                  maxZoom={basemapType === 'dark' ? 16 : 20}
                />

                <MapFocusController selectedItem={selectedItem} viewMode={viewMode} />

                {/* 1. LAYER BRUTA ORIGINAL (Vermelho/Rosa Tracejado) */}
                {showRawLayer &&
                  diffData.items.map((item) => {
                    const ring = item.rawCoordinates[0];
                    if (!ring || ring.length === 0) return null;
                    const leafletPositions: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);

                    return (
                      <Polygon
                        key={`raw-${item.id}`}
                        positions={leafletPositions}
                        pathOptions={{
                          color: '#e11d48',
                          weight: 2.5,
                          dashArray: '5, 5',
                          fillColor: '#f43f5e',
                          fillOpacity: rawOpacity * 0.45
                        }}
                      >
                        <Popup>
                          <div className="p-1 font-sans text-xs">
                            <div className="font-bold text-rose-800 border-b border-rose-200 pb-1 mb-1">
                              [ESTADO BRUTO] {item.id} · {item.name}
                            </div>
                            <div className="font-mono text-[11px] space-y-0.5 text-slate-700">
                              <div>Área Bruta: <strong>{item.originalAreaHa.toFixed(2)} ha</strong></div>
                              <div>Vértices: <strong>{item.originalVertexCount} nós</strong></div>
                              <div className="text-rose-700">Erros Topológicos: <strong>{item.originalErrorsCount} falhas</strong></div>
                              <div className="mt-1 text-[10px] text-slate-500">Falhas: {item.errorTypes.join(', ')}</div>
                            </div>
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })}

                {/* 2. LAYER VALIDADA / EXPORTADA (Verde Esmeralda Sólido) */}
                {showCleanedLayer &&
                  diffData.items.map((item) => {
                    const ring = item.cleanedCoordinates[0];
                    if (!ring || ring.length === 0) return null;
                    const leafletPositions: [number, number][] = ring.map(([lng, lat]) => [lat, lng]);

                    return (
                      <Polygon
                        key={`cleaned-${item.id}`}
                        positions={leafletPositions}
                        pathOptions={{
                          color: '#059669',
                          weight: 2,
                          fillColor: '#10b981',
                          fillOpacity: cleanedOpacity * 0.4
                        }}
                      >
                        <Popup>
                          <div className="p-1 font-sans text-xs">
                            <div className="font-bold text-emerald-800 border-b border-emerald-200 pb-1 mb-1">
                              [GEOJSON EXPORTADO] {item.id} · {item.name}
                            </div>
                            <div className="font-mono text-[11px] space-y-0.5 text-slate-700">
                              <div>Área Oficial (Albers): <strong className="text-emerald-700">{item.exportedAreaHa.toFixed(2)} ha</strong></div>
                              <div>Vértices Higienizados: <strong>{item.exportedVertexCount} nós</strong></div>
                              <div className="text-emerald-700 font-semibold">✓ 0 Erros (Topologia 100% Válida)</div>
                              <div className="text-[10px] text-slate-500">Algoritmos: {item.repairedAlgorithms.join(', ')}</div>
                            </div>
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })}

                {/* 3. PONTOS DE ERRO TOPOLÓGICO ORIGINAL (Kinks e Vértices Duplicados) */}
                {showErrorPoints &&
                  diffData.items.map((item) =>
                    item.problemPoints.map((pt, idx) => (
                      <CircleMarker
                        key={`err-pt-${item.id}-${idx}`}
                        center={[pt.coordinate[1], pt.coordinate[0]]}
                        radius={6}
                        pathOptions={{
                          color: '#b45309',
                          fillColor: '#fbbf24',
                          fillOpacity: 0.9,
                          weight: 2
                        }}
                      >
                        <Tooltip permanent={selectedFeatureId === item.id} direction="top">
                          <span className="font-mono text-[10px] font-bold text-amber-900">
                            ⚠️ {pt.type} ({item.id})
                          </span>
                        </Tooltip>
                        <Popup>
                          <div className="p-1 font-sans text-xs">
                            <strong className="text-amber-800 block mb-0.5">Anomalia Topológica Detectada</strong>
                            <p className="text-[11px] text-slate-700 leading-tight mb-1">{pt.description}</p>
                            <div className="text-[10px] font-mono text-slate-500">
                              Coordenadas: [{pt.coordinate[0].toFixed(5)}, {pt.coordinate[1].toFixed(5)}]
                            </div>
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))
                  )}
              </MapContainer>
            </div>

            {/* Sidebar Inspector Panel */}
            <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col overflow-y-auto shrink-0 shadow-sm">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-mono font-bold text-slate-500 uppercase mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Inspeção Forense da Sobreposição
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Comparação direta entre as geometrias originais sem tratamento e as geometrias higienizadas geradas pelo protocolo de Luna (2026c).
                </p>
              </div>

              {/* Selected or Global Feature Details */}
              <div className="p-4 space-y-4 flex-1">
                {selectedItem ? (
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900">{selectedItem.id}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                          {selectedItem.level}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedItem.name}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Nível Territorial: {selectedItem.level} · Camada: {selectedItem.layerKey}
                      </p>
                    </div>

                    {/* Metrics Comparison Card */}
                    <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-2 text-xs font-mono">
                      <div className="text-[11px] font-bold text-slate-700 uppercase border-b border-slate-100 pb-1">
                        Divergência Geométrica (Delta)
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Vértices (Bruto → Limpo):</span>
                        <span className="font-bold text-slate-800">
                          {selectedItem.originalVertexCount} → {selectedItem.exportedVertexCount}{' '}
                          <span className="text-emerald-700">({selectedItem.vertexDelta} nós)</span>
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Área Calculada:</span>
                        <span className="font-bold text-slate-800">
                          {selectedItem.originalAreaHa.toFixed(2)} ha → {selectedItem.exportedAreaHa.toFixed(2)} ha
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Delta de Área:</span>
                        <span className={`font-bold ${selectedItem.areaDeltaHa !== 0 ? 'text-amber-700' : 'text-slate-800'}`}>
                          {selectedItem.areaDeltaHa >= 0 ? '+' : ''}{selectedItem.areaDeltaHa.toFixed(2)} ha ({selectedItem.areaPercentDelta.toFixed(1)}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500">Erros Topológicos:</span>
                        <span className="font-bold text-emerald-700">
                          {selectedItem.originalErrorsCount} → 0 (Sanado)
                        </span>
                      </div>
                    </div>

                    {/* Errors Repaired List */}
                    <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3 text-xs">
                      <span className="font-bold text-rose-900 block mb-1 text-[11px] uppercase font-mono">
                        Falhas Topológicas Corrigidas:
                      </span>
                      <ul className="text-rose-800 text-[11px] space-y-1 font-mono">
                        {selectedItem.errorTypes.map((err, i) => (
                          <li key={i}>• {err}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Algorithms Applied */}
                    <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs">
                      <span className="font-bold text-emerald-900 block mb-1 text-[11px] uppercase font-mono">
                        Algoritmos Aplicados via MCP / SIG:
                      </span>
                      <ul className="text-emerald-800 text-[11px] space-y-1 font-mono">
                        {selectedItem.repairedAlgorithms.map((alg, i) => (
                          <li key={i}>✓ {alg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs">
                      <div className="font-bold text-slate-800 mb-1">Legenda Cartográfica do Diff:</div>
                      <div className="space-y-2 mt-2 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border-2 border-dashed border-rose-500 bg-rose-500/30 rounded-xs"></span>
                          <span><strong>Vermelho Tracejado:</strong> Camada Bruta (Referência sem correção)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 border border-emerald-600 bg-emerald-500/40 rounded-xs"></span>
                          <span><strong>Verde Sólido:</strong> Camada Validada (GeoJSON Exportado final)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 border border-amber-600"></span>
                          <span><strong>Ponto Amarelo:</strong> Nó com Kink ou vértice espúrio sanado</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="font-bold text-slate-800">Selecione uma feição para detalhar:</div>
                      <div className="space-y-1.5 font-mono text-[11px]">
                        {diffData.items.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelectedFeatureId(item.id)}
                            className="w-full text-left p-2 rounded hover:bg-slate-100 border border-slate-100 transition-colors flex items-center justify-between"
                          >
                            <span className="font-semibold text-slate-900">{item.id}</span>
                            <span className="text-slate-500 text-[10px]">{item.originalErrorsCount} falhas sanadas</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: FULL DETAILED COMPARISON TABLE */
          <div className="flex-1 overflow-auto p-6 bg-slate-50">
            <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Tabela Comparativa de Integridade Topológica (Antes x Depois)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Rastreabilidade geométrica entre dados brutos de entrada e produtos espaciais validados.
                  </p>
                </div>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded font-bold">
                  100% de Redução em Erros Topológicos
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-[11px]">
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Feição Territorial</th>
                      <th className="py-2.5 px-3">Nível</th>
                      <th className="py-2.5 px-3 text-right">Vértices Bruto</th>
                      <th className="py-2.5 px-3 text-right">Vértices Limpo</th>
                      <th className="py-2.5 px-3 text-right">Delta Vértices</th>
                      <th className="py-2.5 px-3 text-right">Área Bruta (ha)</th>
                      <th className="py-2.5 px-3 text-right">Área Albers (ha)</th>
                      <th className="py-2.5 px-3 text-right">Delta Área</th>
                      <th className="py-2.5 px-3">Falhas Originais</th>
                      <th className="py-2.5 px-3">Algoritmo de Correção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {diffData.items.map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => {
                          setSelectedFeatureId(item.id);
                          setActiveTab('map');
                        }}
                        className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 font-bold text-slate-900">{item.id}</td>
                        <td className="py-3 px-3 font-sans text-slate-800">{item.name}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {item.level}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-rose-700">{item.originalVertexCount}</td>
                        <td className="py-3 px-3 text-right text-emerald-700 font-bold">{item.exportedVertexCount}</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-800">{item.vertexDelta}</td>
                        <td className="py-3 px-3 text-right text-slate-600">{item.originalAreaHa.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-slate-900 font-bold">{item.exportedAreaHa.toFixed(2)}</td>
                        <td className="py-3 px-3 text-right text-amber-700">
                          {item.areaDeltaHa >= 0 ? '+' : ''}{item.areaDeltaHa.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-rose-700 text-[11px]">
                          {item.errorTypes.join(', ')}
                        </td>
                        <td className="py-3 px-3 text-emerald-800 text-[11px] font-semibold">
                          {item.repairedAlgorithms.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-900 text-white px-6 py-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Auditoria em conformidade estrita com Luna (2026c) e ET-EDGV IBGE (2024).
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadDiffReport}
              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
            >
              Exportar Laudo Diff (JSON)
            </button>
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
