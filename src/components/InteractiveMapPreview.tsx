import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  MapPin,
  Info,
  ShieldCheck,
  Eye,
  EyeOff,
  BarChart3,
  Globe,
  Sliders,
  Sparkles,
  Compass,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { ProjectMetadata, AuditRecord } from '../types/workflow';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  APA_ARARIPE_POLYGON_COORDS,
  MUNICIPIO_CRATO_COORDS,
  MUNICIPIO_BARBALHA_COORDS,
  MUNICIPIO_SANTANA_CARIRI_COORDS,
  BUFFER_10KM_COORDS,
  ALERTA_809_COORDS,
  ALERTA_114_COORDS,
  ALERTA_162_COORDS,
  ALERTA_205_COORDS
} from '../services/spatialExportService';

export interface BasemapOption {
  id: string;
  name: string;
  shortLabel: string;
  icon: string;
  category: 'google' | 'dark' | 'terrain' | 'osm';
  url: string;
  attribution: string;
  maxZoom: number;
  description: string;
  badge?: string;
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'google_hybrid',
    name: 'Google Satellite (Híbrido)',
    shortLabel: 'Google Satélite',
    icon: '🛰️',
    category: 'google',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps / Google Earth',
    maxZoom: 20,
    description: 'Imagens orbitais de alta resolução com rotulagem de vias, cidades e divisas.',
    badge: 'Padrão'
  },
  {
    id: 'google_satellite',
    name: 'Google Satellite (Puro)',
    shortLabel: 'Satélite Puro',
    icon: '🌍',
    category: 'google',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps / Google Earth',
    maxZoom: 20,
    description: 'Foto de satélite pura sem rótulos sobrepostos, excelente para inspeção de dossel florestal.'
  },
  {
    id: 'google_terrain',
    name: 'Google Terreno (Topografia)',
    shortLabel: 'Terreno',
    icon: '⛰️',
    category: 'terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    description: 'Curvas de nível sombreadas e relevo da cuesta tabular da Chapada do Araripe.'
  },
  {
    id: 'google_streets',
    name: 'Google Maps (Ruas)',
    shortLabel: 'Google Ruas',
    icon: '🗺️',
    category: 'google',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    maxZoom: 20,
    description: 'Cartografia vetorial com rodovias, sedes municipais e hidrografia.'
  },
  {
    id: 'dark_mode',
    name: 'Modo Noturno (Dark High-Contrast)',
    shortLabel: 'Dark Mode',
    icon: '🌙',
    category: 'dark',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin, OpenStreetMap',
    maxZoom: 16,
    description: 'Tema escuro de alto contraste para realce visual dos polígonos de alerta.',
    badge: 'Contraste'
  },
  {
    id: 'osm',
    name: 'OpenStreetMap Standard',
    shortLabel: 'OpenStreetMap',
    icon: '🌐',
    category: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    description: 'Base cartográfica colaborativa livre e aberta.'
  }
];

export interface PolygonAlert {
  id: string;
  name: string;
  areaHa: number;
  condition: 'Totalmente Dentro' | 'Parcialmente Dentro' | 'Totalmente Fora';
  intersectionHa: number;
  outsideHa: number;
  detectionDate: string;
  referencePoint: string;
  center: [number, number]; // [lat, lng]
  rawRings: number[][][]; // [ [ [lng, lat], ... ] ]
}

const SAMPLE_ALERTS: PolygonAlert[] = [
  {
    id: 'ALT-2024-089',
    name: 'Alerta Encosta da Chapada (Crato)',
    areaHa: 142.85,
    condition: 'Totalmente Dentro',
    intersectionHa: 142.85,
    outsideHa: 0.0,
    detectionDate: '14/03/2024',
    referencePoint: 'Encosta da FLONA Araripe, nascente do Rio Batateiras',
    center: [-7.234, -39.412],
    rawRings: ALERTA_809_COORDS
  },
  {
    id: 'ALT-2024-114',
    name: 'Alerta Borda da Chapada (Santana do Cariri)',
    areaHa: 284.10,
    condition: 'Parcialmente Dentro',
    intersectionHa: 198.40,
    outsideHa: 85.70,
    detectionDate: '28/04/2024',
    referencePoint: 'Rodovia CE-292, zona de transição e amortecimento da APA',
    center: [-7.182, -39.712],
    rawRings: ALERTA_114_COORDS
  },
  {
    id: 'ALT-2024-162',
    name: 'Alerta Polo Agrícola Sul',
    areaHa: 95.30,
    condition: 'Totalmente Fora',
    intersectionHa: 0.0,
    outsideHa: 95.30,
    detectionDate: '10/06/2024',
    referencePoint: 'Adjacência ao Vale do Cariri / Baixio',
    center: [-7.340, -39.325],
    rawRings: ALERTA_162_COORDS
  },
  {
    id: 'ALT-2024-205',
    name: 'Alerta Encosta do Caldas (Barbalha)',
    areaHa: 73.45,
    condition: 'Totalmente Dentro',
    intersectionHa: 73.45,
    outsideHa: 0.0,
    detectionDate: '03/08/2024',
    referencePoint: 'Área de recarga do Aquífero Missão Velha / Encosta Araripe',
    center: [-7.302, -39.338],
    rawRings: ALERTA_205_COORDS
  }
];

// Helper to convert GeoJSON rings [[lng, lat]] to Leaflet [[lat, lng]]
function geoJsonRingsToLeaflet(rings: number[][][]): [number, number][][] {
  return rings.map((ring) => ring.map(([lng, lat]) => [lat, lng]));
}

// Map Controller for smooth flyTo animations without reloading map
function MapCameraController({
  level,
  selectedAlert
}: {
  level: 'regional' | 'local' | 'detalhe';
  selectedAlert: PolygonAlert | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (level === 'regional') {
      map.flyTo([-7.35, -39.72], 9, { duration: 1.2 });
    } else if (level === 'local') {
      map.flyTo([-7.23, -39.41], 11, { duration: 1.2 });
    } else if (level === 'detalhe') {
      if (selectedAlert) {
        map.flyTo(selectedAlert.center, 13.5, { duration: 1.2 });
      } else {
        map.flyTo([-7.234, -39.412], 13.5, { duration: 1.2 });
      }
    }
  }, [level, selectedAlert, map]);

  return null;
}

interface InteractiveMapPreviewProps {
  project?: ProjectMetadata;
  auditRecords?: AuditRecord[];
  onPublishHtml?: () => void;
}

export const InteractiveMapPreview: React.FC<InteractiveMapPreviewProps> = ({
  project,
  auditRecords,
  onPublishHtml
}) => {
  const [level, setLevel] = useState<'regional' | 'local' | 'detalhe'>('detalhe');
  const [selectedBasemapId, setSelectedBasemapId] = useState<string>('google_hybrid');
  const [showRegionalLayer, setShowRegionalLayer] = useState(true);
  const [showLocalLayer, setShowLocalLayer] = useState(true);
  const [showDetailLayer, setShowDetailLayer] = useState(true);
  const [showBufferLayer, setShowBufferLayer] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<PolygonAlert | null>(SAMPLE_ALERTS[0]);
  const [showDataTable, setShowDataTable] = useState(false);
  const [isBasemapDropdownOpen, setIsBasemapDropdownOpen] = useState(false);

  // Active basemap object
  const activeBasemap = useMemo(() => {
    return (
      BASEMAP_OPTIONS.find((b) => b.id === selectedBasemapId) || BASEMAP_OPTIONS[0]
    );
  }, [selectedBasemapId]);

  // Leaflet polygon positions
  const apaPositions = useMemo(() => geoJsonRingsToLeaflet(APA_ARARIPE_POLYGON_COORDS), []);
  const cratoPositions = useMemo(() => geoJsonRingsToLeaflet(MUNICIPIO_CRATO_COORDS), []);
  const barbalhaPositions = useMemo(() => geoJsonRingsToLeaflet(MUNICIPIO_BARBALHA_COORDS), []);
  const santanaPositions = useMemo(() => geoJsonRingsToLeaflet(MUNICIPIO_SANTANA_CARIRI_COORDS), []);
  const bufferPositions = useMemo(() => geoJsonRingsToLeaflet(BUFFER_10KM_COORDS), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Editorial Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
              <span>PRODUTO DO FLUXO JORNALÍSTICO (ETAPAS 4.1 A 4.6)</span>
              <span>·</span>
              <span className="text-emerald-700 font-bold">BASEMAP ATIVO: {activeBasemap.name}</span>
              <span>·</span>
              <span>SCR EPSG:3857 / WGS84</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Mapa Narrativo Interativo: Territorialidade em Três Níveis
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Visualização interativa das camadas vetoriais analisadas com base orbital do Google Satellite e alternância dinâmica de basemaps sem recarregar o mapa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Level Switcher Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
              <button
                onClick={() => setLevel('regional')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  level === 'regional'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Regional
              </button>
              <button
                onClick={() => setLevel('local')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  level === 'local'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                2. Local
              </button>
              <button
                onClick={() => setLevel('detalhe')}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
                  level === 'detalhe'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3. Detalhe
              </button>
            </div>

            {/* Primary Action Button: Publish Webmap in HTML */}
            {onPublishHtml && (
              <button
                type="button"
                onClick={onPublishHtml}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                title="Publicar e exportar o mapa narrativo completo em arquivo HTML autônomo com Leaflet"
              >
                <Globe className="w-4 h-4 text-emerald-200" />
                <span>Publicar Mapa em HTML</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Map Canvas and Editorial Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Interactive Map Canvas */}
        <div className="lg:col-span-2 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative shadow-lg flex flex-col h-[540px]">
          {/* Top Canvas Left HUD: Level & CRS Indicator */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-md text-slate-200 text-xs font-mono shadow-md flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-semibold">
                {level === 'regional'
                  ? 'Nível 1: Regional (1:500.000)'
                  : level === 'local'
                  ? 'Nível 2: Local / Município (1:100.000)'
                  : 'Nível 3: Detalhe / Ocorrência (1:25.000)'}
              </span>
            </div>
          </div>

          {/* Top Canvas Right HUD: Visual Basemap Switcher & Layer Controls */}
          <div className="absolute top-3 right-3 z-[1000] flex items-start gap-2 pointer-events-auto">
            {/* Visual Basemap Selector Button & Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBasemapDropdownOpen(!isBasemapDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 hover:bg-slate-850 backdrop-blur-md border border-slate-700 hover:border-slate-600 rounded-md text-slate-200 text-xs font-mono shadow-md transition-all cursor-pointer"
                title="Alternar camada base do mapa (Google Satellite, Google Maps, Dark Mode, etc.)"
              >
                <span className="text-sm">{activeBasemap.icon}</span>
                <span className="font-bold">{activeBasemap.shortLabel}</span>
                <Sliders className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </button>

              {/* Dynamic Basemap Picker Dropdown Menu */}
              {isBasemapDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl p-2 z-[1010] animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-slate-800 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                    <span>Selecionar Basemap:</span>
                    <span className="text-[10px] text-emerald-400">Sem API Key</span>
                  </div>

                  <div className="space-y-1">
                    {BASEMAP_OPTIONS.map((basemap) => {
                      const isSelected = selectedBasemapId === basemap.id;
                      return (
                        <button
                          key={basemap.id}
                          type="button"
                          onClick={() => {
                            setSelectedBasemapId(basemap.id);
                            setIsBasemapDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-md transition-all flex items-start gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-950/80 border border-emerald-600/60 text-white'
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white border border-transparent'
                          }`}
                        >
                          <span className="text-base shrink-0 mt-0.5">{basemap.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-xs font-bold truncate">{basemap.name}</span>
                              {basemap.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-emerald-800/80 text-emerald-200 font-semibold">
                                  {basemap.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-tight line-clamp-2">
                              {basemap.description}
                            </p>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Layer Visibility Controls HUD */}
            <div className="flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-2 rounded-md border border-slate-700 text-xs font-mono text-slate-300 shadow-md">
              <span className="text-[10px] uppercase text-slate-400 font-bold mb-0.5">Camadas:</span>

              <button
                type="button"
                onClick={() => setShowRegionalLayer(!showRegionalLayer)}
                className="flex items-center gap-2 hover:text-white transition-colors text-left cursor-pointer"
              >
                {showRegionalLayer ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={showRegionalLayer ? 'text-slate-200' : 'text-slate-500 line-through'}>
                  1. APA Araripe (Regional)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowLocalLayer(!showLocalLayer)}
                className="flex items-center gap-2 hover:text-white transition-colors text-left cursor-pointer"
              >
                {showLocalLayer ? (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={showLocalLayer ? 'text-slate-200' : 'text-slate-500 line-through'}>
                  2. Municípios (Local)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailLayer(!showDetailLayer)}
                className="flex items-center gap-2 hover:text-white transition-colors text-left cursor-pointer"
              >
                {showDetailLayer ? (
                  <Eye className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={showDetailLayer ? 'text-slate-200' : 'text-slate-500 line-through'}>
                  3. Alertas (Detalhe)
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowBufferLayer(!showBufferLayer)}
                className="flex items-center gap-2 hover:text-white transition-colors text-left cursor-pointer"
              >
                {showBufferLayer ? (
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span className={showBufferLayer ? 'text-purple-300' : 'text-slate-500 line-through'}>
                  Buffer 10 km (Analítico)
                </span>
              </button>
            </div>
          </div>

          {/* Quick Basemap Chips Bar (Bottom Left of Canvas) */}
          <div className="absolute bottom-12 left-3 z-[1000] flex items-center gap-1.5 p-1 bg-slate-900/85 backdrop-blur-md rounded-lg border border-slate-700/80 shadow-md pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400 font-bold px-1 hidden sm:inline">
              Basemaps:
            </span>
            {BASEMAP_OPTIONS.slice(0, 4).map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBasemapId(b.id)}
                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1 cursor-pointer ${
                  selectedBasemapId === b.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
                title={b.description}
              >
                <span>{b.icon}</span>
                <span>{b.shortLabel}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setSelectedBasemapId('dark_mode')}
              className={`px-2 py-1 text-[11px] font-mono rounded transition-colors flex items-center gap-1 cursor-pointer ${
                selectedBasemapId === 'dark_mode'
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Modo Noturno (Alto Contraste)"
            >
              <span>🌙</span>
              <span>Dark</span>
            </button>
          </div>

          {/* Real Leaflet Map Container */}
          <div className="flex-1 w-full h-full relative z-0">
            <MapContainer
              center={[-7.234, -39.412]}
              zoom={12}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', background: '#090d16' }}
            >
              {/* Dynamic TileLayer with Instant Switching Without Reloading */}
              <TileLayer
                key={selectedBasemapId}
                url={activeBasemap.url}
                attribution={activeBasemap.attribution}
                maxZoom={activeBasemap.maxZoom}
              />

              {/* Camera controller component */}
              <MapCameraController level={level} selectedAlert={selectedAlert} />

              {/* LAYER 1: REGIONAL (APA Chapada do Araripe) */}
              {showRegionalLayer && (
                <Polygon
                  positions={apaPositions}
                  pathOptions={{
                    color: '#10b981',
                    weight: 2.5,
                    dashArray: '6, 5',
                    fillColor: '#10b981',
                    fillOpacity: 0.14
                  }}
                >
                  <Tooltip sticky direction="top" opacity={0.95}>
                    <div className="font-mono text-xs">
                      <strong className="text-emerald-800 block">APA Chapada do Araripe (Regional)</strong>
                      <span>Área Oficial: 1.063.000 ha · ICMBio</span>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="font-sans text-xs space-y-1">
                      <div className="font-bold text-emerald-900">Poligonal APA Chapada do Araripe</div>
                      <div className="text-slate-600 text-[11px]">Unidade de Conservação Federal de Uso Sustentável</div>
                      <div className="font-mono text-[11px] text-slate-800">Área: 1.063.000 ha</div>
                      <div className="text-[10px] text-slate-500">Estados: CE / PE / PI · Bioma: Caatinga / Encosta Úmida</div>
                    </div>
                  </Popup>
                </Polygon>
              )}

              {/* BUFFER 10 KM LAYER */}
              {showBufferLayer && (
                <Polygon
                  positions={bufferPositions}
                  pathOptions={{
                    color: '#8b5cf6',
                    weight: 1.8,
                    dashArray: '4, 4',
                    fillColor: '#a855f7',
                    fillOpacity: 0.08
                  }}
                >
                  <Tooltip sticky direction="top">
                    <span className="font-mono text-xs text-purple-900 font-bold">
                      Zona de Amortecimento da APA (Buffer 10 km)
                    </span>
                  </Tooltip>
                </Polygon>
              )}

              {/* LAYER 2: LOCAL (Municípios do Crato, Barbalha, Santana do Cariri) */}
              {showLocalLayer && (
                <>
                  <Polygon
                    positions={cratoPositions}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 2,
                      fillColor: '#3b82f6',
                      fillOpacity: 0.16
                    }}
                  >
                    <Tooltip sticky direction="top">
                      <div className="font-mono text-xs">
                        <strong className="text-blue-800">Crato (CE) - 100.920 ha</strong>
                        <div className="text-[10px]">Geocódigo IBGE: 2304202</div>
                      </div>
                    </Tooltip>
                  </Polygon>

                  <Polygon
                    positions={barbalhaPositions}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 1.8,
                      fillColor: '#60a5fa',
                      fillOpacity: 0.12
                    }}
                  >
                    <Tooltip sticky direction="top">
                      <div className="font-mono text-xs">
                        <strong className="text-blue-800">Barbalha (CE) - 56.950 ha</strong>
                        <div className="text-[10px]">Geocódigo IBGE: 2301901</div>
                      </div>
                    </Tooltip>
                  </Polygon>

                  <Polygon
                    positions={santanaPositions}
                    pathOptions={{
                      color: '#3b82f6',
                      weight: 1.8,
                      fillColor: '#60a5fa',
                      fillOpacity: 0.12
                    }}
                  >
                    <Tooltip sticky direction="top">
                      <div className="font-mono text-xs">
                        <strong className="text-blue-800">Santana do Cariri (CE) - 76.880 ha</strong>
                        <div className="text-[10px]">Geocódigo IBGE: 2312205</div>
                      </div>
                    </Tooltip>
                  </Polygon>

                  {/* Sede Urbana do Crato */}
                  <CircleMarker
                    center={[-7.234, -39.412]}
                    radius={5}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: '#2563eb',
                      fillOpacity: 0.9,
                      weight: 2
                    }}
                  >
                    <Tooltip direction="bottom" permanent={false}>
                      <span className="font-mono text-xs font-bold">Sede Urbana do Crato</span>
                    </Tooltip>
                  </CircleMarker>
                </>
              )}

              {/* LAYER 3: DETALHE (Polígonos de Alertas de Supressão) */}
              {showDetailLayer &&
                SAMPLE_ALERTS.map((alert) => {
                  const isSelected = selectedAlert?.id === alert.id;
                  const alertPositions = geoJsonRingsToLeaflet(alert.rawRings);
                  const color =
                    alert.condition === 'Totalmente Dentro'
                      ? '#ef4444'
                      : alert.condition === 'Parcialmente Dentro'
                      ? '#f59e0b'
                      : '#3b82f6';

                  return (
                    <React.Fragment key={alert.id}>
                      <Polygon
                        positions={alertPositions}
                        eventHandlers={{
                          click: () => setSelectedAlert(alert)
                        }}
                        pathOptions={{
                          color: isSelected ? '#ffffff' : color,
                          weight: isSelected ? 3.5 : 2.2,
                          fillColor: color,
                          fillOpacity: isSelected ? 0.6 : 0.4
                        }}
                      >
                        <Tooltip sticky direction="top" opacity={0.95}>
                          <div className="font-mono text-xs">
                            <strong className="block text-slate-900">{alert.id} ({alert.areaHa.toFixed(1)} ha)</strong>
                            <span className="text-[11px] font-semibold" style={{ color }}>{alert.condition}</span>
                          </div>
                        </Tooltip>
                        <Popup>
                          <div className="font-sans text-xs space-y-1">
                            <div className="font-bold text-slate-900">{alert.name}</div>
                            <div className="font-mono text-[11px] text-slate-700">Código: {alert.id}</div>
                            <div className="font-mono text-[11px] text-slate-700">Área Total: {alert.areaHa.toFixed(2)} ha</div>
                            <div className="font-mono text-[11px] text-rose-700 font-bold">
                              Sobreposição APA: {alert.intersectionHa.toFixed(2)} ha
                            </div>
                            <div className="text-[10px] text-slate-500">Data: {alert.detectionDate}</div>
                            <div className="text-[10px] text-slate-500">Ref: {alert.referencePoint}</div>
                          </div>
                        </Popup>
                      </Polygon>

                      {/* Beacon Marker for Selected Alert */}
                      {isSelected && (
                        <CircleMarker
                          center={alert.center}
                          radius={10}
                          pathOptions={{
                            color: '#ffffff',
                            fillColor: color,
                            fillOpacity: 0.85,
                            weight: 2
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
            </MapContainer>
          </div>

          {/* Bottom HUD Legend */}
          <div className="p-3 bg-slate-950/95 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 z-10">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-b-2 border-emerald-400 border-dashed"></span>
                <span>Nível 1: Regional (APA)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500"></span>
                <span>Nível 2: Local (Município)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Nível 3: Detalhe (Alertas)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="text-xs">🛰️</span>
                <span>Basemap: {activeBasemap.name}</span>
              </span>
            </div>

            <div className="text-[11px] text-slate-400">
              Clique em qualquer polígono no mapa para inspecionar os cálculos em Albers.
            </div>
          </div>
        </div>

        {/* Narrative & Inspection Editorial Panel */}
        <div className="space-y-4">
          {/* Territorial Narrative Chapter */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-xs font-mono text-slate-500">
              <Info className="w-4 h-4 text-blue-600" />
              <span>NARRATIVA JORNALÍSTICA INTERATIVA</span>
            </div>

            {level === 'regional' && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Capítulo 1: O Território Regional em Pressão
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A Área de Proteção Ambiental (APA) Chapada do Araripe abrange mais de 1 milhão
                  de hectares (1.063.000 ha) entre os estados do Ceará, Pernambuco e Piauí. O mapa regional contextualiza os
                  corredores ecológicos da Caatinga e Mata Úmida de encosta, e a pressão sobre as nascentes do Cariri.
                </p>
              </div>
            )}

            {level === 'local' && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Capítulo 2: O Recorte Municipal do Crato e Vale do Cariri
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ao aproximar o olhar para o município do Crato e cidades vizinhas (Barbalha e Santana do Cariri),
                  observa-se a relação direta entre o relevo da cuesta tabular da Chapada e as zonas urbanas e agrícolas.
                  A fiscalização e o controle ambiental preservam o Aquífero Missão Velha e a FLONA do Araripe.
                </p>
              </div>
            )}

            {level === 'detalhe' && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Capítulo 3: A Ocorrência Pontual e a Territorialidade
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No nível de detalhe, os polígonos de alerta revelam os focos de supressão vegetal
                  em relação a marcos físicos conhecidos (estradas, sedes e bacias hidrográficas). O
                  leitor reconhece a localização exata do fato com precisão cartográfica.
                </p>
              </div>
            )}
          </div>

          {/* Detailed Selected Polygon Data Card */}
          {selectedAlert ? (
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-slate-800">
                  {selectedAlert.id}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${
                    selectedAlert.condition === 'Totalmente Dentro'
                      ? 'bg-rose-100 text-rose-800'
                      : selectedAlert.condition === 'Parcialmente Dentro'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {selectedAlert.condition}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900">
                {selectedAlert.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                Ponto de Referência: {selectedAlert.referencePoint}
              </p>

              {/* Mathematical Area Breakdown */}
              <div className="mt-4 p-3 bg-slate-50 rounded border border-slate-200 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Área Total Calculada (Albers):</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {selectedAlert.areaHa.toFixed(2)} ha
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Interseção com a APA (SF_int):</span>
                  <span className="font-bold text-rose-700 tabular-nums">
                    {selectedAlert.intersectionHa.toFixed(2)} ha (
                    {((selectedAlert.intersectionHa / selectedAlert.areaHa) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Diferença Espacial (Fora):</span>
                  <span className="font-bold text-slate-700 tabular-nums">
                    {selectedAlert.outsideHa.toFixed(2)} ha (
                    {((selectedAlert.outsideHa / selectedAlert.areaHa) * 100).toFixed(1)}%)
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Data de Detecção: {selectedAlert.detectionDate}</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Validado no SIG
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-500 text-center">
              Selecione um polígono no mapa para visualizar a apuração detalhada.
            </div>
          )}

          {/* Toggle Data Table Button */}
          <button
            onClick={() => setShowDataTable(!showDataTable)}
            className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>{showDataTable ? 'Ocultar' : 'Ver'} Tabela Analítica dos Cálculos Espaciais</span>
          </button>
        </div>
      </div>

      {/* Expanded Calculations Table */}
      {showDataTable && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Tabela Consolidada de Cálculos de Área e Relações Condicionais
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Projeção: SIRGAS 2000 - Brasil Albers (Padrão IBGE)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 px-3">Código Alerta</th>
                  <th className="py-2 px-3">Identificação</th>
                  <th className="py-2 px-3 text-right">Área Total (ha)</th>
                  <th className="py-2 px-3 text-right">Interseção APA (ha)</th>
                  <th className="py-2 px-3 text-right">Área Fora (ha)</th>
                  <th className="py-2 px-3">Relação Condicional</th>
                  <th className="py-2 px-3">Ponto de Referência Local</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {SAMPLE_ALERTS.map((alert) => (
                  <tr
                    key={alert.id}
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{alert.id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800">{alert.name}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{alert.areaHa.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-rose-700 font-semibold">
                      {alert.intersectionHa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-600">
                      {alert.outsideHa.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          alert.condition === 'Totalmente Dentro'
                            ? 'bg-rose-100 text-rose-800'
                            : alert.condition === 'Parcialmente Dentro'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {alert.condition}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-slate-500 font-sans">
                      {alert.referencePoint}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
