import React, { useState, useId } from 'react';
import {
  Users,
  Layers,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Database,
  Crosshair,
  Terminal,
  Play,
  Pause,
  Info,
  Maximize2,
  Minimize2,
  Sparkles,
  Lock
} from 'lucide-react';
import { AgentRole } from '../types/workflow';

export type DiagramStep = 'all' | 'step1_demand' | 'step2_gis' | 'step3_audit' | 'step4_loop' | 'step5_release';

interface AgentWorkflowDiagramProps {
  currentPhaseId?: number;
  currentActivityNumber?: number;
  isParalyzed?: boolean;
  onSelectAgent?: (role: AgentRole) => void;
}

export const AgentWorkflowDiagram: React.FC<AgentWorkflowDiagramProps> = ({
  currentPhaseId = 1,
  currentActivityNumber = 1,
  isParalyzed = false,
  onSelectAgent
}) => {
  const [selectedAgent, setSelectedAgent] = useState<'reporter' | 'gis_analyst' | 'precision_auditor'>('reporter');
  const [activeStep, setActiveStep] = useState<DiagramStep>('all');
  const [isAnimating, setIsAnimating] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const markerIdPrefix = useId();

  const handleAgentClick = (agent: 'reporter' | 'gis_analyst' | 'precision_auditor') => {
    setSelectedAgent(agent);
    if (onSelectAgent) {
      onSelectAgent(agent);
    }
  };

  // Node positions on 1000x520 SVG coordinate space:
  // Layout in a balanced triangular / cyclical constellation:
  // Repórter (Top Left/Center): (240, 110)
  // Analista SIG (Bottom Left/Center): (240, 410)
  // Auditor de Precisão (Center Right): (760, 260)
  const nodes = {
    reporter: { x: 250, y: 110, w: 260, h: 120 },
    gis_analyst: { x: 250, y: 410, w: 260, h: 120 },
    precision_auditor: { x: 750, y: 260, w: 270, h: 130 },
    qgis_mcp: { x: 90, y: 410, w: 100, h: 70 },
    database_audit: { x: 750, y: 70, w: 140, h: 56 }
  };

  const isEdgeActive = (step: DiagramStep) => {
    if (activeStep === 'all') return true;
    return activeStep === step;
  };

  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-indigo-500' : ''}`}>
      {/* Header bar */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-mono text-indigo-300 font-semibold uppercase tracking-wider">
              Arquitetura Metodológica Multagente
            </span>
            <span className="text-slate-600 font-mono text-xs">/</span>
            <span className="text-[11px] font-mono text-slate-300">
              Protocolo Luna (2026c)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Fluxo de Trabalho & Interação entre Agentes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-2xl font-sans">
            Diagrama vetorial das trocas estruturadas entre o <strong>Repórter Investigativo</strong>, o <strong>Analista SIG (QGIS)</strong> e o <strong>Auditor de Precisão</strong>.
          </p>
        </div>

        {/* Controls & Mode selection */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAnimating(!isAnimating)}
            className={`px-3 py-1.5 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors border ${
              isAnimating
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700 hover:bg-indigo-900'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isAnimating ? 'Pausar animação dos fluxos' : 'Ativar animação dos fluxos vetoriais'}
          >
            {isAnimating ? <Pause className="w-3.5 h-3.5 text-indigo-400" /> : <Play className="w-3.5 h-3.5 text-slate-300" />}
            <span>{isAnimating ? 'Fluxo Ativo' : 'Pausado'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            title={isExpanded ? 'Visualização padrão' : 'Expandir área de trabalho'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Interactive Step Navigator Filter Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center gap-1.5 overflow-x-auto text-xs">
        <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold mr-2 shrink-0">
          Filtro do Circuito:
        </span>
        <button
          type="button"
          onClick={() => setActiveStep('all')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          Visão Completa (Tripartite)
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('step1_demand')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'step1_demand'
              ? 'bg-blue-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          1. Pauta & Demanda (Repórter → SIG)
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('step2_gis')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'step2_gis'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          2. Reprojeção & Cálculo (EPSG:10857)
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('step3_audit')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'step3_audit'
              ? 'bg-purple-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          3. Ponto de Checagem (SIG → Auditor)
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('step4_loop')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'step4_loop'
              ? 'bg-rose-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          4. Não-Conformidade & Rollback sem Reset
        </button>
        <button
          type="button"
          onClick={() => setActiveStep('step5_release')}
          className={`px-2.5 py-1 rounded font-medium text-xs transition-colors shrink-0 ${
            activeStep === 'step5_release'
              ? 'bg-indigo-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
          }`}
        >
          5. Homologação & Publicação (EPSG:3857)
        </button>
      </div>

      {/* SVG Canvas Area */}
      <div className="p-4 sm:p-6 bg-slate-950 select-none overflow-x-auto relative">
        <svg
          viewBox="0 0 1020 540"
          className="w-full min-w-[760px] h-auto drop-shadow-md"
          style={{ maxHeight: isExpanded ? '680px' : '480px' }}
        >
          <defs>
            {/* Markers for arrows */}
            <marker
              id={`${markerIdPrefix}-arrow-blue`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#3b82f6" />
            </marker>

            <marker
              id={`${markerIdPrefix}-arrow-emerald`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>

            <marker
              id={`${markerIdPrefix}-arrow-purple`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#a855f7" />
            </marker>

            <marker
              id={`${markerIdPrefix}-arrow-rose`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f43f5e" />
            </marker>

            <marker
              id={`${markerIdPrefix}-arrow-indigo`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#6366f1" />
            </marker>

            {/* Gradient fills */}
            <linearGradient id="bgGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </linearGradient>

            <linearGradient id="reporterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="gisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="auditorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#581c87" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.95" />
            </linearGradient>

            <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowEmerald" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Canvas Background Grid */}
          <rect width="1020" height="540" fill="#090d16" />
          <g opacity="0.35">
            {Array.from({ length: 26 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="540" stroke="#1e293b" strokeWidth="0.5" />
            ))}
            {Array.from({ length: 14 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 40} x2="1020" y2={i * 40} stroke="#1e293b" strokeWidth="0.5" />
            ))}
          </g>

          {/* Watermark / Protocol Badge */}
          <text x="30" y="35" fill="#475569" fontSize="11" fontFamily="monospace" fontWeight="600">
            METODOLOGIA LUNA (2026c) · CUSTÓDIA CARTOGRÁFICA EM GRAFO DIRIGIDO
          </text>
          <text x="30" y="52" fill="#334155" fontSize="10" fontFamily="monospace">
            Entrada: SIRGAS 2000 (EPSG:4674) ➔ Cálculo: Brasil Albers (EPSG:10857) ➔ Saída Web: (EPSG:3857)
          </text>

          {/* ============================================================== */}
          {/* CONNECTOR PATHS (EDGES) WITH ANIMATIONS                        */}
          {/* ============================================================== */}

          {/* 1. Demanda Editorial: Repórter -> Analista SIG (Downward Left) */}
          <g opacity={isEdgeActive('step1_demand') ? 1 : 0.15} className="transition-opacity duration-300">
            <path
              d="M 230 170 L 230 350"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2.5"
              strokeDasharray={isAnimating ? '6, 6' : 'none'}
              className={isAnimating ? 'animate-flow-dash' : ''}
              markerEnd={`url(#${markerIdPrefix}-arrow-blue)`}
            />
            {/* Label box */}
            <rect x="135" y="245" width="180" height="34" rx="4" fill="#0f172a" stroke="#1e3a8a" strokeWidth="1" />
            <text x="225" y="260" fill="#93c5fd" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              1. Pauta, Escopo & Hipótese
            </text>
            <text x="225" y="272" fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              Delimitação territorial sem vício prévio
            </text>
          </g>

          {/* 2. Processamento Espacial Interno & QGIS MCP Bridge Connection */}
          <g opacity={isEdgeActive('step2_gis') ? 1 : 0.15} className="transition-opacity duration-300">
            {/* Edge to QGIS tool */}
            <path
              d="M 120 410 L 120 370 L 190 370 L 190 410"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4, 4"
            />
            <rect x="25" y="355" width="150" height="26" rx="4" fill="#064e3b" stroke="#059669" strokeWidth="1" />
            <text x="100" y="372" fill="#a7f3d0" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              QGIS LTR (MCP:9559)
            </text>
          </g>

          {/* 3. Submissão ao Ponto de Checagem: Analista SIG -> Auditor de Precisão */}
          <g opacity={isEdgeActive('step3_audit') ? 1 : 0.15} className="transition-opacity duration-300">
            <path
              d="M 380 430 Q 560 450 640 330"
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray={isAnimating ? '6, 6' : 'none'}
              className={isAnimating ? 'animate-flow-dash' : ''}
              markerEnd={`url(#${markerIdPrefix}-arrow-emerald)`}
            />
            {/* Label box */}
            <rect x="430" y="415" width="220" height="36" rx="4" fill="#0f172a" stroke="#065f46" strokeWidth="1" />
            <text x="540" y="430" fill="#6ee7b7" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              3. Submissão para Auditoria (64 Checagens)
            </text>
            <text x="540" y="443" fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              Camadas em EPSG:10857 + GeoPackage
            </text>
          </g>

          {/* 4. Alça de Invalidação / Loop de Correção sem Reset: Auditor -> Analista SIG (Reverse Arrow) */}
          <g opacity={isEdgeActive('step4_loop') ? 1 : 0.15} className="transition-opacity duration-300">
            <path
              d="M 640 280 C 530 270 450 320 380 390"
              fill="none"
              stroke="#f43f5e"
              strokeWidth="2.5"
              strokeDasharray={isAnimating ? '5, 5' : 'none'}
              className={isAnimating ? 'animate-flow-dash' : ''}
              markerEnd={`url(#${markerIdPrefix}-arrow-rose)`}
            />
            {/* Label box */}
            <rect x="420" y="275" width="220" height="38" rx="4" fill="#1c1917" stroke="#e11d48" strokeWidth="1.2" />
            <text x="530" y="291" fill="#fda4af" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              4. NÃO-CONFORMIDADE (Parada Imediata)
            </text>
            <text x="530" y="304" fill="#f43f5e" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              Saneamento cirúrgico SEM reiniciar da Fase 1
            </text>
          </g>

          {/* 5. Homologação & Cadeia de Custódia: Auditor -> Banco de Dados */}
          <g opacity={isEdgeActive('step5_release') ? 1 : 0.15} className="transition-opacity duration-300">
            <path
              d="M 770 195 L 770 135"
              fill="none"
              stroke="#a855f7"
              strokeWidth="2"
              markerEnd={`url(#${markerIdPrefix}-arrow-purple)`}
            />
            <rect x="700" y="145" width="140" height="22" rx="3" fill="#0f172a" stroke="#6b21a8" strokeWidth="1" />
            <text x="770" y="160" fill="#d8b4fe" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              Gravação SHA-256
            </text>
          </g>

          {/* 6. Veredito SIM & Entrega de Camadas Validadas: Auditor -> Repórter */}
          <g opacity={isEdgeActive('step5_release') ? 1 : 0.15} className="transition-opacity duration-300">
            <path
              d="M 640 220 Q 520 120 380 110"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeDasharray={isAnimating ? '6, 6' : 'none'}
              className={isAnimating ? 'animate-flow-dash' : ''}
              markerEnd={`url(#${markerIdPrefix}-arrow-indigo)`}
            />
            {/* Label box */}
            <rect x="430" y="90" width="200" height="36" rx="4" fill="#0f172a" stroke="#4338ca" strokeWidth="1" />
            <text x="530" y="105" fill="#c7d2fe" fontSize="10" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle">
              5. Homologação & Laudo Positivo
            </text>
            <text x="530" y="118" fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">
              Liberação para Narrativa & Webmap (EPSG:3857)
            </text>
          </g>

          {/* ============================================================== */}
          {/* REPOSITÓRIO / BANCO DE AUDITORIA (TOP RIGHT)                  */}
          {/* ============================================================== */}
          <g transform="translate(680, 50)">
            <rect width="180" height="60" rx="8" fill="#0f172a" stroke="#6b21a8" strokeWidth="1.5" />
            <text x="90" y="24" fill="#e9d5ff" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              Banco de Dados de Auditoria
            </text>
            <text x="90" y="42" fill="#a855f7" fontSize="9.5" fontFamily="monospace" textAnchor="middle">
              64 Registros Auditáveis · SHA-256
            </text>
          </g>

          {/* ============================================================== */}
          {/* NODE 1: REPÓRTER INVESTIGATIVO                                 */}
          {/* ============================================================== */}
          <g
            transform={`translate(${nodes.reporter.x - 130}, ${nodes.reporter.y - 60})`}
            className="cursor-pointer group"
            onClick={() => handleAgentClick('reporter')}
          >
            <rect
              width={nodes.reporter.w}
              height={nodes.reporter.h}
              rx="10"
              fill="url(#reporterGrad)"
              stroke={selectedAgent === 'reporter' ? '#60a5fa' : '#2563eb'}
              strokeWidth={selectedAgent === 'reporter' ? 2.5 : 1.5}
              filter={selectedAgent === 'reporter' ? 'url(#glowBlue)' : undefined}
              className="transition-all duration-200"
            />
            {/* Header pill inside */}
            <rect x="12" y="12" width="70" height="18" rx="3" fill="#1e40af" />
            <text x="47" y="24" fill="#dbeafe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              LÍDER / PAUTA
            </text>
            <text x="92" y="25" fill="#93c5fd" fontSize="10" fontFamily="monospace">
              FASE 1: Conceber
            </text>

            <text x="14" y="48" fill="#ffffff" fontSize="13" fontFamily="sans-serif" fontWeight="bold">
              Repórter Investigativo
            </text>
            <text x="14" y="64" fill="#93c5fd" fontSize="10.5" fontFamily="sans-serif">
              Diógenes Luna · Jornalista & Editor
            </text>

            {/* Responsibilities list */}
            <line x1="14" y1="74" x2="246" y2="74" stroke="#1e3a8a" strokeWidth="1" />
            <text x="14" y="90" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              • Delimita hipótese editorial e fontes primárias
            </text>
            <text x="14" y="104" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              • Aprova a publicação nos 3 níveis territoriais
            </text>
          </g>

          {/* ============================================================== */}
          {/* NODE 2: ANALISTA SIG (ESPECIALISTA QGIS)                       */}
          {/* ============================================================== */}
          <g
            transform={`translate(${nodes.gis_analyst.x - 130}, ${nodes.gis_analyst.y - 60})`}
            className="cursor-pointer group"
            onClick={() => handleAgentClick('gis_analyst')}
          >
            <rect
              width={nodes.gis_analyst.w}
              height={nodes.gis_analyst.h}
              rx="10"
              fill="url(#gisGrad)"
              stroke={selectedAgent === 'gis_analyst' ? '#34d399' : '#059669'}
              strokeWidth={selectedAgent === 'gis_analyst' ? 2.5 : 1.5}
              filter={selectedAgent === 'gis_analyst' ? 'url(#glowEmerald)' : undefined}
              className="transition-all duration-200"
            />
            {/* Header pill inside */}
            <rect x="12" y="12" width="60" height="18" rx="3" fill="#065f46" />
            <text x="42" y="24" fill="#d1fae5" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              SIG / QGIS
            </text>
            <text x="82" y="25" fill="#a7f3d0" fontSize="10" fontFamily="monospace">
              FASES 2, 3, 4, 5
            </text>

            <text x="14" y="48" fill="#ffffff" fontSize="13" fontFamily="sans-serif" fontWeight="bold">
              Analista SIG & Cartógrafo
            </text>
            <text x="14" y="64" fill="#6ee7b7" fontSize="10.5" fontFamily="sans-serif">
              QGIS LTR · Geoprocessamento Oficial
            </text>

            {/* Responsibilities list */}
            <line x1="14" y1="74" x2="246" y2="74" stroke="#064e3b" strokeWidth="1" />
            <text x="14" y="90" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              • Ingestão de Shapefile SIRGAS 2000 (EPSG:4674)
            </text>
            <text x="14" y="104" fill="#a7f3d0" fontSize="9" fontFamily="sans-serif" fontWeight="600">
              • Reprojeção OBRIGATÓRIA para EPSG:10857 (Albers)
            </text>
          </g>

          {/* ============================================================== */}
          {/* NODE 3: AUDITOR DE PRECISÃO (LUNA 2026c)                       */}
          {/* ============================================================== */}
          <g
            transform={`translate(${nodes.precision_auditor.x - 135}, ${nodes.precision_auditor.y - 65})`}
            className="cursor-pointer group"
            onClick={() => handleAgentClick('precision_auditor')}
          >
            <rect
              width={nodes.precision_auditor.w}
              height={nodes.precision_auditor.h}
              rx="10"
              fill="url(#auditorGrad)"
              stroke={selectedAgent === 'precision_auditor' ? '#c084fc' : '#9333ea'}
              strokeWidth={selectedAgent === 'precision_auditor' ? 2.5 : 1.5}
              filter={selectedAgent === 'precision_auditor' ? 'url(#glowPurple)' : undefined}
              className="transition-all duration-200"
            />
            {/* Header pill inside */}
            <rect x="12" y="12" width="90" height="18" rx="3" fill="#6b21a8" />
            <text x="57" y="24" fill="#f3e8ff" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
              LUNA (2026c)
            </text>
            <text x="112" y="25" fill="#d8b4fe" fontSize="10" fontFamily="monospace">
              Tolerância Zero
            </text>

            <text x="14" y="48" fill="#ffffff" fontSize="13" fontFamily="sans-serif" fontWeight="bold">
              Auditor de Precisão Metodológica
            </text>
            <text x="14" y="64" fill="#d8b4fe" fontSize="10.5" fontFamily="sans-serif">
              Inspetor de Custódia & Validação Binária
            </text>

            {/* Responsibilities list */}
            <line x1="14" y1="74" x2="256" y2="74" stroke="#581c87" strokeWidth="1" />
            <text x="14" y="90" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              • Checagem binária estrita (Sim / Não) em 64 etapas
            </text>
            <text x="14" y="104" fill="#cbd5e1" fontSize="9" fontFamily="sans-serif">
              • Travamento imediato sem regressão à Fase 1
            </text>
            <text x="14" y="118" fill="#e9d5ff" fontSize="9" fontFamily="sans-serif" fontWeight="600">
              • Assinatura criptográfica com SHA-256
            </text>
          </g>

          {/* Central Diagnostic Status Indicator */}
          <g transform="translate(430, 190)">
            <rect width="180" height="48" rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <circle cx="20" cy="24" r="6" fill={isParalyzed ? '#ef4444' : '#10b981'} />
            <text x="35" y="20" fill="#94a3b8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              ESTADO DO PROTOCOLO:
            </text>
            <text x="35" y="36" fill={isParalyzed ? '#f87171' : '#34d399'} fontSize="11" fontFamily="sans-serif" fontWeight="bold">
              {isParalyzed ? 'Fluxo Paralisado (Rollback)' : 'Circuito Nominal Ativo'}
            </text>
          </g>
        </svg>

        {/* Legend bar underneath the SVG */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 inline-block"></span>
              <span>Concepção Editorial</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block"></span>
              <span>Cálculo & SIG (EPSG:10857)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-purple-500 inline-block"></span>
              <span>Auditoria (Sim/Não)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-rose-500 inline-block"></span>
              <span>Loop de Não-Conformidade</span>
            </span>
          </div>

          <div className="text-slate-500 text-[10px]">
            * Clique em qualquer agente no diagrama para inspecionar parâmetros técnicos
          </div>
        </div>
      </div>

      {/* Detailed Technical Inspector Card for the selected agent */}
      <div className="p-5 bg-white border-t border-slate-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              selectedAgent === 'reporter'
                ? 'bg-blue-100 text-blue-800'
                : selectedAgent === 'gis_analyst'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-purple-100 text-purple-800'
            }`}>
              {selectedAgent === 'reporter' ? (
                <Users className="w-5 h-5" />
              ) : selectedAgent === 'gis_analyst' ? (
                <Layers className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span>AGENTE SELECIONADO NO DIAGRAMA</span>
                <span>·</span>
                <span className="font-semibold text-slate-700">
                  {selectedAgent === 'reporter'
                    ? 'DIÓGENES LUNA'
                    : selectedAgent === 'gis_analyst'
                    ? 'ESPECIALISTA QGIS'
                    : 'AUDITOR LUNA (2026c)'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {selectedAgent === 'reporter' && 'Repórter Investigativo & Líder Editorial'}
                {selectedAgent === 'gis_analyst' && 'Analista SIG & Operador de Cartografia'}
                {selectedAgent === 'precision_auditor' && 'Auditor de Precisão & Inspetor de Custódia'}
              </h3>
            </div>
          </div>

          {/* Quick switcher tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => handleAgentClick('reporter')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedAgent === 'reporter'
                  ? 'bg-white text-blue-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repórter
            </button>
            <button
              type="button"
              onClick={() => handleAgentClick('gis_analyst')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedAgent === 'gis_analyst'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analista SIG
            </button>
            <button
              type="button"
              onClick={() => handleAgentClick('precision_auditor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                selectedAgent === 'precision_auditor'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Auditor de Precisão
            </button>
          </div>
        </div>

        {/* 3-column Technical breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Entrada de Dados (Inputs)
            </span>
            {selectedAgent === 'reporter' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Denúncias territoriais, documentos públicos, declarações de fontes e demandas de interesse jornalístico. Sem territórios ou hipóteses pré-fabricadas.
              </p>
            )}
            {selectedAgent === 'gis_analyst' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Shapefiles oficiais (.shp, .shx, .dbf, .prj) fornecidos em <strong>SIRGAS 2000 (EPSG:4674)</strong> por órgãos públicos federais e estaduais.
              </p>
            )}
            {selectedAgent === 'precision_auditor' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Camadas métricas calculadas em <strong>EPSG:10857</strong>, logs de geoprocessamento do QGIS e dados topológicos sanitizados pelo Analista SIG.
              </p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Operações Críticas & Regras
            </span>
            {selectedAgent === 'reporter' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Estruturação da pauta nas 3 escalas territoriais (Regional, Local, Detalhe). Validação do enquadramento ético e verificação fática.
              </p>
            )}
            {selectedAgent === 'gis_analyst' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Reprojeção mandatória e antecedente para <strong>SIRGAS 2000 Brasil Albers (EPSG:10857)</strong>. 100% dos cálculos de área conduzidos estritamente nesta projeção.
              </p>
            )}
            {selectedAgent === 'precision_auditor' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Avaliação estrita binária (Sim/Não) nos 64 pontos de checagem de Luna (2026c). Se 'Não', trava o avanço e orienta correção pontual sem reiniciar da 1ª etapa.
              </p>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-mono text-[10px] uppercase font-bold text-slate-500 block mb-1">
              Saída & Garantia de Custódia
            </span>
            {selectedAgent === 'reporter' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Reportagem investigativa finalizada e webmap publicado para a sociedade civil com narrativa respaldada em dados auditados.
              </p>
            )}
            {selectedAgent === 'gis_analyst' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                GeoPackage de cálculo <code className="font-mono text-[11px] bg-slate-200 px-1 py-0.5 rounded">dados_calculos.gpkg</code> em EPSG:10857 e conversão final para Web Mercator (EPSG:3857).
              </p>
            )}
            {selectedAgent === 'precision_auditor' && (
              <p className="text-slate-700 leading-relaxed font-sans">
                Registro pericial com carimbo cronológico, evidência fática e assinatura criptográfica com hash SHA-256 no banco de dados.
              </p>
            )}
          </div>
        </div>

        {/* Workflow interaction highlights box */}
        <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Circuito Fechado de Integridade:</strong> Qualquer inconformidade detectada pelo Auditor de Precisão impede o avanço de fase, acionando o Analista SIG para retificação imediata.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-slate-500">
            <span>Fase Ativa: Fase {currentPhaseId}</span>
            <span>·</span>
            <span>Atividade: #{currentActivityNumber}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
