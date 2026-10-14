import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { METHODOLOGY_PHASES } from '../data/methodologyData';
import { AuditRecord, DatabaseAdjustment, ProjectMetadata } from '../types/workflow';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ShieldCheck,
  Activity,
  Award
} from 'lucide-react';

interface PrecisionAnalyticsViewProps {
  records: AuditRecord[];
  adjustments: DatabaseAdjustment[];
  project: ProjectMetadata;
}

export const PrecisionAnalyticsView: React.FC<PrecisionAnalyticsViewProps> = ({
  records,
  adjustments,
  project
}) => {
  // Benchmark reference times in minutes for typical geojournalism tasks
  const BENCHMARKS: Record<number, number> = {
    1: 4.5,
    2: 6.2,
    3: 14.8,
    4: 18.5,
    5: 22.4,
    6: 12.0
  };

  // Compute analytics data per phase
  const phaseAnalytics = useMemo(() => {
    return METHODOLOGY_PHASES.map((phase) => {
      const phaseRecords = records.filter((r) => r.phaseId === phase.id);
      const totalEvaluated = phaseRecords.length;
      const simCount = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
      const naoCount = phaseRecords.filter((r) => r.evaluation === 'Não').length;

      const successRate =
        totalEvaluated > 0
          ? Number(((simCount / totalEvaluated) * 100).toFixed(1))
          : 100;

      // Calculate average time in minutes between consecutive records in this phase
      let avgTime = BENCHMARKS[phase.id] || 8.0;
      if (phaseRecords.length >= 2) {
        const sorted = [...phaseRecords].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        let totalDeltaMinutes = 0;
        let validDeltas = 0;

        for (let i = 1; i < sorted.length; i++) {
          const deltaMs =
            new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime();
          const deltaMin = deltaMs / 60000;
          if (deltaMin > 0.1 && deltaMin < 180) {
            totalDeltaMinutes += deltaMin;
            validDeltas++;
          }
        }

        if (validDeltas > 0) {
          avgTime = Number((totalDeltaMinutes / validDeltas).toFixed(1));
        }
      }

      return {
        id: phase.id,
        code: phase.code,
        name: phase.name,
        shortName: `${phase.code} ${phase.name}`,
        totalActivities: phase.activities.length,
        evaluated: totalEvaluated,
        aprovados: simCount,
        erros: naoCount,
        taxaSucesso: successRate,
        tempoMedioMin: avgTime
      };
    });
  }, [records]);

  // Overall KPIs
  const totalSim = records.filter((r) => r.evaluation === 'Sim').length;
  const totalNao = records.filter((r) => r.evaluation === 'Não').length;
  const overallSuccessRate =
    records.length > 0
      ? Number(((totalSim / records.length) * 100).toFixed(1))
      : 100;

  const avgOverallTime = useMemo(() => {
    const totalTime = phaseAnalytics.reduce((acc, p) => acc + p.tempoMedioMin, 0);
    return Number((totalTime / phaseAnalytics.length).toFixed(1));
  }, [phaseAnalytics]);

  // Data for Pie Chart (Distribution of outcomes)
  const distributionData = [
    { name: 'Validados sem Erro ("Sim")', value: totalSim || 1, color: '#10b981' },
    { name: 'Rastros de Erro Paralisados ("Não")', value: totalNao || 0, color: '#f43f5e' },
    { name: 'Retificações / Ajustes', value: adjustments.length || 0, color: '#f59e0b' }
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
            <span>TAXA GLOBAL DE PRECISÃO</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {overallSuccessRate}%
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              Métrica Binária
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {totalSim} aprovações em {records.length} checagens auditadas.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
            <span>TEMPO MÉDIO POR FASE</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {avgOverallTime}
            </span>
            <span className="text-xs font-mono text-slate-500">minutos / fase</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cadência de validação dos dados no QGIS e SIG.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
            <span>RASTROS DE ERRO DETECTADOS</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalNao}
            </span>
            <span className="text-[11px] font-mono text-rose-700 font-semibold">
              {totalNao === 0 ? 'Zero Falhas' : 'Paradas de Auditoria'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            "Deixar o rastro do erro" (Luna, 2026c).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
            <span>FASE DE MAIOR CRITICIDADE</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold font-mono text-slate-900 truncate">
              4.5 Analisar
            </span>
            <span className="text-[11px] font-mono text-slate-500">19 ativ.</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Cálculos de área em Albers e SF_intersection.
          </p>
        </div>
      </div>

      {/* Main Charts Grid: Taxa de Sucesso & Tempo Médio por Fase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Taxa de Sucesso por Fase do Projeto (BarChart) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>MÉTRICA BINÁRIA (SIM/NÃO)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Taxa de Sucesso por Fase do Projeto (%)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Meta: 100%</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={phaseAnalytics}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="code"
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs font-mono border border-slate-800">
                          <p className="font-bold text-slate-100 mb-1">
                            Fase {data.shortName}
                          </p>
                          <p className="text-emerald-400">
                            Taxa de Sucesso: <strong>{data.taxaSucesso}%</strong>
                          </p>
                          <p className="text-slate-300">
                            Aprovadas (Sim): {data.aprovados} / {data.totalActivities}
                          </p>
                          {data.erros > 0 && (
                            <p className="text-rose-400">
                              Erros acusados (Não): {data.erros}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="taxaSucesso"
                  name="Taxa de Sucesso (%)"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                >
                  {phaseAnalytics.map((entry) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.taxaSucesso === 100 ? '#10b981' : entry.taxaSucesso >= 80 ? '#f59e0b' : '#f43f5e'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Fonte: Registros auditados em IndexedDB</span>
            <span className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> 100%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> &ge;80%
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500"></span> &lt;80%
              </span>
            </span>
          </div>
        </div>

        {/* Chart 2: Tempo Médio de Validação por Fase (LineChart / BarChart) */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>CADÊNCIA OPERACIONAL (SIG/QGIS)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                Tempo Médio de Validação por Fase (Minutos)
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-500">Unidade: Minutos</span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={phaseAnalytics}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="code"
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                />
                <YAxis
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
                  unit="m"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded shadow-lg text-xs font-mono border border-slate-800">
                          <p className="font-bold text-slate-100 mb-1">
                            Fase {data.shortName}
                          </p>
                          <p className="text-blue-400">
                            Tempo Médio: <strong>{data.tempoMedioMin} minutos</strong>
                          </p>
                          <p className="text-slate-400 text-[10px]">
                            {data.totalActivities} atividades parametrizadas
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="tempoMedioMin"
                  name="Tempo Médio (min)"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1.5, stroke: '#ffffff' }}
                  activeDot={{ r: 6, fill: '#1d4ed8' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Fases 4.4 e 4.5 demandam cálculos espaciais de maior complexidade</span>
            <span className="text-blue-700 font-semibold">
              Pico: {Math.max(...phaseAnalytics.map((p) => p.tempoMedioMin))}m
            </span>
          </div>
        </div>
      </div>

      {/* Comparative Analytical Table of Phases */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-semibold text-xs text-slate-800 font-mono uppercase tracking-wider">
            Matriz Detalhada de Precisão por Fase Metodológica
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            Luna (2026c)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] text-slate-500">
                <th className="py-2.5 px-4">Código</th>
                <th className="py-2.5 px-4">Fase Metodológica</th>
                <th className="py-2.5 px-4 text-center">Atividades</th>
                <th className="py-2.5 px-4 text-center">Aprovadas ("Sim")</th>
                <th className="py-2.5 px-4 text-center">Erros ("Não")</th>
                <th className="py-2.5 px-4 text-right">Taxa de Sucesso</th>
                <th className="py-2.5 px-4 text-right">Tempo Médio Estimado</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {phaseAnalytics.map((p) => {
                const isComplete = p.aprovados === p.totalActivities;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-800">{p.code}</td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      {p.name}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-slate-600">
                      {p.totalActivities}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-emerald-700 font-semibold">
                      {p.aprovados}
                    </td>
                    <td className="py-3 px-4 text-center tabular-nums text-rose-700 font-semibold">
                      {p.erros}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span
                        className={`font-semibold ${
                          p.taxaSucesso === 100
                            ? 'text-emerald-700'
                            : p.taxaSucesso >= 80
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {p.taxaSucesso.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700">
                      {p.tempoMedioMin.toFixed(1)} min
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isComplete ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          CONCLUÍDO
                        </span>
                      ) : p.erros > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                          PARALISADO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                          EM ANDAMENTO
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
