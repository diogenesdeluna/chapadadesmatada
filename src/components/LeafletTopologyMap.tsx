import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Layers, AlertTriangle, CheckCircle2, MapPin } from 'lucide-react';

// Fix Leaflet's default icon URLs if any Marker is used
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface ProblemVertex {
  id: string;
  featureIndex: number;
  featureId: string | number;
  coordinate: [number, number]; // [lng, lat] (GeoJSON format)
  ruleCode: string;
  ruleName: string;
  message: string;
  suggestedFixQgis: string;
}

export interface MapFeatureItem {
  index: number;
  id: string | number;
  status: 'valid' | 'invalid' | 'warning';
  areaHa: number;
  coordinates: [number, number][][]; // Array of rings, each ring has [lng, lat]
  issuesCount: number;
}

interface LeafletTopologyMapProps {
  features: MapFeatureItem[];
  problemVertices: ProblemVertex[];
  defaultCenter?: [number, number]; // [lat, lng]
  defaultZoom?: number;
  onSelectFeature?: (index: number) => void;
  selectedFeatureIndex?: number | null;
}

// Helper component to auto-fit map view to feature bounds
function MapBoundsUpdater({ features, problemVertices }: { features: MapFeatureItem[]; problemVertices: ProblemVertex[] }) {
  const map = useMap();

  useEffect(() => {
    try {
      const latLngs: [number, number][] = [];

      // Collect coordinates from features
      features.forEach((f) => {
        f.coordinates.forEach((ring) => {
          ring.forEach(([lng, lat]) => {
            if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
              latLngs.push([lat, lng]);
            }
          });
        });
      });

      // Collect problem vertices coordinates
      problemVertices.forEach((v) => {
        const [lng, lat] = v.coordinate;
        if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
          latLngs.push([lat, lng]);
        }
      });

      if (latLngs.length > 0) {
        const bounds = L.latLngBounds(latLngs.map(([lat, lng]) => L.latLng(lat, lng)));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [35, 35], maxZoom: 16 });
        }
      }
    } catch (err) {
      console.warn('Erro ao ajustar limites do mapa Leaflet:', err);
    }
  }, [features, problemVertices, map]);

  return null;
}

export const LeafletTopologyMap: React.FC<LeafletTopologyMapProps> = ({
  features,
  problemVertices,
  defaultCenter = [-7.23, -39.41], // Cariri / APA Chapada do Araripe
  defaultZoom = 11,
  onSelectFeature,
  selectedFeatureIndex
}) => {
  const [basemapType, setBasemapType] = useState<'satellite' | 'streets' | 'dark' | 'osm'>('satellite');

  return (
    <div className="relative w-full h-[450px] rounded-lg overflow-hidden border border-slate-300 shadow-inner bg-slate-100">
      {/* Top Map HUD overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-xs text-white px-3 py-2 rounded-md shadow-md text-xs font-mono flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold">React-Leaflet Engine</span>
        </div>
        <span className="text-slate-500">|</span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Válidos: {features.filter((f) => f.status === 'valid').length}
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Com Erro: {features.filter((f) => f.status === 'invalid').length}
          </span>
          <span className="flex items-center gap-1 text-amber-300 font-bold">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Vértices/Kinks: {problemVertices.length}
          </span>
        </div>
        <span className="text-slate-500">|</span>
        {/* Basemap buttons */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded text-[11px]">
          <button
            type="button"
            onClick={() => setBasemapType('satellite')}
            className={`px-2 py-0.5 rounded transition-colors ${
              basemapType === 'satellite' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            🛰️ Satélite
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('streets')}
            className={`px-2 py-0.5 rounded transition-colors ${
              basemapType === 'streets' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            🗺️ Ruas
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('dark')}
            className={`px-2 py-0.5 rounded transition-colors ${
              basemapType === 'dark' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            🌙 Dark
          </button>
          <button
            type="button"
            onClick={() => setBasemapType('osm')}
            className={`px-2 py-0.5 rounded transition-colors ${
              basemapType === 'osm' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-300 hover:text-white'
            }`}
          >
            🌐 OSM
          </button>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
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

        <MapBoundsUpdater features={features} problemVertices={problemVertices} />

        {/* Render Polygons */}
        {features.map((feature) => {
          // Leaflet expects [lat, lng], GeoJSON has [lng, lat]
          const leafletRings: [number, number][][] = feature.coordinates.map((ring) =>
            ring.map(([lng, lat]) => [lat, lng])
          );

          const isValid = feature.status === 'valid';
          const isSelected = selectedFeatureIndex === feature.index;

          return (
            <Polygon
              key={`feat-${feature.index}-${feature.id}`}
              positions={leafletRings}
              eventHandlers={{
                click: () => onSelectFeature && onSelectFeature(feature.index)
              }}
              pathOptions={{
                color: isSelected
                  ? '#3b82f6'
                  : isValid
                  ? '#10b981'
                  : '#e11d48',
                weight: isSelected ? 3.5 : 2,
                fillColor: isValid ? '#34d399' : '#f43f5e',
                fillOpacity: isSelected ? 0.45 : 0.25,
                dashArray: isValid ? undefined : '5, 5'
              }}
            >
              <Tooltip direction="top" opacity={0.9} sticky>
                <div className="text-xs font-sans">
                  <strong>Feição #{feature.id}</strong>
                  <div className="text-[11px] text-slate-600">
                    Área: {feature.areaHa} ha | Status: {isValid ? 'Válida' : 'Inválida'}
                  </div>
                </div>
              </Tooltip>

              <Popup>
                <div className="text-xs p-1 space-y-1.5 font-sans min-w-[200px]">
                  <div className="flex items-center justify-between font-bold border-b pb-1">
                    <span>Feição #{feature.id}</span>
                    {isValid ? (
                      <span className="text-emerald-600 font-mono text-[10px] bg-emerald-50 px-1 rounded">
                        CONFORME
                      </span>
                    ) : (
                      <span className="text-rose-600 font-mono text-[10px] bg-rose-50 px-1 rounded">
                        INCONSISTENTE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-700">
                    <span className="font-semibold">Área Geodésica:</span> {feature.areaHa} ha
                  </div>
                  <div className="text-[11px] text-slate-700">
                    <span className="font-semibold">Erros Topológicos:</span> {feature.issuesCount}
                  </div>
                  {!isValid && (
                    <div className="text-[10px] text-rose-700 bg-rose-50 p-1.5 rounded border border-rose-200">
                      Geometria reprovada na etapa de limpeza. Requer ação de ajuste no QGIS (Luna, 2026c).
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Render Problematic Vertices and Kinks as Pulsing Leaflet CircleMarkers */}
        {problemVertices.map((v) => {
          const [lng, lat] = v.coordinate;
          if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
            return null;
          }

          return (
            <CircleMarker
              key={v.id}
              center={[lat, lng]}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#e11d48',
                fillOpacity: 0.95,
                weight: 2
              }}
            >
              <Tooltip direction="top" opacity={0.95}>
                <div className="text-xs font-mono text-rose-700 font-bold">
                  ⚠️ {v.ruleCode}: {v.ruleName}
                </div>
              </Tooltip>

              <Popup>
                <div className="text-xs p-1 space-y-1.5 font-sans min-w-[240px]">
                  <div className="flex items-center gap-1.5 font-bold text-rose-700 border-b pb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Inconsistência Topológica (Turf.js)</span>
                  </div>

                  <div className="text-[11px] space-y-1 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                    <div>
                      <span className="text-slate-500">Regra: </span>
                      <strong className="text-slate-900">{v.ruleCode} · {v.ruleName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Feição: </span>
                      <span className="text-slate-800">#{v.featureId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Coordenadas: </span>
                      <span className="text-rose-700 font-bold">
                        {lng.toFixed(6)}, {lat.toFixed(6)}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-700 leading-relaxed">
                    <strong>Diagnóstico:</strong> {v.message}
                  </div>

                  <div className="text-[10px] bg-amber-50 text-amber-900 p-1.5 rounded border border-amber-200">
                    <strong>Ação no QGIS:</strong> {v.suggestedFixQgis}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
