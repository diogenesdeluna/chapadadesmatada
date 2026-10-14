import React, { useState, useEffect } from 'react';
import { ProjectMetadata } from '../types/workflow';
import {
  Settings,
  Save,
  RotateCcw,
  Layers,
  MapPin,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
  Info,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { INITIAL_PROJECT_METADATA } from '../data/methodologyData';

interface ProjectConfigModalProps {
  project: ProjectMetadata;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: ProjectMetadata) => void;
  onResetDatabase: () => void;
}

export const ProjectConfigModal: React.FC<ProjectConfigModalProps> = ({
  project,
  isOpen,
  onClose,
  onSave,
  onResetDatabase
}) => {
  const [formData, setFormData] = useState<ProjectMetadata>({ ...project });

  // Maps Grounding State (gemini-3.5-flash with googleMaps tool)
  const [isQueryingMaps, setIsQueryingMaps] = useState(false);
  const [mapsResult, setMapsResult] = useState<{
    text: string;
    mapsSources: { title: string; uri: string; placeSnippets?: string[] }[];
    webSources: { title: string; uri: string }[];
    isFallback?: boolean;
  } | null>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);

  // Sync formData with incoming project prop whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...project,
        rawDownloadFormat: project.rawDownloadFormat || 'Shapefile (.shp, .shx, .dbf, .prj)',
        rawDownloadCrs: project.rawDownloadCrs || 'SIRGAS 2000 Brasil (EPSG:4674)',
        calculationCrs: project.calculationCrs || 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
        outputCrs: project.outputCrs || 'EPSG:3857 (Web Mercator para Mapa Interativo)'
      });
    }
  }, [isOpen, project]);

  if (!isOpen) return null;

  const handleClearToZero = () => {
    setFormData({
      ...project,
      title: '',
      territoryDescription: '',
      targetObject: '',
      regionalLayerName: '',
      localLayerName: '',
      detailLayerName: '',
      rawDownloadFormat: 'Shapefile (.shp, .shx, .dbf, .prj)',
      rawDownloadCrs: 'SIRGAS 2000 Brasil (EPSG:4674)',
      calculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
      outputCrs: 'EPSG:3857 (Web Mercator para Mapa Interativo)'
    });
  };

  const handleConsultGoogleMapsGrounding = async () => {
    try {
      setIsQueryingMaps(true);
      setMapsError(null);

      const queryText = formData.territoryDescription
        ? `Quais são os limites territoriais oficiais, coordenadas e municípios de "${formData.territoryDescription}" no contexto de "${formData.title || 'apuração jornalística'}"? Liste as principais referências cartográficas oficiais.`
        : 'Quais são os limites territoriais oficiais e referências cartográficas dos municípios brasileiros?';

      const res = await fetch('/api/gemini/maps-grounding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          location: {
            latitude: -7.23,
            longitude: -39.41
          }
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao consultar Maps Grounding.');
      }

      setMapsResult(data);
    } catch (err: any) {
      console.error('Erro ao consultar Maps Grounding:', err);
      setMapsError(err.message || 'Erro ao consultar Google Maps.');
    } finally {
      setIsQueryingMaps(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Configurações da Pauta e Camadas Territoriais
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                Parâmetros oficiais de apuração · Luna (2026c)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-mono px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Quick Options Bar: Zero Start vs Optional Pilot Template */}
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-700 shrink-0" />
            <span className="text-slate-800 font-medium">
              Definição de Pauta Editorial: Inicie com suas próprias premissas territoriais sem pré-definições.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleClearToZero}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-mono text-[11px] font-semibold transition-colors cursor-pointer"
              title="Limpa todos os campos para digitar a pauta do zero"
            >
              Limpar Todos os Campos (Início do Zero)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Section 1: Editorial Dossier */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Título da Investigação / Pauta do Mapa:
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Administrador Único do Sistema / Repórter Líder:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="Diógenes Luna"
                  disabled
                  readOnly
                  className="w-full p-2 bg-slate-100 border border-slate-300 rounded font-sans text-slate-800 font-semibold cursor-not-allowed select-none"
                />
                <span className="absolute right-2 top-2 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded">
                  ADMIN EXCLUSIVO
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Apenas Diógenes Luna possui autoridade de administração do sistema e custódia metodológica.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Instituição / Laboratório:
              </label>
              <input
                type="text"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Território e Recorte Geográfico:
              </label>
              <input
                type="text"
                value={formData.territoryDescription}
                onChange={(e) =>
                  setFormData({ ...formData, territoryDescription: e.target.value })
                }
                className="w-full p-2 border border-slate-300 rounded font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Objeto e Hipótese Investigada:
            </label>
            <input
              type="text"
              value={formData.targetObject}
              onChange={(e) => setFormData({ ...formData, targetObject: e.target.value })}
              className="w-full p-2 border border-slate-300 rounded font-sans text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
          </div>

          {/* Section 2: Three Territorial Layers (Regional, Local, Detalhe) */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>Três Camadas Territoriais do Protocolo (Luna, 2026c):</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ICMBio · IBGE · MapBiomas Alerta
              </span>
            </div>

            {/* Layer 1: Regional (ICMBio / Órgão Oficial) */}
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Nível 1 - Regional (Poligonal da Região ou Unidade de Conservação):
                </label>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[9px] font-mono font-bold">
                  FONTE: ICMBio / MMA / Oficial
                </span>
              </div>
              <input
                type="text"
                value={formData.regionalLayerName}
                onChange={(e) =>
                  setFormData({ ...formData, regionalLayerName: e.target.value })
                }
                placeholder="Ex: Poligonal oficial da Unidade de Conservação, bioma ou região macro"
                className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Delimitação cartográfica oficial federal ou regional para enquadramento macro da apuração.
              </span>
            </div>

            {/* Layer 2: Local (IBGE) */}
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Nível 2 - Local (Malha Municipal dos Municípios Confinantes):
                </label>
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded text-[9px] font-mono font-bold">
                  FONTE: IBGE Geociências
                </span>
              </div>
              <input
                type="text"
                value={formData.localLayerName}
                onChange={(e) => setFormData({ ...formData, localLayerName: e.target.value })}
                placeholder="Ex: Malha municipal oficial dos municípios sob investigação"
                className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Limites municipais oficiais para contextualização local e decisões de gestão territorial.
              </span>
            </div>

            {/* Layer 3: Detalhe (Bases Temáticas / Fatos) */}
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700">
                  Nível 3 - Detalhe (Polígonos de Ocorrência de Fatos):
                </label>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-mono font-bold">
                  FONTE: Plataforma Oficial / MapBiomas / Deter
                </span>
              </div>
              <input
                type="text"
                value={formData.detailLayerName}
                onChange={(e) =>
                  setFormData({ ...formData, detailLayerName: e.target.value })
                }
                placeholder="Ex: Polígonos vetoriais de ocorrência dos fatos investigados (alertas, imóveis, etc.)"
                className="w-full p-1.5 border border-slate-300 rounded font-mono text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Polígonos vetoriais factuais em escala de detalhe a serem submetidos a cálculo de sobreposição.
              </span>
            </div>
          </div>

          {/* Section 3: Cartographic Systems (SRC) & Brazilian Public Data Protocol */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold uppercase text-slate-800 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-700" />
                <span>Protocolo Cartográfico Brasileiro: Download e Cálculos</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                Decreto 8.777/2016 · ET-EDGV IBGE · Luna (2026c)
              </span>
            </div>

            {/* Brazilian Public Vector Standard Banner */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  <span>1. Padrão de Download das Bases Públicas Oficiais do Brasil:</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded">
                  Shapefile (.shp) · SIRGAS 2000 (EPSG:4674)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                As bases de dados públicas do Brasil (IBGE, ICMBio, FUNAI, MMA, INCRA, ANA, MapBiomas) são distribuídas no padrão vetorial <strong>Shapefile (.shp, .shx, .dbf, .prj)</strong> sob o Sistema de Coordenadas Geográficas <strong>SIRGAS 2000 Brasil (EPSG:4674)</strong>. Você baixa a base de dados em Shapefile com EPSG:4674 diretamente dos portais abertos.
              </p>
            </div>

            {/* Reprojection & Calculation Protocol */}
            <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  <span>2. Reprojeção Obrigatória que Antecede os Cálculos no SIG:</span>
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  Reprojetar para EPSG:10857
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                A reprojeção para <strong>SIRGAS 2000 Brasil Albers (EPSG:10857)</strong> é a etapa que antecede a preparação do <em>projeto QGIS de cálculo</em> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">calculos_geojornalismo.qgz</code>), o <em>GeoPackage de cálculo</em> (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">dados_calculos.gpkg</code>) e as <em>bases de dados de cálculos</em>.
              </p>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-950 font-medium">
                ⚖️ <strong>Regra de Ouro (Luna, 2026c):</strong> Tudo que for relativo a cálculos de áreas (hectares, km², interseções espaciais e sobreposições) <strong>DEVE ser realizado em (EPSG:10857)</strong>.
              </div>
            </div>

            {/* CRS Form Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SRC Obrigatório para Cálculo de Áreas (Albers):
                </label>
                <input
                  type="text"
                  value={formData.calculationCrs}
                  onChange={(e) =>
                    setFormData({ ...formData, calculationCrs: e.target.value })
                  }
                  className="w-full p-2 border border-slate-300 rounded font-mono text-slate-800 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Padrão IBGE oficial para cálculo métrico de áreas sem distorção planar.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SRC para Publicação Web e Mapa Interativo:
                </label>
                <input
                  type="text"
                  value={formData.outputCrs}
                  onChange={(e) => setFormData({ ...formData, outputCrs: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded font-mono text-slate-800 bg-white"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Padrão OGC (EPSG:3857) para renderização em navegadores web e Leaflet.
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Google Maps Grounding Tool Integration */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">
                    Google Maps Grounding (Gemini 3.5 Flash)
                  </span>
                  <span className="text-[10px] text-slate-600 block">
                    Validação em tempo real dos limites geográficos e lugares no Google Maps
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConsultGoogleMapsGrounding}
                disabled={isQueryingMaps}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-mono text-[11px] font-semibold transition-colors disabled:opacity-50 shrink-0 shadow-xs"
              >
                {isQueryingMaps ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Consultar Google Maps</span>
              </button>
            </div>

            {mapsError && (
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 text-[11px] rounded font-mono">
                {mapsError}
              </div>
            )}

            {/* Display Grounded Map Places & Links */}
            {mapsResult && (
              <div className="space-y-2 mt-2 pt-2 border-t border-blue-200 text-[11px]">
                <div className="text-slate-800 whitespace-pre-wrap leading-relaxed bg-white/80 p-2.5 rounded border border-blue-100">
                  {mapsResult.text}
                </div>

                {/* Mandated Google Maps Links from groundingChunks */}
                {mapsResult.mapsSources && mapsResult.mapsSources.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-700 block font-mono">
                      Lugares e Unidades Verificadas no Google Maps:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {mapsResult.mapsSources.map((source, idx) => (
                        <a
                          key={idx}
                          href={source.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-blue-700 border border-blue-300 rounded font-medium text-[11px] transition-colors shadow-2xs"
                        >
                          <MapPin className="w-3 h-3 text-rose-600" />
                          <span>{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 5: Modal Actions */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                handleClearToZero();
              }}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-mono text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Todos os Campos (Iniciar do Zero)</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-100 text-xs font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 flex items-center gap-1.5 text-xs shadow-xs"
              >
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                <span>Salvar Configuração da Pauta</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
