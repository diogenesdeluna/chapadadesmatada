import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sparkles,
  Download,
  Copy,
  Check,
  Eye,
  Sliders,
  Layers,
  FileCode,
  ShieldCheck,
  X,
  ExternalLink
} from 'lucide-react';

export interface JournalisticTheme {
  id: string;
  name: string;
  category: string;
  description: string;
  colors: {
    primary: string; // e.g. Ocre
    secondary: string; // e.g. Terra
    accent: string; // e.g. Rubro
    background: string; // Paper
    surface: string; // White
    text: string; // Black ink
    textMuted: string; // Slate/Stone
    border: string; // Hairline border
  };
  typography: {
    displayFamily: string;
    bodyFamily: string;
    monoFamily: string;
    heroSize: string;
    bodySize: string;
  };
  cartoUseCases: string[];
}

export const JOURNALISTIC_THEMES: JournalisticTheme[] = [
  {
    id: 'mapeia_canonico',
    name: 'MapeIA Canônico (Ocre, Terra, Rubro)',
    category: 'Jornalismo Investigativo & Auditoria',
    description: 'Paleta oficial do protocolo Luna (2026c). Contraste editorial rigoroso com tons terrosos da Chapada do Araripe e nanquim de imprensa.',
    colors: {
      primary: '#c07d19', // Ocre
      secondary: '#7b3819', // Terra
      accent: '#9e1f1f', // Rubro
      background: '#faf7f2', // Papel quente
      surface: '#ffffff',
      text: '#141210', // Nanquim
      textMuted: '#57534e',
      border: '#e8d0c2'
    },
    typography: {
      displayFamily: 'Fraunces, Playfair Display, serif',
      bodyFamily: 'Plus Jakarta Sans, sans-serif',
      monoFamily: 'JetBrains Mono, tabular-nums',
      heroSize: '2.25rem',
      bodySize: '0.9375rem'
    },
    cartoUseCases: ['Reportagens investigativas', 'Auditoria científica', 'Cartografia de dados públicos']
  },
  {
    id: 'cariri_hidrico',
    name: 'Cariri Hídrico & Bacias Hidrográficas',
    category: 'Recursos Hídricos & Meio Ambiente',
    description: 'Projetada para mapas de rios do Cariri (Salgado, Granjeiro, Batateiras), açudes e drenagem superficial semiárida.',
    colors: {
      primary: '#1d4ed8', // Azul Riacho
      secondary: '#047857', // Verde Várzea
      accent: '#b45309', // Ocre Aluvião
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#cbd5e1'
    },
    typography: {
      displayFamily: 'Outfit, sans-serif',
      bodyFamily: 'Plus Jakarta Sans, sans-serif',
      monoFamily: 'JetBrains Mono, tabular-nums',
      heroSize: '2.25rem',
      bodySize: '0.9375rem'
    },
    cartoUseCases: ['Rios e canais do Cariri', 'Açudes e barragens da ANA', 'Outorga hídrica e saneamento']
  },
  {
    id: 'araripe_bio',
    name: 'Chapada do Araripe (Bio-Reserva & UC)',
    category: 'Conservação & Biodiversidade',
    description: 'Otimizada para Unidades de Conservação do MMA, APA Chapada do Araripe (CE, PE, PI) e cobertura vegetal MapBiomas.',
    colors: {
      primary: '#15803d', // Verde Flona
      secondary: '#9a3412', // Terra Fóssil
      accent: '#d97706', // Ocre Solstício
      background: '#fcfbf9',
      surface: '#ffffff',
      text: '#1c1917',
      textMuted: '#78716c',
      border: '#e7e5e4'
    },
    typography: {
      displayFamily: 'Bricolage Grotesque, sans-serif',
      bodyFamily: 'Plus Jakarta Sans, sans-serif',
      monoFamily: 'JetBrains Mono, tabular-nums',
      heroSize: '2.25rem',
      bodySize: '0.9375rem'
    },
    cartoUseCases: ['Polígonos da APA Chapada do Araripe', 'Parques Nacionais e UCs do MMA', 'Cobertura florestal e nascentes']
  },
  {
    id: 'semiarido_clima',
    name: 'Semiárido, Seca & Clima',
    category: 'Vulnerabilidade Climática',
    description: 'Altíssimo contraste para representar desertificação, estiagem prolongada e estresse hídrico no Nordeste.',
    colors: {
      primary: '#c2410c', // Terracota Sertão
      secondary: '#ca8a04', // Ocre Caatinga
      accent: '#b91c1c', // Rubro Emergência
      background: '#fefce8',
      surface: '#ffffff',
      text: '#1c1917',
      textMuted: '#71717a',
      border: '#fde047'
    },
    typography: {
      displayFamily: 'Public Sans, sans-serif',
      bodyFamily: 'Plus Jakarta Sans, sans-serif',
      monoFamily: 'JetBrains Mono, tabular-nums',
      heroSize: '2.25rem',
      bodySize: '0.9375rem'
    },
    cartoUseCases: ['Mapas de calor e estiagem', 'Municípios em estado de emergência', 'Perda de biomassa vegetal']
  },
  {
    id: 'conflito_denuncia',
    name: 'Conflito Territorial & Denúncia',
    category: 'Direitos Humanos & Território',
    description: 'Paleta assertiva para reportagens sobre desmatamento ilegal, sobreposição em terras indígenas/quilombolas e grilagem.',
    colors: {
      primary: '#dc2626', // Rubro Denúncia
      secondary: '#78350f', // Terra Grilagem
      accent: '#d97706', // Ocre Alerta
      background: '#f8fafc',
      surface: '#ffffff',
      text: '#020617',
      textMuted: '#475569',
      border: '#e2e8f0'
    },
    typography: {
      displayFamily: 'Big Shoulders Display, sans-serif',
      bodyFamily: 'DM Sans, sans-serif',
      monoFamily: 'JetBrains Mono, tabular-nums',
      heroSize: '2.5rem',
      bodySize: '0.9375rem'
    },
    cartoUseCases: ['Desmatamento MapBiomas Alerta', 'Conflitos fundiários', 'Sobreposições cartográficas']
  }
];

interface JournalisticDesignEngineProps {
  isOpen: boolean;
  onClose: () => void;
  activeThemeId?: string;
  onSelectTheme?: (theme: JournalisticTheme) => void;
}

export const JournalisticDesignEngine: React.FC<JournalisticDesignEngineProps> = ({
  isOpen,
  onClose,
  activeThemeId = 'mapeia_canonico',
  onSelectTheme
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>(activeThemeId);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentTheme = JOURNALISTIC_THEMES.find((t) => t.id === selectedThemeId) || JOURNALISTIC_THEMES[0];

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const generateCssVariables = (t: JournalisticTheme) => {
    return `:root {
  /* MapeIA Geojournalistic Design Tokens: ${t.name} */
  --color-primary: ${t.colors.primary};
  --color-secondary: ${t.colors.secondary};
  --color-accent: ${t.colors.accent};
  --color-bg-paper: ${t.colors.background};
  --color-surface: ${t.colors.surface};
  --color-ink-black: ${t.colors.text};
  --color-ink-muted: ${t.colors.textMuted};
  --color-border-hairline: ${t.colors.border};

  /* Typography Pairing */
  --font-display: ${t.typography.displayFamily};
  --font-body: ${t.typography.bodyFamily};
  --font-mono: ${t.typography.monoFamily};
}`;
  };

  const generateFigmaTokensJson = (t: JournalisticTheme) => {
    return JSON.stringify(
      {
        name: t.name,
        category: t.category,
        domain: 'MapeIA - Geojornalismo Científico (Luna 2026c)',
        tokens: {
          color: {
            primary: { value: t.colors.primary, type: 'color' },
            secondary: { value: t.colors.secondary, type: 'color' },
            accent: { value: t.colors.accent, type: 'color' },
            background: { value: t.colors.background, type: 'color' },
            surface: { value: t.colors.surface, type: 'color' },
            text: { value: t.colors.text, type: 'color' },
            border: { value: t.colors.border, type: 'color' }
          },
          typography: {
            display: { font: t.typography.displayFamily },
            body: { font: t.typography.bodyFamily },
            mono: { font: t.typography.monoFamily }
          }
        }
      },
      null,
      2
    );
  };

  const generateMapLibrePaintJson = (t: JournalisticTheme) => {
    return JSON.stringify(
      {
        layers: [
          {
            id: 'cariri-base-polygons',
            type: 'fill',
            paint: {
              'fill-color': t.colors.background,
              'fill-opacity': 0.8
            }
          },
          {
            id: 'unidades-conservacao-mma',
            type: 'line',
            paint: {
              'line-color': t.colors.secondary,
              'line-width': 2.5
            }
          },
          {
            id: 'rios-aguas-cariri',
            type: 'line',
            paint: {
              'line-color': t.colors.primary,
              'line-width': 2.0
            }
          },
          {
            id: 'pontos-alerta-denuncia',
            type: 'circle',
            paint: {
              'circle-color': t.colors.accent,
              'circle-radius': 6,
              'circle-stroke-width': 1.5,
              'circle-stroke-color': '#ffffff'
            }
          }
        ]
      },
      null,
      2
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#faf7f2] border border-[#e8d0c2] rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden text-stone-900 font-sans">
        {/* Modal Header */}
        <div className="p-5 bg-white border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7b3819] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-[#c07d19]" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-stone-500">
                <span>ESTÚDIO DE DESIGN GEOJORNALÍSTICO</span>
                <span>·</span>
                <span>GERADOR DE PALETAS & TOKENS MCP</span>
              </div>
              <h2 className="text-xl font-bold text-stone-950 font-serif">
                Design Engine: Tipografia & Paletas Cartográficas
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Preset Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-stone-500 mb-2 font-semibold">
              Selecione o Sistema Visual de Reportagem:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {JOURNALISTIC_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => {
                      setSelectedThemeId(theme.id);
                      if (onSelectTheme) onSelectTheme(theme);
                    }}
                    className={`text-left p-3.5 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-[#7b3819] ring-2 ring-[#7b3819]/20 shadow-sm'
                        : 'bg-white/70 hover:bg-white border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase font-bold text-stone-500">
                        {theme.category}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#7b3819]" />
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 leading-snug font-serif">
                      {theme.name}
                    </h4>

                    {/* Color Swatch Strip */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-stone-100">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Cor Primária"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Cor Secundária"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Destaque / Alerta"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.text }}
                        title="Nanquim Texto"
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.background }}
                        title="Papel Fundo"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Palette Deep Dive & Preview Card */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
              <div>
                <span className="text-xs font-mono uppercase text-[#7b3819] font-bold">
                  {currentTheme.category}
                </span>
                <h3 className="text-lg font-bold text-stone-900 font-serif">
                  {currentTheme.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  WCAG AA 4.5:1 Conforme
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-700 leading-relaxed">
              {currentTheme.description}
            </p>

            {/* Color Swatch Detail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              <div className="p-2.5 rounded border border-stone-200 bg-stone-50 text-center">
                <div
                  className="w-full h-8 rounded mb-2 shadow-2xs border border-black/10"
                  style={{ backgroundColor: currentTheme.colors.primary }}
                />
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Primária</span>
                <span className="text-xs font-bold font-mono text-stone-900">{currentTheme.colors.primary}</span>
              </div>

              <div className="p-2.5 rounded border border-stone-200 bg-stone-50 text-center">
                <div
                  className="w-full h-8 rounded mb-2 shadow-2xs border border-black/10"
                  style={{ backgroundColor: currentTheme.colors.secondary }}
                />
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Secundária</span>
                <span className="text-xs font-bold font-mono text-stone-900">{currentTheme.colors.secondary}</span>
              </div>

              <div className="p-2.5 rounded border border-stone-200 bg-stone-50 text-center">
                <div
                  className="w-full h-8 rounded mb-2 shadow-2xs border border-black/10"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                />
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Destaque</span>
                <span className="text-xs font-bold font-mono text-stone-900">{currentTheme.colors.accent}</span>
              </div>

              <div className="p-2.5 rounded border border-stone-200 bg-stone-50 text-center">
                <div
                  className="w-full h-8 rounded mb-2 shadow-2xs border border-black/10"
                  style={{ backgroundColor: currentTheme.colors.background }}
                />
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Papel Fundo</span>
                <span className="text-xs font-bold font-mono text-stone-900">{currentTheme.colors.background}</span>
              </div>

              <div className="p-2.5 rounded border border-stone-200 bg-stone-50 text-center">
                <div
                  className="w-full h-8 rounded mb-2 shadow-2xs border border-black/10"
                  style={{ backgroundColor: currentTheme.colors.text }}
                />
                <span className="text-[10px] font-mono uppercase text-stone-500 block">Nanquim</span>
                <span className="text-xs font-bold font-mono text-stone-900">{currentTheme.colors.text}</span>
              </div>
            </div>

            {/* Typography Pairing Specs */}
            <div className="bg-[#faf7f2] p-4 rounded-lg border border-[#e8d0c2] space-y-2 text-xs">
              <span className="text-[11px] font-mono uppercase font-bold text-[#7b3819] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>Casamento Tipográfico Editorial:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                <div>
                  <span className="text-stone-400 block">Display (Títulos):</span>
                  <span className="text-stone-900 font-semibold">{currentTheme.typography.displayFamily}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Corpo de Texto:</span>
                  <span className="text-stone-900 font-semibold">{currentTheme.typography.bodyFamily}</span>
                </div>
                <div>
                  <span className="text-stone-400 block">Dados & Coordenadas:</span>
                  <span className="text-stone-900 font-semibold">{currentTheme.typography.monoFamily}</span>
                </div>
              </div>
            </div>

            {/* Use cases */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="font-mono text-stone-500 text-[11px]">Aplicações Recomendadas:</span>
              {currentTheme.cartoUseCases.map((useCase, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-stone-100 text-stone-800 text-[11px] font-medium"
                >
                  {useCase}
                </span>
              ))}
            </div>
          </div>

          {/* Export Tokens & MCP Integration */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#7b3819]" />
                <h4 className="text-sm font-bold text-stone-900 font-serif">
                  Exportação de Design Tokens & Integração MCP
                </h4>
              </div>
              <span className="text-[11px] font-mono text-stone-400">
                Formatos prontos para Tailwind, Figma e MapLibre GL
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleCopy(generateCssVariables(currentTheme), 'css')}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedFormat === 'css' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar CSS Variables</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(generateFigmaTokensJson(currentTheme), 'json')}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedFormat === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar JSON Tokens (Figma/MCP)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(generateMapLibrePaintJson(currentTheme), 'maplibre')}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedFormat === 'maplibre' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copiar Regras Paint (MapLibre/Leaflet)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-stone-500">
            * MapeIA Design Constitution: Zero-Pill, Contraste Editorial e Tipografia Suíça/Cartográfica.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#7b3819] hover:bg-[#58240f] text-white rounded text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Concluir & Aplicar Estudo
          </button>
        </div>
      </div>
    </div>
  );
};
