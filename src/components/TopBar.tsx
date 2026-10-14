import React from 'react';
import {
  Database,
  FileText,
  Map,
  TrendingUp,
  Globe,
  FolderOpen,
  RotateCcw,
  Lock,
  LayoutDashboard
} from 'lucide-react';
import { WorkflowStatus } from '../types/workflow';

export type AppTab = 'workflow' | 'database' | 'map' | 'analytics' | 'agents' | 'sandbox' | 'methodology';

interface TopBarProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onExportReport: () => void;
  onNewProject?: () => void;
  onPublishWebmap?: () => void;
  onOpenDataSources?: () => void;
  onResetToZero?: () => void;
  status: WorkflowStatus;
  projectName: string;
  isFinished?: boolean;
  currentPhaseId?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  onSelectTab,
  onExportReport,
  onPublishWebmap,
  onOpenDataSources,
  onResetToZero,
  status,
  isFinished = false,
  currentPhaseId = 1
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#e8d0c2] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Header - Strict Requirement: ONLY "MapeIA - Plataforma de produção de mapas jornalísticos interativos" */}
        <button
          type="button"
          onClick={() => onSelectTab('workflow')}
          className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-hidden"
          title="Ir para o Painel Principal de Produção"
        >
          <div className="w-8 h-8 rounded-lg bg-[#7b3819] flex items-center justify-center text-white shrink-0 shadow-xs border border-[#58240f] group-hover:bg-[#58240f] transition-colors">
            <Map className="w-4 h-4 text-[#fbf5e7]" />
          </div>
          <span className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-[#141210] leading-tight">
            MapeIA - Plataforma de produção de mapas jornalísticos interativos
          </span>
        </button>

        {/* Clean, Curated Actions Zone without header menus */}
        <div className="flex items-center gap-2">
          {/* Status Indicator (Ocre / Terra / Rubro / Preto) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[#fbf5e7] border border-[#ecd8b3] rounded-lg text-xs font-mono">
            {status === 'paralisado' ? (
              <span className="flex items-center gap-1.5 text-[#9e1f1f] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#9e1f1f] animate-pulse"></span>
                PARALISADO
              </span>
            ) : status === 'concluido' ? (
              <span className="flex items-center gap-1.5 text-[#c07d19] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#c07d19]"></span>
                CONCLUÍDO
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[#7b3819] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#7b3819]"></span>
                FLUXO ATIVO
              </span>
            )}
          </div>

          {/* Return to Main Control Panel button when viewing other screens */}
          {currentTab !== 'workflow' && (
            <button
              type="button"
              onClick={() => onSelectTab('workflow')}
              className="btn-base btn-sm bg-[#141210] hover:bg-[#24201c] text-white border border-[#58240f] cursor-pointer shadow-xs"
              title="Retornar ao Painel Principal de Controle e Produção"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#c07d19]" />
              <span className="font-semibold">Painel Principal</span>
            </button>
          )}

          {/* 1. Fontes Oficiais - Only accessible in Etapa 1 */}
          {onOpenDataSources && currentPhaseId === 1 && (
            <button
              type="button"
              onClick={onOpenDataSources}
              className="btn-base btn-sm btn-secondary cursor-pointer"
              title="Fontes públicas oficiais (MapBiomas, IBGE, ANA, ANEEL, MMA) e pastas de dados (Apenas Etapa 1)"
            >
              <FolderOpen className="w-3.5 h-3.5 text-[#7b3819]" />
              <span className="hidden sm:inline">Fontes Oficiais</span>
            </button>
          )}

          {/* 2. Auditoria - Inserted immediately after Fontes Oficiais */}
          <button
            type="button"
            onClick={() => onSelectTab(currentTab === 'database' ? 'workflow' : 'database')}
            className={`btn-base btn-sm cursor-pointer transition-all ${
              currentTab === 'database'
                ? 'bg-[#7b3819] text-white border-[#58240f] font-bold shadow-xs'
                : 'btn-secondary text-[#24201c] hover:text-[#7b3819]'
            }`}
            title="Acessar o Banco de Auditoria Científica e registros permanentes SHA-256"
          >
            <Database className="w-3.5 h-3.5 text-[#c07d19]" />
            <span>Auditoria</span>
          </button>

          {/* 3. Métricas e Indicadores - Inserted immediately after Auditoria */}
          <button
            type="button"
            onClick={() => onSelectTab(currentTab === 'analytics' ? 'workflow' : 'analytics')}
            className={`btn-base btn-sm cursor-pointer transition-all ${
              currentTab === 'analytics'
                ? 'bg-[#7b3819] text-white border-[#58240f] font-bold shadow-xs'
                : 'btn-secondary text-[#24201c] hover:text-[#7b3819]'
            }`}
            title="Acessar Métricas e Indicadores estatísticos do protocolo"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#7b3819]" />
            <span className="hidden sm:inline">Métricas e Indicadores</span>
            <span className="sm:hidden">Métricas</span>
          </button>

          {/* 4. Relatório - Kept strictly for the end of the workflow */}
          {(isFinished || currentPhaseId === 6) && (
            <button
              type="button"
              onClick={onExportReport}
              className="btn-base btn-sm bg-[#fbf5e7] hover:bg-[#f5ece6] text-[#7b3819] border border-[#ecd8b3] font-semibold cursor-pointer shadow-xs animate-in fade-in"
              title="Exportar Relatório Científico e Editorial Consolidado (Final do Fluxo)"
            >
              <FileText className="w-3.5 h-3.5 text-[#7b3819]" />
              <span className="hidden md:inline">Relatório</span>
            </button>
          )}

          {/* Publicar Webmap (Available at the end when 100% completed) */}
          {onPublishWebmap && (
            <button
              type="button"
              disabled={!isFinished}
              onClick={isFinished ? onPublishWebmap : undefined}
              className={`btn-base btn-sm transition-all ${
                isFinished
                  ? 'btn-success cursor-pointer shadow-xs'
                  : 'bg-[#faf7f2] text-stone-400 border border-[#e8d0c2] cursor-not-allowed opacity-60'
              }`}
              title={
                isFinished
                  ? 'Publicar e exportar o mapa narrativo final em HTML autônomo'
                  : 'Publicar Mapa: liberado ao final com todas as 64 atividades validadas.'
              }
            >
              {isFinished ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-stone-400" />
              )}
              <span className="hidden sm:inline">Publicar Mapa</span>
            </button>
          )}

          {/* Zerar / Abortar Fluxo */}
          {onResetToZero && (
            <button
              type="button"
              onClick={onResetToZero}
              className="btn-base btn-sm btn-danger-light cursor-pointer"
              title="Limpar todos os dados e reiniciar o protocolo do zero absoluto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Zerar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
