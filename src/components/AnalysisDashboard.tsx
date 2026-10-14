import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ComposedChart,
  Cell
} from 'recharts';
import { METHODOLOGY_PHASES } from '../data/methodologyData';
import { AuditRecord, DatabaseAdjustment, ProjectMetadata } from '../types/workflow';
import { downloadAuditDossierPdf } from '../services/pdfExportService';
import { INITIAL_PROJECT_METADATA } from '../data/methodologyData';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Layers,
  BarChart3,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  Flame
} from 'lucide-react';

interface AnalysisDashboardProps {
  records: AuditRecord[];
  project?: ProjectMetadata | null;
  adjustments?: DatabaseAdjustment[];
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  records,
  project,
  adjustments = []
}) => {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<number | 'all'>('all');
  const [chartMetric, setChartMetric] = useState<'both' | 'progress' | 'time'>('both');

  // Benchmark reference times in minutes for typical geojournalism tasks (Luna, 2026c)
  const BENCHMARKS: Record<number, number> = {
    1: 4.5, // Conceber (Pauta e fontes)
    2: 6.2, // Compilar (Download e modelagem)
    3: 14.8, // Limpar (Topologia, reprojeção e remoção de ruídos)
    4: 18.5, // Contextualizar (Interseções e CRS Albers)
    5: 22.4, // Analisar (Cálculo de áreas em ha e classificações)
    6: 12.0 // Comunicar (Design em 3 níveis e Gemini IAG)
  };

  // Detailed phase-by-phase analytics calculation
  const phaseMetrics = useMemo(() => {
    return METHODOLOGY_PHASES.map((phase) => {
      const phaseRecords = records.filter((r) => r.phaseId === phase.id);
      const totalActivities = phase.activities.length;
      const evaluated = phaseRecords.length;
      const simCount = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
      const naoCount = phaseRecords.filter((r) => r.evaluation === 'Não').length;

      const completionRate = Number(((simCount / totalActivities) * 100).toFixed(1));
      const successRate = evaluated > 0 ? Number(((simCount / evaluated) * 100).toFixed(1)) : 100;

      // Calculate observed average time in minutes between consecutive records
      let avgTimeMin = BENCHMARKS[phase.id] || 8.0;

      if (phaseRecords.length >= 2) {
        const sorted = [...phaseRecords].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let totalDeltas = 0;
        let countDeltas = 0;

        for (let i = 1; i < sorted.length; i++) {
          const deltaMinutes =
            (new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) /
            60000;
          if (deltaMinutes > 0.05 && deltaMinutes < 180) {
            totalDeltas += deltaMinutes;
            countDeltas++;
          }
        }

        if (countDeltas > 0) {
          avgTimeMin = Number((totalDeltas / countDeltas).toFixed(1));
        }
      }

      const totalEstimatedMinutes = Number((avgTimeMin * Math.max(1, evaluated)).toFixed(1));

      return {
        id: phase.id,
        code: phase.code,
        name: phase.name,
        displayName: `${phase.code} ${phase.name}`,
        totalActivities,
        evaluated,
        validadasSim: simCount,
        errosNao: naoCount,
        progressoPct: completionRate,
        taxaSucessoPct: successRate,
        tempoMedioMin: avgTimeMin,
        benchmarkMin: BENCHMARKS[phase.id] || 10.0,
        tempoTotalEstMin: totalEstimatedMinutes,
        status: simCount === totalActivities ? 'Concluída' : simCount > 0 ? 'Em Andamento' : 'Pendente'
      };
    });
  }, [records]);

  // Overall Totals & KPIs
  const totalActivities = 64;
  const totalValidated = records.filter((r) => r.evaluation === 'Sim').length;
  const totalErrors = records.filter((r) => r.evaluation === 'Não').length;
  const overallProgressionPct = Number(((totalValidated / totalActivities) * 100).toFixed(1));

  const overallSuccessRate =
    records.length > 0 ? Number(((totalValidated / records.length) * 100).toFixed(1)) : 100;

  const avgExecutionTimeOverall = useMemo(() => {
    const sum = phaseMetrics.reduce((acc, p) => acc + p.tempoMedioMin, 0);
    return Number((sum / phaseMetrics.length).toFixed(1));
  }, [phaseMetrics]);

  const totalTimeSpentEstimatedHours = useMemo(() => {
    const sumMin = phaseMetrics.reduce((acc, p) => acc + p.tempoTotalEstMin, 0);
    return Number((sumMin / 60).toFixed(1));
  }, [phaseMetrics]);

  // Timeline series for cumulative validation progression over time
  const timelineData = useMemo(() => {
    if (records.length === 0) {
      return [
        {
          index: 0,
          activityCode: 'Início',
          time: '00:00',
          validadasCumulativas: 0,
          metaTotal: totalActivities,
          taxaPrecisao: 100,
          isSim: 0
        }
      ];
    }

    const sorted = [...records].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let cumulativeSim = 0;
    let totalChecked = 0;

    return sorted.map((rec, i) => {
      if (rec.evaluation === 'Sim') cumulativeSim++;
      totalChecked++;

      const dateObj = new Date(rec.timestamp);
      const timeLabel = `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;

      return {
        index: i + 1,
        activityCode: `${rec.phaseName.slice(0, 4)} #${rec.activityNumber}`,
        time: timeLabel,
        validadasCumulativas: cumulativeSim,
        metaTotal: totalActivities,
        taxaPrecisao: Number(((cumulativeSim / totalChecked) * 100).toFixed(1)),
        isSim: rec.evaluation === 'Sim' ? 1 : 0
      };
    });
  }, [records]);

  // Filtered dataset for charts
  const chartData = useMemo(() => {
    if (selectedPhaseFilter === 'all') return phaseMetrics;
    return phaseMetrics.filter((p) => p.id === selectedPhaseFilter);
  }, [phaseMetrics, selectedPhaseFilter]);

  // Export analytics CSV
  const handleExportCSV = () => {
    const header = [
      'Fase_ID',
      'Codigo',
      'Nome_Fase',
      'Total_Atividades',
      'Atividades_Validadas_Sim',
      'Erros_Detectados_Nao',
      'Progresso_Conclusao_Pct',
      'Taxa_Precisao_Pct',
      'Tempo_Medio_Execucao_Min',
      'Benchmark_Min',
      'Tempo_Total_Min'
    ].join(';');

    const rows = phaseMetrics.map((p) =>
      [
        p.id,
        `"${p.code}"`,
        `"${p.name}"`,
        p.totalActivities,
        p.validadasSim,
        p.errosNao,
        p.progressoPct,
        p.taxaSucessoPct,
        p.tempoMedioMin,
        p.benchmarkMin,
        p.tempoTotalEstMin
      ].join(';')
    );

    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metricas_precisao_geojornalismo_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const targetProject = project || INITIAL_PROJECT_METADATA;
    downloadAuditDossierPdf(targetProject, records, adjustments, {
      includeFullAuditTrail: true,
      includeAdjustments: true,
      includeMethodologyStatement: true
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Dashboard Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-lg bg-blue-600/10 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <span className="font-semibold uppercase tracking-wider text-slate-700">
                  Dashboard Analítico de Precisão
                </span>
                <span>·</span>
                <span>RECHARTS ENGINE</span>
                <span>·</span>
                <span>BERRET ET AL. (2023)</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
                Progressão de Validações & Tempo Médio de Execução
              </h1>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl leading-relaxed">
                Monitoramento estatístico contínuo das 64 atividades críticas do protocolo geojornalístico.
                Métricas dinâmicas calculadas a partir dos registros de auditoria persistidos no banco de dados.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              title="Gerar e baixar prova documental em PDF (jspdf)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Laudo PDF</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors shadow-xs"
              title="Exportar métricas de precisão em formato CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar Dados (CSV)</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-5 border-t border-slate-100">
          {/* KPI 1: Progresso Global */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span>PROGRESSO GERAL</span>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                {overallProgressionPct}%
              </span>
              <span className="text-xs font-mono text-slate-600">
                ({totalValidated}/{totalActivities})
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressionPct}%` }}
              />
            </div>
          </div>

          {/* KPI 2: Taxa de Precisão Factual */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span>PRECISÃO FACTUAL</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-700 tracking-tight">
                {overallSuccessRate}%
              </span>
              <span className="text-xs font-mono text-slate-500">
                ({totalValidated} Sim / {records.length} tot.)
              </span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              {totalErrors === 0 ? (
                <span className="text-emerald-600 font-semibold">Zero imprecisões no fluxo</span>
              ) : (
                <span className="text-rose-600 font-semibold">{totalErrors} erro(s) retificado(s)</span>
              )}
            </div>
          </div>

          {/* KPI 3: Tempo Médio de Execução */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span>TEMPO MÉDIO / ATIVIDADE</span>
              <Clock className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-purple-700 tracking-tight">
                {avgExecutionTimeOverall} min
              </span>
              <span className="text-xs font-mono text-slate-500">por checkpoint</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              Tempo total estimado: <strong>{totalTimeSpentEstimatedHours} horas</strong>
            </div>
          </div>

          {/* KPI 4: Fase Mais Crítica */}
          <div className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
              <span>FASE DE MAIOR ESFORÇO</span>
              <Flame className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-slate-900 tracking-tight truncate">
                4.3 Limpar
              </span>
              <span className="text-xs font-mono text-amber-700 font-semibold">23 ativ.</span>
            </div>
            <div className="text-[11px] font-mono text-slate-500 mt-2">
              Tempo benchmark: <strong>14.8 min/ativ.</strong> (QGIS)
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="font-semibold text-slate-700">Filtrar por Fase:</span>
          <select
            value={selectedPhaseFilter}
            onChange={(e) =>
              setSelectedPhaseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="p-1.5 rounded border border-slate-300 font-mono text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">Todas as 6 Fases do Protocolo</option>
            {METHODOLOGY_PHASES.map((p) => (
              <option key={p.id} value={p.id}>
                Fase {p.code} - {p.name} ({p.activities.length} checkpoints)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded font-mono text-[11px]">
          <button
            onClick={() => setChartMetric('both')}
            className={`px-2.5 py-1 rounded transition-colors ${
              chartMetric === 'both' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Visão Combinada
          </button>
          <button
            onClick={() => setChartMetric('progress')}
            className={`px-2.5 py-1 rounded transition-colors ${
              chartMetric === 'progress' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Apenas Progressão
          </button>
          <button
            onClick={() => setChartMetric('time')}
            className={`px-2.5 py-1 rounded transition-colors ${
              chartMetric === 'time' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
            }`}
          >
            Apenas Tempo
          </button>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Progressão de Validações por Fase */}
        {(chartMetric === 'both' || chartMetric === 'progress') && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Progressão de Validações por Fase (Sim vs. Total)
                </h2>
                <span className="text-[11px] font-mono text-slate-500">Unidades: Atividades</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Compara as atividades homologadas com a meta de cada fase do protocolo (Luna, 2026c).
              </p>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono border border-slate-800 space-y-1">
                              <p className="font-bold text-blue-400">
                                {data.code}: {data.name}
                              </p>
                              <p className="text-emerald-400">
                                Validadas (Sim): {data.validadasSim} de {data.totalActivities}
                              </p>
                              {data.errosNao > 0 && (
                                <p className="text-rose-400">Erros Acusados (Não): {data.errosNao}</p>
                              )}
                              <p className="text-slate-300">Conclusão: {data.progressoPct}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="totalActivities"
                      name="Meta da Fase (Total de Checkpoints)"
                      fill="#cbd5e1"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="validadasSim"
                      name="Validadas ('Sim')"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="errosNao"
                      name="Rastros de Erro ('Não')"
                      fill="#f43f5e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Métrica de Precisão Binária (Luna, 2026c)</span>
              <span className="font-semibold text-emerald-700">
                {totalValidated} de 64 atividades validadas
              </span>
            </div>
          </div>
        )}

        {/* Chart 2: Tempo Médio de Execução das Atividades */}
        {(chartMetric === 'both' || chartMetric === 'time') && (
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-600" />
                  Tempo Médio de Execução das Atividades (minutos)
                </h2>
                <span className="text-[11px] font-mono text-slate-500">Unidade: Minutos</span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Tempo médio observado entre checkpoints comparado ao benchmark metodológico de referência.
              </p>

              <div className="w-full h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="code"
                      tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono border border-slate-800 space-y-1">
                              <p className="font-bold text-purple-400">
                                {data.code}: {data.name}
                              </p>
                              <p className="text-purple-300">Tempo Médio Real: {data.tempoMedioMin} min/ativ.</p>
                              <p className="text-slate-400">Benchmark Previsto: {data.benchmarkMin} min/ativ.</p>
                              <p className="text-slate-300">Tempo Total da Etapa: ~{data.tempoTotalEstMin} min</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar
                      dataKey="tempoMedioMin"
                      name="Tempo Médio Observado (min)"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                    <Line
                      type="monotone"
                      dataKey="benchmarkMin"
                      name="Benchmark de Referência (min)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#f59e0b' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Fonte: Protocolo Metodológico Luna (2026c)</span>
              <span className="font-semibold text-purple-700">Média Global: {avgExecutionTimeOverall} min</span>
            </div>
          </div>
        )}
      </div>

      {/* Chart 3: Evolução Cronológica Contínua (Timeline Progression) */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            Curva de Validação Cumulativa ao Longo do Tempo
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Evolução por Checkpoint</span>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Visualização da trajetória de avanço das atividades validadas registradas na trilha de auditoria do banco de dados.
        </p>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorValidadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 64]}
                tick={{ fontSize: 11, fontFamily: 'monospace', fill: '#475569' }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-lg text-xs font-mono border border-slate-800 space-y-1">
                        <p className="font-bold text-blue-400">Atividade #{data.index}</p>
                        <p className="text-emerald-400">Validadas Cumulativas: {data.validadasCumulativas} de 64</p>
                        <p className="text-slate-300">Horário: {data.time}</p>
                        <p className="text-slate-400">Precisão Acumulada: {data.taxaPrecisao}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="validadasCumulativas"
                name="Validações Concluídas"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorValidadas)"
              />
              <Line
                type="monotone"
                dataKey="metaTotal"
                name="Meta Total (64 Atividades)"
                stroke="#cbd5e1"
                strokeDasharray="5 5"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tabular Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs overflow-hidden">
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-slate-700" />
          Tabela Analítica por Fase do Fluxo Geojornalístico
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Fase</th>
                <th className="py-2.5 px-3">Etapa</th>
                <th className="py-2.5 px-3 text-center">Meta Ativ.</th>
                <th className="py-2.5 px-3 text-center">Validadas</th>
                <th className="py-2.5 px-3 text-center">Erros</th>
                <th className="py-2.5 px-3 text-center">Progresso</th>
                <th className="py-2.5 px-3 text-center">Taxa Precisão</th>
                <th className="py-2.5 px-3 text-center">Tempo Médio</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {phaseMetrics.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2 px-3 font-bold text-slate-900">{p.code}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-800">{p.name}</td>
                  <td className="py-2 px-3 text-center text-slate-600">{p.totalActivities}</td>
                  <td className="py-2 px-3 text-center font-bold text-emerald-700">{p.validadasSim}</td>
                  <td className="py-2 px-3 text-center font-bold text-rose-600">
                    {p.errosNao > 0 ? p.errosNao : '-'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="font-bold text-slate-800">{p.progressoPct}%</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className={p.taxaSucessoPct === 100 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {p.taxaSucessoPct}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center text-slate-700">
                    {p.tempoMedioMin} min <span className="text-slate-400 text-[10px]">({p.benchmarkMin}m)</span>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'Concluída'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Em Andamento'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
