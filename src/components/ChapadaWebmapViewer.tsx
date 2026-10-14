import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  CHAPADA_METADATA,
  CHAPADA_RANKING,
  CHAPADA_SERIES,
  APA_POLYGON_GEOJSON,
  MUNICIPIOS_GEOJSON,
  CURATED_ALERTS_GEOJSON,
  getMapBiomasAlertUrl,
  getMapBiomasBeforeImageUrl,
  getMapBiomasAfterImageUrl,
  SENTINEL2_CLOUDLESS_XYZ,
  SENTINEL2_ATTRIBUTION,
  MunicipioRankingItem,
  AlertProperties
} from '../data/chapadaStoryData';
import {
  Globe,
  Layers,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Sliders,
  Eye,
  EyeOff,
  Maximize2,
  Share2,
  Download,
  Terminal,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  FileText,
  ShieldCheck,
  CheckCircle2,
  RotateCcw
} from 'lucide-react';

interface ChapadaWebmapViewerProps {
  onPublishHtml?: () => void;
  className?: string;
}

// Controller component to smoothly fly/fit map bounds
const MapViewController: React.FC<{
  targetBounds: L.LatLngBoundsExpression | null;
  targetCenter?: [number, number] | null;
  zoom?: number;
}> = ({ targetBounds, targetCenter, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (targetBounds) {
      map.fitBounds(targetBounds, {
        padding: [30, 30],
        maxZoom: zoom || 13,
        animate: true,
        duration: 0.8
      });
    } else if (targetCenter && zoom) {
      map.setView(targetCenter, zoom, {
        animate: true,
        duration: 0.8
      });
    }
  }, [map, targetBounds, targetCenter, zoom]);

  return null;
};

// Initial APA view
const INITIAL_CENTER: [number, number] = [-7.35, -39.65];
const INITIAL_ZOOM = 9;

export const ChapadaWebmapViewer: React.FC<ChapadaWebmapViewerProps> = ({
  onPublishHtml,
  className = ''
}) => {
  // Navigation Levels: 1 = Regional APA, 2 = Selected Municipality, 3 = Selected MapBiomas Alert
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<AlertProperties | null>(null);
  const [hoveredMunicipio, setHoveredMunicipio] = useState<string | null>(null);

  // Basemap selection
  const [activeBasemap, setActiveBasemap] = useState<'sentinel2' | 'google' | 'esri' | 'dark'>('sentinel2');
  const [showPanels, setShowPanels] = useState<boolean>(true);
  const [showAlertsInLevel1, setShowAlertsInLevel1] = useState<boolean>(false);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  // Animation / camera targets
  const [cameraBounds, setCameraBounds] = useState<L.LatLngBoundsExpression | null>(null);
  const [cameraCenter, setCameraCenter] = useState<[number, number] | null>(INITIAL_CENTER);
  const [cameraZoom, setCameraZoom] = useState<number>(INITIAL_ZOOM);

  // Statistics for selected municipality
  const selectedMunicipioStats = useMemo(() => {
    if (!selectedMunicipio) return null;
    const rankingItem = CHAPADA_RANKING.find((r) => r.municipio === selectedMunicipio);
    const seriesObj = CHAPADA_SERIES[selectedMunicipio];
    const years = seriesObj?.years || [];

    const totalArea = rankingItem?.total_area_ha || 0;
    const totalAlerts = rankingItem?.total_alertas || 0;

    const stat2024 = years.find((y) => y.ano === 2024);
    const stat2025 = years.find((y) => y.ano === 2025);
    const area2024 = stat2024?.area_ha || 0;
    const area2025 = stat2025?.area_ha || 0;
    const deltaHa = area2025 - area2024;
    const deltaPct = area2024 === 0 ? (area2025 === 0 ? 0 : 100) : (Math.abs(deltaHa) / area2024) * 100;
    const trend = deltaHa > 0 ? 'increase' : deltaHa < 0 ? 'decrease' : 'stable';

    // Alerts within this municipality in curated dataset
    const alertsInMun = CURATED_ALERTS_GEOJSON.features.filter(
      (f: any) => f.properties.MUNICIPIO === selectedMunicipio
    );

    return {
      rankingItem,
      years,
      totalArea,
      totalAlerts,
      area2024,
      area2025,
      deltaHa,
      deltaPct,
      trend,
      alertsCount: alertsInMun.length,
      alerts: alertsInMun
    };
  }, [selectedMunicipio]);

  // Navigate back to Level 1
  const handleResetToLevel1 = () => {
    setLevel(1);
    setSelectedMunicipio(null);
    setSelectedAlert(null);
    setCameraBounds(null);
    setCameraCenter(INITIAL_CENTER);
    setCameraZoom(INITIAL_ZOOM);
  };

  // Select a municipality (Level 2)
  const handleSelectMunicipio = (munName: string) => {
    setSelectedMunicipio(munName);
    setSelectedAlert(null);
    setLevel(2);

    // Find feature geometry to calculate bounding box
    const feat = MUNICIPIOS_GEOJSON.features.find((f: any) => f.properties.NM_MUN === munName);
    if (feat) {
      const geoLayer = L.geoJSON(feat);
      setCameraBounds(geoLayer.getBounds());
    }
  };

  // Select an alert (Level 3)
  const handleSelectAlert = (alertProps: AlertProperties, featGeometry?: any) => {
    setSelectedAlert(alertProps);
    setLevel(3);

    if (featGeometry) {
      const geoLayer = L.geoJSON(featGeometry);
      setCameraBounds(geoLayer.getBounds());
    }
  };

  // Style generators for Leaflet GeoJSON
  const apaStyle = () => ({
    color: '#ebb46b', // Ocre dourado oficial APA
    weight: 2.5,
    opacity: 0.95,
    fillColor: '#ebb46b',
    fillOpacity: 0.08,
    dashArray: undefined
  });

  const getMunicipioStyle = (feature: any) => {
    const isSelected = selectedMunicipio === feature.properties.NM_MUN;
    const isHovered = hoveredMunicipio === feature.properties.NM_MUN;

    return {
      color: isSelected ? '#ffffff' : isHovered ? '#fef08a' : 'rgba(255, 255, 255, 0.75)',
      weight: isSelected ? 3 : isHovered ? 2.5 : 1.2,
      dashArray: isSelected ? undefined : '5, 5',
      fillColor: isSelected ? '#ebb46b' : isHovered ? '#ffffff' : '#000000',
      fillOpacity: isSelected ? 0.25 : isHovered ? 0.15 : 0.02
    };
  };

  const getAlertStyle = (feature: any) => {
    const props: AlertProperties = feature.properties;
    const isSelected = selectedAlert?.CODEALERTA === props.CODEALERTA;
    const isInsideApa = Boolean(props.INSIDE_APA);

    if (isInsideApa) {
      return {
        color: isSelected ? '#ffffff' : '#e7352a', // Rubro MapBiomas
        weight: isSelected ? 3 : 1.5,
        fillColor: '#e7352a',
        fillOpacity: isSelected ? 0.85 : 0.55
      };
    } else {
      return {
        color: isSelected ? '#ffffff' : '#1976d2', // Azul fora da APA
        weight: isSelected ? 3 : 1.5,
        fillColor: '#1976d2',
        fillOpacity: isSelected ? 0.8 : 0.45
      };
    }
  };

  // Filtered alerts
  const visibleAlertsGeoJson = useMemo(() => {
    let feats = CURATED_ALERTS_GEOJSON.features;

    // In Level 2, only show alerts of the selected municipality
    if (level === 2 && selectedMunicipio) {
      feats = feats.filter((f: any) => f.properties.MUNICIPIO === selectedMunicipio);
    } else if (level === 3 && selectedAlert) {
      feats = feats.filter((f: any) => f.properties.CODEALERTA === selectedAlert.CODEALERTA);
    } else if (level === 1 && !showAlertsInLevel1) {
      // In level 1 by default, alerts are hidden unless user toggles them
      return { type: 'FeatureCollection', features: [] };
    }

    if (filterYear !== 'all') {
      feats = feats.filter((f: any) => Number(f.properties.ANODETEC) === filterYear);
    }

    return {
      type: 'FeatureCollection',
      features: feats
    };
  }, [level, selectedMunicipio, selectedAlert, showAlertsInLevel1, filterYear]);

  // Max value for ranking bars
  const maxRankingHa = useMemo(() => {
    return Math.max(1, ...CHAPADA_RANKING.map((r) => r.total_area_ha || 0));
  }, []);

  return (
    <div className={`relative w-full h-[750px] min-h-[600px] bg-[#1a2014] rounded-xl overflow-hidden border border-slate-700/60 shadow-2xl flex flex-col font-sans ${className}`}>
      {/* Top Embedded Control Strip */}
      <div className="absolute top-3 left-3 z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Navigation Breadcrumb Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#171e11]/85 backdrop-blur-md border border-white/20 rounded-lg text-xs font-mono text-white shadow-lg">
          <span
            onClick={handleResetToLevel1}
            className="cursor-pointer hover:text-amber-300 font-bold flex items-center gap-1 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            APA Araripe (Nível 1)
          </span>

          {level >= 2 && selectedMunicipio && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span
                onClick={() => {
                  setLevel(2);
                  setSelectedAlert(null);
                }}
                className={`cursor-pointer transition-colors ${
                  level === 2 ? 'text-amber-300 font-bold' : 'hover:text-amber-200 text-slate-300'
                }`}
              >
                {selectedMunicipio} (Nível 2)
              </span>
            </>
          )}

          {level === 3 && selectedAlert && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-red-400 font-bold">
                Alerta #{selectedAlert.CODEALERTA} (Nível 3)
              </span>
            </>
          )}
        </div>

        {/* Basemap Selector */}
        <div className="flex items-center bg-[#171e11]/85 backdrop-blur-md border border-white/20 rounded-lg p-0.5 text-[11px] font-mono text-white shadow-lg">
          <button
            type="button"
            onClick={() => setActiveBasemap('sentinel2')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              activeBasemap === 'sentinel2'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Sentinel-2 Cloudless 2025 (EOX) - Basemap padrão de alta resolução"
          >
            <span>🛰️ Sentinel-2 (2025)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveBasemap('google')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'google'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Google Satellite Hybrid"
          >
            Google Satélite
          </button>
          <button
            type="button"
            onClick={() => setActiveBasemap('esri')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'esri'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Esri World Imagery"
          >
            Esri
          </button>
          <button
            type="button"
            onClick={() => setActiveBasemap('dark')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeBasemap === 'dark'
                ? 'bg-emerald-700 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
            title="Dark Carto (Alto Contraste)"
          >
            Dark Mode
          </button>
        </div>

        {/* Toggle Alerts in Level 1 */}
        {level === 1 && (
          <button
            type="button"
            onClick={() => setShowAlertsInLevel1(!showAlertsInLevel1)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all backdrop-blur-md border shadow-lg ${
              showAlertsInLevel1
                ? 'bg-red-950/80 text-red-200 border-red-500/50 font-bold'
                : 'bg-[#171e11]/85 text-slate-300 border-white/20 hover:text-white'
            }`}
            title="Exibir todos os alertas no nível regional macro"
          >
            {showAlertsInLevel1 ? <Eye className="w-3.5 h-3.5 text-red-400" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Alertas MapBiomas ({showAlertsInLevel1 ? 'Visíveis' : 'Ocultos'})</span>
          </button>
        )}

        {/* Action: Open Standalone HTML Webmap Publisher */}
        {onPublishHtml && (
          <button
            type="button"
            onClick={onPublishHtml}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs font-mono transition-all shadow-lg border border-amber-400"
            title="Publicar e baixar webmap autônomo baseado neste modelo"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Webmap HTML5</span>
          </button>
        )}
      </div>

      {/* Toggle Floating Panels Button */}
      <button
        type="button"
        onClick={() => setShowPanels(!showPanels)}
        className="absolute top-3 right-3 z-30 flex items-center gap-1 px-2.5 py-1.5 bg-[#171e11]/85 backdrop-blur-md border border-white/20 rounded-lg text-xs font-mono text-white shadow-lg hover:bg-white/10 transition-colors pointer-events-auto"
        title={showPanels ? 'Recolher painéis narrativos' : 'Exibir painéis narrativos'}
      >
        <Sliders className="w-3.5 h-3.5 text-amber-400" />
        <span>{showPanels ? 'Recolher Painéis' : 'Exibir Painéis'}</span>
      </button>

      {/* Main Map Canvas with React-Leaflet */}
      <div className="relative w-full h-full flex-1">
        <MapContainer
          center={INITIAL_CENTER}
          zoom={INITIAL_ZOOM}
          minZoom={7}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', background: '#192015' }}
        >
          <MapViewController
            targetBounds={cameraBounds}
            targetCenter={cameraCenter}
            zoom={cameraZoom}
          />

          {/* Satellite / Basemap Layer */}
          {activeBasemap === 'sentinel2' && (
            <TileLayer
              url={SENTINEL2_CLOUDLESS_XYZ}
              attribution={SENTINEL2_ATTRIBUTION}
              maxZoom={18}
            />
          )}

          {activeBasemap === 'google' && (
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps / Google Earth"
              maxZoom={19}
            />
          )}

          {activeBasemap === 'esri' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri, Maxar, Earthstar Geographics"
              maxZoom={18}
            />
          )}

          {activeBasemap === 'dark' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution="&copy; Esri, OpenStreetMap"
              maxZoom={16}
            />
          )}

          {/* 1. APA Chapada do Araripe Polygon Layer */}
          <GeoJSON
            key="apa-layer"
            data={APA_POLYGON_GEOJSON}
            style={apaStyle}
            interactive={false}
          />

          {/* 2. 18 Municipalities Polygon Layer */}
          <GeoJSON
            key={`municipios-layer-${selectedMunicipio || 'none'}-${hoveredMunicipio || 'none'}`}
            data={MUNICIPIOS_GEOJSON}
            style={getMunicipioStyle}
            onEachFeature={(feature, layer) => {
              const munName = feature.properties.NM_MUN;
              layer.bindTooltip(
                `<div class="font-sans text-xs"><b>${munName}</b><br/><span class="text-slate-500">Clique para inspecionar</span></div>`,
                { sticky: true, opacity: 0.95 }
              );

              layer.on({
                mouseover: () => setHoveredMunicipio(munName),
                mouseout: () => setHoveredMunicipio(null),
                click: () => handleSelectMunicipio(munName)
              });
            }}
          />

          {/* 3. Alerts Polygon Layer */}
          {visibleAlertsGeoJson.features.length > 0 && (
            <GeoJSON
              key={`alerts-layer-${level}-${selectedMunicipio || 'all'}-${selectedAlert?.CODEALERTA || 'none'}`}
              data={visibleAlertsGeoJson as any}
              style={getAlertStyle}
              onEachFeature={(feature, layer) => {
                const props: AlertProperties = feature.properties;
                const insideHa = props.AREA_NA_APA_HA || props.AREAHA;
                layer.bindTooltip(
                  `<div class="font-sans text-xs">
                    <b>Alerta #${props.CODEALERTA}</b> (${props.MUNICIPIO})<br/>
                    <span class="text-red-600 font-semibold">${insideHa.toFixed(2)} ha na APA</span> · Ano ${props.ANODETEC}
                  </div>`,
                  { sticky: true, opacity: 0.95 }
                );

                layer.on({
                  click: () => handleSelectAlert(props, feature.geometry)
                });
              }}
            />
          )}
        </MapContainer>
      </div>

      {/* Floating Story UI Stack (Right Side, Glassmorphism, identical to Luna 2026 model) */}
      {showPanels && (
        <aside
          aria-label="Painéis narrativos da Chapada Desmatada"
          className="absolute top-14 right-3 z-20 w-[420px] max-w-[calc(100vw-32px)] max-h-[calc(100%-70px)] flex flex-col gap-2.5 pointer-events-none select-text overflow-y-auto pr-0.5 scrollbar-thin"
        >
          {/* LEVEL 1: Regional Editorial & Ranking Panel */}
          {level === 1 && (
            <>
              {/* Editorial Opening Panel */}
              <section className="bg-[#1f2618]/80 text-white p-4 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md pointer-events-auto transition-all animate-in fade-in duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Nível 1 · Abertura Regional
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    2019–2025
                  </span>
                </div>

                <h2 className="text-base font-bold text-white tracking-tight leading-snug mb-1">
                  Web Story Chapada do Araripe: Supressão Vegetal na APA
                </h2>
                <div className="text-xs text-amber-200/90 italic mb-2.5 font-serif">
                  Dinâmica territorial nos 18 municípios sob a égide da Unidade de Conservação Federal
                </div>

                <div className="text-xs leading-relaxed text-slate-200 space-y-2 font-normal border-t border-white/10 pt-2.5">
                  <p>
                    A <strong className="text-white font-semibold">Área de Preservação Ambiental Chapada do Araripe</strong>, instituída pelo Decreto Federal de 1997, abrange mais de 1 milhão de hectares entre o Ceará, Pernambuco e Piauí.
                  </p>
                  <p>
                    O cruzamento auditado no SIG dos dados do <strong className="text-white font-semibold">MapBiomas Alerta</strong> com a malha da APA revela que os municípios de <strong className="text-amber-300 font-semibold">Araripe</strong>, <strong className="text-amber-300 font-semibold">Santana do Cariri</strong> e <strong className="text-amber-300 font-semibold">Salitre</strong> concentram a maior porção das áreas desmatadas registradas no período.
                  </p>
                  <p className="text-[11px] text-slate-300">
                    💡 <span className="font-semibold text-white">Interatividade:</span> Clique em qualquer município no mapa ou na lista abaixo para entrar no <span className="text-amber-300 font-bold">Nível 2</span> com histórico detalhado e alertas individuais.
                  </p>
                </div>
              </section>

              {/* Municipal Ranking Panel */}
              <section className="bg-[#1f2618]/80 text-white p-3.5 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md pointer-events-auto flex flex-col max-h-[380px] overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-300">
                    Ranking do Desmatamento na APA
                  </h3>
                  <span className="text-[10px] font-mono text-slate-300">
                    18 municípios
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 mb-2 italic">
                  Área acumulada na interseção com a APA (2019–2025)
                </div>

                <div className="overflow-y-auto space-y-1.5 pr-1 text-xs scrollbar-thin">
                  {CHAPADA_RANKING.map((item, idx) => {
                    const pct = Math.max(2, (item.total_area_ha / maxRankingHa) * 100);
                    return (
                      <div
                        key={item.municipio}
                        onClick={() => handleSelectMunicipio(item.municipio)}
                        className="group flex items-center gap-2 p-1.5 rounded hover:bg-white/10 cursor-pointer transition-all border border-transparent hover:border-white/15"
                      >
                        <span className="w-5 text-right font-mono font-bold text-amber-400 text-[11px]">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-[11px] mb-0.5">
                            <span className="font-medium text-white truncate group-hover:text-amber-300 transition-colors">
                              {item.municipio}
                            </span>
                            <span className="font-mono text-amber-200 font-bold">
                              {item.total_area_ha.toLocaleString('pt-BR', {
                                minimumFractionDigits: 1,
                                maximumFractionDigits: 1
                              })}{' '}
                              ha
                            </span>
                          </div>
                          {/* Progress bar track */}
                          <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full group-hover:brightness-125 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* LEVEL 2: Selected Municipality Detail Panel */}
          {level === 2 && selectedMunicipioStats && (
            <section className="bg-[#1f2618]/85 text-white p-4 rounded-xl border border-white/20 shadow-2xl backdrop-blur-md pointer-events-auto space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Header with return button */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Nível 2 · Município Selecionado
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1">
                    {selectedMunicipio}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleResetToLevel1}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono transition-colors flex items-center gap-1 border border-white/20 shadow-sm"
                  title="Retornar à visão regional da APA"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar</span>
                </button>
              </div>

              {/* Editorial synthesis */}
              <div className="text-xs text-amber-200 font-semibold italic">
                {selectedMunicipio} ocupa a {selectedMunicipioStats.rankingItem?.rank || '—'}ª posição no ranking regional.
              </div>

              <div className="text-xs leading-relaxed text-slate-200 space-y-2 border-b border-white/10 pb-3">
                <p>
                  De 2019 a 2025, o desmatamento acumulado em <strong>{selectedMunicipio}</strong> na interseção com a APA soma{' '}
                  <strong className="text-amber-300 font-mono">
                    {selectedMunicipioStats.totalArea.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}{' '}
                    hectares
                  </strong>{' '}
                  em <strong>{selectedMunicipioStats.totalAlerts} alertas validados</strong>.
                </p>
                <p>
                  Em 2025 foram registrados{' '}
                  <strong>
                    {selectedMunicipioStats.area2025.toLocaleString('pt-BR', {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}{' '}
                    ha
                  </strong>
                  . Em comparação com 2024, a área suprimida{' '}
                  <strong className={selectedMunicipioStats.trend === 'increase' ? 'text-red-400' : 'text-emerald-400'}>
                    {selectedMunicipioStats.trend === 'increase'
                      ? `aumentou ${selectedMunicipioStats.deltaPct.toFixed(1)}%`
                      : selectedMunicipioStats.trend === 'decrease'
                      ? `diminuiu ${selectedMunicipioStats.deltaPct.toFixed(1)}%`
                      : 'permaneceu estável'}
                  </strong>
                  .
                </p>
              </div>

              {/* Time Series Mini Chart (2019 to 2025) */}
              <div>
                <div className="text-[11px] font-mono uppercase text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Série Temporal Anual (2019–2025)</span>
                  <span className="text-slate-400 text-[10px]">Área na APA</span>
                </div>
                <div className="space-y-1">
                  {selectedMunicipioStats.years.map((y) => {
                    const maxYearHa = Math.max(
                      1,
                      ...selectedMunicipioStats.years.map((row) => row.area_ha || 0)
                    );
                    const barPct = Math.max(2, (y.area_ha / maxYearHa) * 100);
                    return (
                      <div key={y.ano} className="flex items-center gap-2 text-xs">
                        <span className="w-8 font-mono text-[11px] text-slate-300">
                          {y.ano}
                        </span>
                        <div className="flex-1 h-3.5 bg-black/40 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${
                              y.ano === 2025
                                ? 'bg-amber-400'
                                : 'bg-red-500/80 hover:bg-red-400'
                            }`}
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <span className="w-16 text-right font-mono text-[11px] text-white">
                          {y.area_ha.toFixed(1)} ha
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Curated Alerts in this Municipality */}
              <div className="border-t border-white/10 pt-2.5">
                <div className="text-[11px] font-mono uppercase text-amber-300 mb-1.5 flex items-center justify-between">
                  <span>Alertas em Destaque no Município</span>
                  <span className="text-[10px] text-slate-300">Clique para abrir fotos</span>
                </div>

                <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                  {selectedMunicipioStats.alerts.map((f: any) => {
                    const alertProps: AlertProperties = f.properties;
                    const ha = alertProps.AREA_NA_APA_HA || alertProps.AREAHA;
                    return (
                      <div
                        key={alertProps.CODEALERTA}
                        onClick={() => handleSelectAlert(alertProps, f.geometry)}
                        className="p-1.5 rounded bg-white/5 hover:bg-white/15 border border-white/10 hover:border-red-400/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                          <span className="font-mono text-white font-semibold">
                            #{alertProps.CODEALERTA}
                          </span>
                          <span className="text-[10px] text-slate-300 font-mono">
                            {alertProps.ANODETEC}
                          </span>
                        </div>
                        <span className="font-mono text-amber-300 text-[11px] font-bold">
                          {ha.toFixed(2)} ha
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* LEVEL 3: Individual MapBiomas Alert with Before/After Photos */}
          {level === 3 && selectedAlert && (
            <section className="bg-[#1f2618]/90 text-white p-4 rounded-xl border border-red-500/30 shadow-2xl backdrop-blur-md pointer-events-auto space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Header with back buttons */}
              <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-red-500/25 text-red-300 border border-red-400/30">
                    Nível 3 · Alerta MapBiomas
                  </span>
                  <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-1.5">
                    Alerta #{selectedAlert.CODEALERTA}
                  </h2>
                </div>

                <div className="flex items-center gap-1.5">
                  {selectedMunicipio && (
                    <button
                      type="button"
                      onClick={() => {
                        setLevel(2);
                        setSelectedAlert(null);
                        const feat = MUNICIPIOS_GEOJSON.features.find(
                          (f: any) => f.properties.NM_MUN === selectedMunicipio
                        );
                        if (feat) {
                          setCameraBounds(L.geoJSON(feat).getBounds());
                        }
                      }}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono transition-colors flex items-center gap-1 border border-white/20"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>{selectedMunicipio}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetToLevel1}
                    className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded text-xs transition-colors border border-white/20"
                    title="Voltar ao Nível 1"
                  >
                    <Globe className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Key Alert Metadata */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/30 p-2 rounded border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Área na APA:
                  </span>
                  <span className="font-mono text-amber-300 text-sm font-bold">
                    {(selectedAlert.AREA_NA_APA_HA || selectedAlert.AREAHA).toFixed(2)} ha
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Ano / Data:
                  </span>
                  <span className="font-mono text-white text-xs font-semibold">
                    {selectedAlert.ANODETEC} ({selectedAlert.DATADETEC || '—'})
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Município / UF:
                  </span>
                  <span className="font-semibold text-white text-xs">
                    {selectedAlert.MUNICIPIO} - {selectedAlert.ESTADO}
                  </span>
                </div>
                <div className="bg-black/30 p-2 rounded border border-white/10">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Fonte Primária:
                  </span>
                  <span className="font-mono text-slate-200 text-xs">
                    {selectedAlert.FONTE.replace(/[{}]/g, '') || 'GLAD'}
                  </span>
                </div>
              </div>

              {/* Comparative Before/After Satellite Images (MapBiomas Platform URLs) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 uppercase">
                  <span>Imagens de Satélite Comparativas</span>
                  <span className="text-amber-300">MapBiomas</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Before deforestation */}
                  <div className="bg-black/40 rounded-lg overflow-hidden border border-white/15 group">
                    <div className="text-[10px] font-mono px-2 py-0.5 bg-black/60 text-slate-300 border-b border-white/10">
                      Antes da Supressão
                    </div>
                    <div className="relative aspect-video bg-black/60 flex items-center justify-center overflow-hidden">
                      <img
                        src={getMapBiomasBeforeImageUrl(selectedAlert.CODEALERTA)}
                        alt={`Satélite antes do alerta ${selectedAlert.CODEALERTA}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.img-fallback');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                      <div className="img-fallback hidden absolute inset-0 items-center justify-center p-2 text-center text-[10px] text-slate-400 font-mono">
                        Imagem disponível na plataforma oficial
                      </div>
                    </div>
                  </div>

                  {/* After deforestation */}
                  <div className="bg-black/40 rounded-lg overflow-hidden border border-red-500/30 group">
                    <div className="text-[10px] font-mono px-2 py-0.5 bg-red-950/70 text-red-300 border-b border-red-500/20">
                      Depois da Supressão
                    </div>
                    <div className="relative aspect-video bg-black/60 flex items-center justify-center overflow-hidden">
                      <img
                        src={getMapBiomasAfterImageUrl(selectedAlert.CODEALERTA)}
                        alt={`Satélite após o alerta ${selectedAlert.CODEALERTA}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.parentElement?.querySelector('.img-fallback');
                          if (fallback) (fallback as HTMLElement).style.display = 'flex';
                        }}
                      />
                      <div className="img-fallback hidden absolute inset-0 items-center justify-center p-2 text-center text-[10px] text-slate-400 font-mono">
                        Imagem disponível na plataforma oficial
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Direct Link to MapBiomas Official Report */}
              <div className="pt-1">
                <a
                  href={getMapBiomasAlertUrl(selectedAlert.CODEALERTA)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-xs font-mono transition-colors flex items-center justify-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Laudo Completo no MapBiomas Alerta</span>
                </a>
              </div>
            </section>
          )}

          {/* Source Footer */}
          <footer className="bg-[#141811]/90 text-slate-300 p-2.5 rounded-lg border border-white/10 text-[11px] leading-tight font-sans shadow-lg pointer-events-auto">
            <div className="flex items-center gap-1.5 text-slate-200 font-semibold mb-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Dados Oficiais Validados</span>
            </div>
            <div className="text-[10.5px] text-slate-400">
              Fontes: <strong className="text-slate-300">MapBiomas Alerta</strong>, <strong className="text-slate-300">IBGE</strong> e <strong className="text-slate-300">ICMBio</strong>. Basemap: Sentinel-2 cloudless (2025 by EOX). QGIS: <code className="text-amber-300 font-mono">projetoDesignChapadaAgosto.qgz</code>.
            </div>
          </footer>
        </aside>
      )}

      {/* Cartographic Floating Legend (Bottom Left, identical to chapadadesmatada) */}
      <div className="absolute left-3 bottom-3 z-20 bg-[#141811]/90 text-white px-3 py-2.5 rounded-lg border border-white/20 shadow-xl backdrop-blur-md text-xs font-sans pointer-events-auto">
        <div className="font-mono text-[10px] uppercase font-bold text-amber-300 mb-1.5 tracking-wider">
          Convenções Cartográficas
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-0 border-t-2 border-[#ebb46b] inline-block" />
            <span className="text-slate-200">APA Chapada do Araripe (Limite)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-0 border-t-2 border-dashed border-white inline-block" />
            <span className="text-slate-200">18 Municípios Selecionáveis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-red-600/80 border border-red-400 inline-block" />
            <span className="text-slate-200">Alertas com Interseção na APA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-blue-600/80 border border-blue-400 inline-block" />
            <span className="text-slate-200">Alertas fora da APA (Zona Externa)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
