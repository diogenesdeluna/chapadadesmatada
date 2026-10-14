import React, { useState, useMemo, useRef } from 'react';
import * as turf from '@turf/turf';
import { LeafletTopologyMap, ProblemVertex, MapFeatureItem } from './LeafletTopologyMap';
import {
  Upload,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  FileCode,
  Eye,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Bug,
  HelpCircle,
  Info,
  ExternalLink,
  ShieldCheck,
  Wrench,
  Download,
  FileText,
  MapPin,
  AlertTriangle,
  Copy
} from 'lucide-react';

interface GeoJsonCleaningValidatorProps {
  onValidatedToProtocol?: (verdict: 'Sim' | 'Não', details: string) => void;
}

export interface ValidationIssue {
  id: string;
  featureIndex: number;
  featureId: string | number;
  ruleCode: string;
  ruleName: string;
  severity: 'error' | 'warning';
  message: string;
  coordinate?: [number, number]; // [lng, lat]
  suggestedFixQgis: string;
}

export interface FeatureAudit {
  index: number;
  id: string | number;
  type: string;
  vertexCount: number;
  areaHa: number;
  isClosed: boolean;
  hasSelfIntersection: boolean;
  hasDuplicateVertices: boolean;
  isValidOgc: boolean;
  issues: ValidationIssue[];
  status: 'valid' | 'invalid' | 'warning';
  properties: Record<string, any>;
  coordinates: [number, number][][];
}

// Preset GeoJSON samples for instant testing in the sandbox
const SAMPLE_PRESETS: { name: string; description: string; json: string }[] = [
  {
    name: '1. Amostra Íntegra (APA Chapada do Araripe / Cariri)',
    description: '3 polígonos perfeitamente fechados, sem auto-interseções e com coordenadas válidas.',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'alertas_desmatamento_limpos',
        crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
        features: [
          {
            type: 'Feature',
            id: 'alerta_801',
            properties: { id: 801, gleba: 'Encosta do Crato', classe: 'Supressão Nativa', data_alerta: '2026-03-12' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.42, -7.22],
                  [-39.40, -7.22],
                  [-39.39, -7.25],
                  [-39.41, -7.27],
                  [-39.43, -7.25],
                  [-39.42, -7.22]
                ]
              ]
            }
          },
          {
            type: 'Feature',
            id: 'alerta_802',
            properties: { id: 802, gleba: 'Planalto Araripe - Barbalha', classe: 'Degradação Florestal', data_alerta: '2026-03-15' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.36, -7.28],
                  [-39.34, -7.27],
                  [-39.33, -7.30],
                  [-39.35, -7.31],
                  [-39.36, -7.28]
                ]
              ]
            }
          },
          {
            type: 'Feature',
            id: 'alerta_803',
            properties: { id: 803, gleba: 'Borda Sul - Santana do Cariri', classe: 'Corte Raso', data_alerta: '2026-03-18' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.73, -7.18],
                  [-39.71, -7.17],
                  [-39.70, -7.20],
                  [-39.72, -7.22],
                  [-39.74, -7.20],
                  [-39.73, -7.18]
                ]
              ]
            }
          }
        ]
      },
      null,
      2
    )
  },
  {
    name: '2. Amostra com Auto-Interseção (Laço em 8 - Kink Turf.js)',
    description: 'Polígono com arestas cruzadas entre si. Detectado pelo algoritmo turf.kinks.',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'poligono_auto_intersecao_kink',
        features: [
          {
            type: 'Feature',
            id: 'alerta_erro_kink_901',
            properties: { id: 901, gleba: 'Encosta da Chapada', descricao: 'Polígono com arestas cruzadas em laço fechado' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.42, -7.22],
                  [-39.36, -7.27],
                  [-39.42, -7.27],
                  [-39.36, -7.22], // Cruzamento com aresta anterior (Kink topológico)
                  [-39.42, -7.22]
                ]
              ]
            }
          }
        ]
      },
      null,
      2
    )
  },
  {
    name: '3. Amostra com Anel Aberto (Não-fechado RFC 7946)',
    description: 'O último vértice diverge do primeiro. Falha no fechamento do anel exterior.',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'poligono_anel_aberto',
        features: [
          {
            type: 'Feature',
            id: 'alerta_erro_aberto_902',
            properties: { id: 902, gleba: 'Nascente Rio Batateiras', descricao: 'Anel poligonal com gap final de fechamento' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.43, -7.23],
                  [-39.40, -7.23],
                  [-39.39, -7.26],
                  [-39.42, -7.27] // Não retorna a [-39.43, -7.23]
                ]
              ]
            }
          }
        ]
      },
      null,
      2
    )
  },
  {
    name: '4. Amostra com Vértices Duplicados e Micro-polígono (Sliver)',
    description: 'Polígono com nós repetidos consecutivamente e feição espúria de área quase nula (< 0.01 ha).',
    json: JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'poligono_duplicado_sliver',
        features: [
          {
            type: 'Feature',
            id: 'alerta_duplicado_903',
            properties: { id: 903, gleba: 'Zona de Amortecimento', descricao: 'Vértices repetidos consecutivamente' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.42, -7.22],
                  [-39.40, -7.22],
                  [-39.40, -7.22], // Duplicado!
                  [-39.40, -7.25],
                  [-39.42, -7.25],
                  [-39.42, -7.22]
                ]
              ]
            }
          },
          {
            type: 'Feature',
            id: 'alerta_sliver_904',
            properties: { id: 904, gleba: 'Micro-fragmento espúrio', descricao: 'Polígono com área quase nula' },
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-39.3800, -7.2400],
                  [-39.3801, -7.2400],
                  [-39.3801, -7.2401],
                  [-39.3800, -7.2401],
                  [-39.3800, -7.2400]
                ]
              ]
            }
          }
        ]
      },
      null,
      2
    )
  }
];

export const GeoJsonCleaningValidator: React.FC<GeoJsonCleaningValidatorProps> = ({
  onValidatedToProtocol
}) => {
  const [rawInput, setRawInput] = useState<string>(SAMPLE_PRESETS[1].json);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'leaflet' | 'table' | 'code'>('leaflet');
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate geometries using turf.js according to Protocol Phase 4.3 (Limpar)
  const auditResult = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const featureAudits: FeatureAudit[] = [];
    const problemVertices: ProblemVertex[] = [];

    if (!rawInput.trim()) {
      return {
        parsed: null,
        parseError: 'Nenhum conteúdo GeoJSON carregado.',
        featureAudits: [],
        problemVertices: [],
        totalIssues: 0,
        verdict: 'Não' as const
      };
    }

    let parsedGeoJson: any = null;
    try {
      parsedGeoJson = JSON.parse(rawInput);
    } catch (err: any) {
      return {
        parsed: null,
        parseError: `Erro de sintaxe JSON: ${err.message}`,
        featureAudits: [],
        problemVertices: [],
        totalIssues: 1,
        verdict: 'Não' as const
      };
    }

    if (!parsedGeoJson || typeof parsedGeoJson !== 'object') {
      return {
        parsed: null,
        parseError: 'Estrutura GeoJSON inválida (não é um objeto válido).',
        featureAudits: [],
        problemVertices: [],
        totalIssues: 1,
        verdict: 'Não' as const
      };
    }

    // Normalize features array
    let rawFeatures: any[] = [];
    if (parsedGeoJson.type === 'FeatureCollection' && Array.isArray(parsedGeoJson.features)) {
      rawFeatures = parsedGeoJson.features;
    } else if (parsedGeoJson.type === 'Feature') {
      rawFeatures = [parsedGeoJson];
    } else if (parsedGeoJson.type === 'Polygon' || parsedGeoJson.type === 'MultiPolygon') {
      rawFeatures = [{ type: 'Feature', geometry: parsedGeoJson, properties: {} }];
    } else {
      return {
        parsed: parsedGeoJson,
        parseError: 'GeoJSON deve conter uma FeatureCollection ou Feature de Polígono.',
        featureAudits: [],
        problemVertices: [],
        totalIssues: 1,
        verdict: 'Não' as const
      };
    }

    // Process each feature with turf.js
    rawFeatures.forEach((feat, index) => {
      const featId = feat.id || feat.properties?.id || `feat_${index + 1}`;
      const featIssues: ValidationIssue[] = [];
      const geom = feat.geometry;

      if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) {
        const issue: ValidationIssue = {
          id: `iss_${index}_type`,
          featureIndex: index,
          featureId: featId,
          ruleCode: '4.3.0',
          ruleName: 'Geometria Não Poligonal',
          severity: 'error',
          message: `Feição #${featId} possui tipo de geometria '${geom?.type || 'indefinido'}', esperado Polygon ou MultiPolygon.`,
          suggestedFixQgis: 'Filtrar por tipo de geometria ou exportar apenas feições poligonais.'
        };
        featIssues.push(issue);
        issues.push(issue);

        featureAudits.push({
          index,
          id: featId,
          type: geom?.type || 'Desconhecido',
          vertexCount: 0,
          areaHa: 0,
          isClosed: false,
          hasSelfIntersection: false,
          hasDuplicateVertices: false,
          isValidOgc: false,
          issues: featIssues,
          status: 'invalid',
          properties: feat.properties || {},
          coordinates: []
        });
        return;
      }

      // Extract polygon rings
      let rings: [number, number][][] = [];
      if (geom.type === 'Polygon') {
        rings = geom.coordinates;
      } else if (geom.type === 'MultiPolygon' && geom.coordinates.length > 0) {
        rings = geom.coordinates[0]; // Primary polygon of multi
      }

      const exteriorRing = rings[0] || [];
      const vertexCount = exteriorRing.length;

      // 1. Check Ring Closure (RFC 7946 / Protocol Rule 4.3.1)
      let isClosed = false;
      if (vertexCount >= 4) {
        const first = exteriorRing[0];
        const last = exteriorRing[vertexCount - 1];
        isClosed = first[0] === last[0] && first[1] === last[1];
      }

      if (!isClosed) {
        const lastPt = exteriorRing[vertexCount - 1] || [0, 0];
        const issue: ValidationIssue = {
          id: `iss_${index}_unclosed`,
          featureIndex: index,
          featureId: featId,
          ruleCode: '4.3.1',
          ruleName: 'Anel Poligonal Não Fechado',
          severity: 'error',
          message: `O primeiro vértice [${exteriorRing[0]?.join(', ')}] difere do último [${lastPt.join(', ')}].`,
          coordinate: lastPt,
          suggestedFixQgis: 'No QGIS, use a ferramenta "Corrigir Geometrias" (Fix Geometries) ou "Fechar Linhas".'
        };
        featIssues.push(issue);
        issues.push(issue);
        problemVertices.push({
          id: `pv_${index}_unclosed`,
          featureIndex: index,
          featureId: featId,
          coordinate: lastPt,
          ruleCode: '4.3.1',
          ruleName: 'Anel Não Fechado',
          message: 'Vértice terminal não coincide com o vértice inicial.',
          suggestedFixQgis: 'Fix Geometries no QGIS'
        });
      }

      // 2. Self-Intersection Detection using turf.kinks (Rule 4.3.2)
      let hasSelfIntersection = false;
      try {
        if (isClosed && vertexCount >= 4) {
          const turfPoly = turf.polygon(rings);
          const kinksResult = turf.kinks(turfPoly);

          if (kinksResult && kinksResult.features.length > 0) {
            hasSelfIntersection = true;
            kinksResult.features.forEach((kinkPoint, kIdx) => {
              const [kLng, kLat] = kinkPoint.geometry.coordinates as [number, number];
              const issue: ValidationIssue = {
                id: `iss_${index}_kink_${kIdx}`,
                featureIndex: index,
                featureId: featId,
                ruleCode: '4.3.2',
                ruleName: 'Auto-interseção de Arestas (Kink)',
                severity: 'error',
                message: `Turf.js detectou auto-interseção (nó espúrio) nas coordenadas [${kLng.toFixed(6)}, ${kLat.toFixed(6)}].`,
                coordinate: [kLng, kLat],
                suggestedFixQgis: 'No QGIS, execute "v.clean" (GRASS) com ferramenta "bpol" ou "Fix Geometries" para desatar nós.'
              };
              featIssues.push(issue);
              issues.push(issue);
              problemVertices.push({
                id: `pv_${index}_kink_${kIdx}`,
                featureIndex: index,
                featureId: featId,
                coordinate: [kLng, kLat],
                ruleCode: '4.3.2',
                ruleName: 'Auto-interseção (Kink)',
                message: `Cruzamento inválido de arestas detectado por turf.kinks em [${kLng.toFixed(6)}, ${kLat.toFixed(6)}].`,
                suggestedFixQgis: 'GRASS v.clean ou Fix Geometries no QGIS'
              });
            });
          }
        }
      } catch (err) {
        console.warn('Erro ao processar turf.kinks:', err);
      }

      // 3. Duplicate Consecutive Vertices Check (Rule 4.3.3)
      let hasDuplicateVertices = false;
      for (let i = 0; i < vertexCount - 1; i++) {
        const curr = exteriorRing[i];
        const next = exteriorRing[i + 1];
        if (curr[0] === next[0] && curr[1] === next[1]) {
          hasDuplicateVertices = true;
          const issue: ValidationIssue = {
            id: `iss_${index}_dup_${i}`,
            featureIndex: index,
            featureId: featId,
            ruleCode: '4.3.3',
            ruleName: 'Vértice Consecutivo Duplicado',
            severity: 'warning',
            message: `Vértices adjacentes idênticos na posição ${i} e ${i + 1} em [${curr[0].toFixed(6)}, ${curr[1].toFixed(6)}].`,
            coordinate: [curr[0], curr[1]],
            suggestedFixQgis: 'No QGIS, aplique "Simplificar Geometria" ou "Remover Vértices Duplicados".'
          };
          featIssues.push(issue);
          issues.push(issue);
          problemVertices.push({
            id: `pv_${index}_dup_${i}`,
            featureIndex: index,
            featureId: featId,
            coordinate: [curr[0], curr[1]],
            ruleCode: '4.3.3',
            ruleName: 'Vértice Duplicado',
            message: `Nó redundante consecutivo na posição ${i}.`,
            suggestedFixQgis: 'Remover Vértices Duplicados no QGIS'
          });
        }
      }

      // 4. Geodesic Area Calculation using turf.area (Rule 4.3.4)
      let areaHa = 0;
      try {
        if (isClosed && vertexCount >= 4) {
          const turfPoly = turf.polygon(rings);
          const areaM2 = turf.area(turfPoly);
          areaHa = Number((areaM2 / 10000).toFixed(2));

          if (areaHa < 0.01) {
            const issue: ValidationIssue = {
              id: `iss_${index}_sliver`,
              featureIndex: index,
              featureId: featId,
              ruleCode: '4.3.4',
              ruleName: 'Micro-polígono Espúrio (Sliver)',
              severity: 'warning',
              message: `Área insignificante de ${areaHa} ha (< 0.01 ha). Possível ruído de digitalização.`,
              coordinate: exteriorRing[0],
              suggestedFixQgis: 'No QGIS, execute "Eliminar Polígonos de Fragmento" (Eliminate Selected Polygons).'
            };
            featIssues.push(issue);
            issues.push(issue);
          }
        }
      } catch {
        areaHa = 0;
      }

      // 5. OGC Boolean Valid Check using turf.booleanValid (Rule 4.3.5)
      let isValidOgc = true;
      try {
        if (isClosed && vertexCount >= 4) {
          const turfPoly = turf.polygon(rings);
          isValidOgc = turf.booleanValid(turfPoly);

          if (!isValidOgc && !hasSelfIntersection) {
            const issue: ValidationIssue = {
              id: `iss_${index}_ogc`,
              featureIndex: index,
              featureId: featId,
              ruleCode: '4.3.5',
              ruleName: 'Geometria Inválida pelo Padrão OGC',
              severity: 'error',
              message: `Turf.js booleanValid acusou conformidade OGC falsa para a feição #${featId}.`,
              coordinate: exteriorRing[0],
              suggestedFixQgis: 'Verificar no QGIS através do Verificador de Topologia (Topology Checker).'
            };
            featIssues.push(issue);
            issues.push(issue);
          }
        } else {
          isValidOgc = false;
        }
      } catch {
        isValidOgc = false;
      }

      const hasFatalErrors = featIssues.some((iss) => iss.severity === 'error');
      const status: 'valid' | 'invalid' | 'warning' = hasFatalErrors
        ? 'invalid'
        : featIssues.length > 0
        ? 'warning'
        : 'valid';

      featureAudits.push({
        index,
        id: featId,
        type: geom.type,
        vertexCount,
        areaHa,
        isClosed,
        hasSelfIntersection,
        hasDuplicateVertices,
        isValidOgc,
        issues: featIssues,
        status,
        properties: feat.properties || {},
        coordinates: rings
      });
    });

    const fatalIssuesCount = issues.filter((iss) => iss.severity === 'error').length;
    const verdict = fatalIssuesCount === 0 && featureAudits.length > 0 ? ('Sim' as const) : ('Não' as const);

    return {
      parsed: parsedGeoJson,
      parseError: null,
      featureAudits,
      problemVertices,
      totalIssues: issues.length,
      fatalIssuesCount,
      verdict
    };
  }, [rawInput]);

  // Convert featureAudits to Leaflet items
  const mapFeatures: MapFeatureItem[] = useMemo(() => {
    return auditResult.featureAudits.map((fa) => ({
      index: fa.index,
      id: fa.id,
      status: fa.status,
      areaHa: fa.areaHa,
      coordinates: fa.coordinates,
      issuesCount: fa.issues.length
    }));
  }, [auditResult.featureAudits]);

  // Export structured JSON error log as documentary audit proof
  const handleExportErrorsJSON = () => {
    const errorPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        tool: 'Validador de Topologia Turf.js - Etapa 4.3 Limpar',
        methodology: 'Protocolo Metodológico Luna (2026c)',
        verdict: auditResult.verdict,
        totalFeaturesAudited: auditResult.featureAudits.length,
        totalInconsistencies: auditResult.totalIssues,
        fatalErrorsCount: auditResult.fatalIssuesCount
      },
      problematicVertices: auditResult.problemVertices.map((pv) => ({
        featureId: pv.featureId,
        ruleCode: pv.ruleCode,
        ruleName: pv.ruleName,
        coordinates: {
          longitude: pv.coordinate[0],
          latitude: pv.coordinate[1]
        },
        diagnostic: pv.message,
        recommendedQgisFix: pv.suggestedFixQgis
      })),
      featuresAuditSummary: auditResult.featureAudits.map((fa) => ({
        featureId: fa.id,
        status: fa.status,
        vertexCount: fa.vertexCount,
        areaHectares: fa.areaHa,
        isClosedRing: fa.isClosed,
        hasSelfIntersection: fa.hasSelfIntersection,
        hasDuplicateVertices: fa.hasDuplicateVertices,
        issues: fa.issues.map((iss) => ({
          ruleCode: iss.ruleCode,
          ruleName: iss.ruleName,
          severity: iss.severity,
          message: iss.message,
          coordinates: iss.coordinate,
          fix: iss.suggestedFixQgis
        }))
      }))
    };

    const dataStr = JSON.stringify(errorPayload, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `log_inconsistencias_turfjs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate text report summary
  const generateReportSummaryText = () => {
    let report = `RELATÓRIO DE INCONSISTÊNCIAS TOPOLÓGICAS (TURF.JS - ETAPA 4.3 LIMPAR)\n`;
    report += `Data de Análise: ${new Date().toLocaleString('pt-BR')}\n`;
    report += `Status do Ponto de Checagem: ${auditResult.verdict === 'Sim' ? 'HOMOLOGADO (SEM ERROS)' : 'PARALISADO (ERROS DETECTADOS)'}\n`;
    report += `Total de Feições: ${auditResult.featureAudits.length} | Inconsistências: ${auditResult.totalIssues}\n\n`;

    if (auditResult.problemVertices.length === 0) {
      report += `✓ Nenhuma falha topológica detectada. Polígonos aptos para cálculos de área em SIRGAS 2000.\n`;
    } else {
      report += `DETALHAMENTO DOS VÉRTICES PROBLEMÁTICOS:\n`;
      auditResult.problemVertices.forEach((pv, idx) => {
        report += `${idx + 1}. [Feição #${pv.featureId}] ${pv.ruleCode} - ${pv.ruleName}\n`;
        report += `   Coordenadas: Longitude ${pv.coordinate[0].toFixed(6)}, Latitude ${pv.coordinate[1].toFixed(6)}\n`;
        report += `   Diagnóstico: ${pv.message}\n`;
        report += `   Ação Corretiva QGIS: ${pv.suggestedFixQgis}\n\n`;
      });
    }

    return report;
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawInput(content);
        setSelectedFeatureIndex(null);
      }
    };
    reader.readAsText(file);
  };

  // Send verdict to protocol parent
  const handleApplyToProtocol = () => {
    if (onValidatedToProtocol) {
      const details =
        auditResult.verdict === 'Sim'
          ? `Topologia validada via Turf.js: 0 auto-interseções, anéis fechados e geometrias OGC conformes.`
          : `Interrupção técnica por inconsistência topológica via Turf.js: ${auditResult.fatalIssuesCount} erros fatais detectados.`;
      onValidatedToProtocol(auditResult.verdict, details);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-b-lg p-5 sm:p-6 space-y-6">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>TURF.JS TOPOLOGY ENGINE</span>
            <span>·</span>
            <span>ETAPA 4.3 (LIMPAR DADOS)</span>
            <span>·</span>
            <span>LUNA (2026c)</span>
          </div>
          <h2 className="text-lg font-bold text-slate-900">
            Validador de Topologia GeoJSON com Turf.js & React-Leaflet
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Checagem automática de regras topológicas: detecção de auto-interseções (<code className="font-mono text-purple-700">turf.kinks</code>),
            anéis fechados (RFC 7946), nós duplicados e cálculo geodésico de área em hectares (<code className="font-mono text-purple-700">turf.area</code>).
          </p>
        </div>

        {/* Global Verdict Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`p-3 rounded-lg border flex items-center gap-3 ${
              auditResult.verdict === 'Sim'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            {auditResult.verdict === 'Sim' ? (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            ) : (
              <AlertOctagon className="w-6 h-6 text-rose-600 shrink-0 animate-pulse" />
            )}
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider block font-bold">
                Ponto de Checagem 4.3:
              </span>
              <span className="text-sm font-bold font-mono">
                {auditResult.verdict === 'Sim' ? 'VEREDITO: SIM (100% CONFORME)' : 'VEREDITO: NÃO (PARALISADO)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Buttons & File Uploader */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-mono text-[11px] font-semibold text-slate-600 mr-1">
            Amostras Experimentais:
          </span>
          {SAMPLE_PRESETS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setRawInput(preset.json);
                setSelectedFeatureIndex(null);
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[11px] font-mono transition-colors shadow-2xs"
            >
              {preset.name.split('.')[0]}. {preset.name.split('(')[0].replace(/^\d+\.\s*/, '')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".geojson,.json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Action Buttons: Relatório de Erros & Exportar JSON */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Botão Gerar Relatório de Erros */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Gerar resumo analítico de inconsistências topológicas"
          >
            <FileText className="w-4 h-4" />
            <span>Gerar Relatório de Erros</span>
          </button>

          {/* Botão Exportar Inconsistências (JSON) */}
          <button
            onClick={handleExportErrorsJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Exportar log em formato JSON para auditoria científica"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Exportar Inconsistências (JSON)</span>
          </button>

          {/* Sincronizar com Protocolo Oficial */}
          {onValidatedToProtocol && (
            <button
              onClick={handleApplyToProtocol}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Homologar no Protocolo Oficial</span>
            </button>
          )}
        </div>

        {/* View mode switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setViewMode('leaflet')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'leaflet' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Mapa Leaflet
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tabela de Erros ({auditResult.problemVertices.length})
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`px-3 py-1 rounded transition-colors ${
              viewMode === 'code' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Código GeoJSON
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'leaflet' && (
        <div className="space-y-4">
          <LeafletTopologyMap
            features={mapFeatures}
            problemVertices={auditResult.problemVertices}
            selectedFeatureIndex={selectedFeatureIndex}
            onSelectFeature={(idx) => setSelectedFeatureIndex(idx)}
          />

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between">
            <span className="text-slate-600">
              💡 <strong>Dica Cartográfica:</strong> Clique nos marcadores vermelhos para inspecionar os vértices com erro ou clique nos polígonos para ver o cálculo geodésico de área pelo Turf.js.
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              Coordenadas: CRS84 / WGS 84
            </span>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold font-mono uppercase text-slate-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Painel de Vértices e Inconsistências Detectadas pelo Turf.js:</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">
              Total: {auditResult.problemVertices.length} pontos problemáticos
            </span>
          </div>

          {auditResult.problemVertices.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 border border-emerald-200 rounded-lg text-emerald-800">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
              <strong className="block text-sm">Topologia Conforme 100%</strong>
              <p className="text-xs text-emerald-700 mt-1">
                Nenhum vértice com defeito ou kink detectado pelo Turf.js. Polígonos limpos e prontos para operações espaciais no SIG.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Feição ID</th>
                    <th className="py-2.5 px-3">Regra Protocolo</th>
                    <th className="py-2.5 px-3">Coordenadas [Lng, Lat]</th>
                    <th className="py-2.5 px-3">Diagnóstico Topológico (Turf.js)</th>
                    <th className="py-2.5 px-3">Ação Recomendada (QGIS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {auditResult.problemVertices.map((pv, idx) => (
                    <tr key={pv.id} className="hover:bg-rose-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">#{pv.featureId}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                          {pv.ruleCode} · {pv.ruleName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-700 whitespace-nowrap">
                        {pv.coordinate[0].toFixed(6)}, {pv.coordinate[1].toFixed(6)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-sans text-xs max-w-xs leading-relaxed">
                        {pv.message}
                      </td>
                      <td className="py-2.5 px-3 text-emerald-800 font-sans text-xs">
                        <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono text-slate-700 block mb-0.5">
                          {pv.suggestedFixQgis}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === 'code' && (
        <div className="space-y-3">
          <label className="block text-xs font-bold text-slate-700">
            Editor de Código GeoJSON (RFC 7946):
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={12}
            className="w-full p-3 font-mono text-xs bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Cole seu código GeoJSON aqui..."
          />
        </div>
      )}

      {/* Modal: Relatório de Erros Topológicos */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Resumo de Inconsistências Geográficas (Turf.js)
                </h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 flex-1 overflow-y-auto bg-slate-950 text-emerald-400 p-4 rounded-lg font-mono text-xs leading-relaxed whitespace-pre-wrap">
              {generateReportSummaryText()}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">
                Evidência documental de auditoria conforme Luna (2026c)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generateReportSummaryText());
                    setCopiedReport(true);
                    setTimeout(() => setCopiedReport(false), 2000);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded text-xs font-mono hover:bg-slate-50 text-slate-700"
                >
                  {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedReport ? 'Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  onClick={handleExportErrorsJSON}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-mono hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar JSON</span>
                </button>

                <button
                  onClick={() => setShowReportModal(false)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-medium"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
