import React, { useState, useEffect, useMemo } from 'react';
import { METHODOLOGY_PHASES, EMPTY_PROJECT_METADATA } from './data/methodologyData';
import {
  AuditRecord,
  DatabaseAdjustment,
  ProjectMetadata,
  ActivityDefinition,
  PhaseDefinition
} from './types/workflow';
import { dbService, generateAuditHash } from './services/db';
import { TopBar, AppTab } from './components/TopBar';
import { WebmapProductionHero } from './components/WebmapProductionHero';
import { OverallProgressBar } from './components/OverallProgressBar';
import { WorkflowStepper } from './components/WorkflowStepper';
import { ActivityCard } from './components/ActivityCard';
import { ParalyzedAlert } from './components/ParalyzedAlert';
import { AuditDatabaseView } from './components/AuditDatabaseView';
import { InteractiveMapPreview } from './components/InteractiveMapPreview';
import { MethodologyDocModal } from './components/MethodologyDocModal';
import { ProjectConfigModal } from './components/ProjectConfigModal';
import { ReportViewerModal } from './components/ReportViewerModal';
import { MethodologicalSandbox } from './components/MethodologicalSandbox';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ActivityValidationErrorModal } from './components/ActivityValidationErrorModal';
import { ProtocolFlightRecorderModal } from './components/ProtocolFlightRecorderModal';
import { PublishedWebmapModal } from './components/PublishedWebmapModal';
import { DataSourcesAndStorageModal } from './components/DataSourcesAndStorageModal';
import { AgentsView } from './components/AgentsView';
import { JournalisticDesignEngine } from './components/JournalisticDesignEngine';
import { generatePublishedWebmapHtml } from './services/webmapPublicationService';
import { qgisMcpService } from './services/qgisMcpService';
import { QgisMcpStatus, ActivityValidationErrorData } from './types/workflow';
import {
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  ArrowLeft,
  Database,
  Layers,
  Sparkles,
  FileText,
  ShieldCheck,
  RotateCcw,
  Users,
  Cpu,
  Terminal,
  Lock,
  FolderOpen,
  Search
} from 'lucide-react';

export default function App() {
  const [project, setProject] = useState<ProjectMetadata | null>(null);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  const [adjustments, setAdjustments] = useState<DatabaseAdjustment[]>([]);
  const [currentPhaseId, setCurrentPhaseId] = useState<number>(1);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('p1_a1');
  const [activeTab, setActiveTab] = useState<AppTab>('workflow');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isPublishWebmapOpen, setIsPublishWebmapOpen] = useState(false);
  const [isDataSourcesOpen, setIsDataSourcesOpen] = useState(false);
  const [isDesignEngineOpen, setIsDesignEngineOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if all 64 activities are validated
  const isFinished = useMemo(() => {
    return auditRecords.filter((r) => r.evaluation === 'Sim').length === 64 || project?.status === 'concluido';
  }, [auditRecords, project]);

  // Error Diagnosis Modal State
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [errorModalActivity, setErrorModalActivity] = useState<ActivityDefinition | null>(null);
  const [errorModalPhase, setErrorModalPhase] = useState<PhaseDefinition | null>(null);
  const [errorModalData, setErrorModalData] = useState<Partial<ActivityValidationErrorData> | null>(null);

  // QGIS MCP Integration State
  const [qgisStatus, setQgisStatus] = useState<QgisMcpStatus>({
    isRunning: false,
    pid: null,
    processDetails: null,
    mcpBridgeSupported: true,
    connectionMode: 'none',
    isConnected: false,
    mcpPort: 9559,
    connectedAt: null,
    checkedAt: new Date().toISOString()
  });

  // Handler to Abort Flow immediately and start completely from zero
  const handleAbortFlow = async () => {
    try {
      await dbService.resetToInitial();
      const cleanProj: ProjectMetadata = {
        ...EMPTY_PROJECT_METADATA,
        id: 'proj_geojor_novo',
        title: '',
        territoryDescription: '',
        targetObject: '',
        regionalLayerName: '',
        localLayerName: '',
        detailLayerName: '',
        rawDownloadFormat: 'Shapefile (.shp, .shx, .dbf, .prj)',
        rawDownloadCrs: 'SIRGAS 2000 Brasil (EPSG:4674)',
        calculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
        outputCrs: 'EPSG:3857 (Web Mercator para Mapa Interativo)',
        status: 'nao_iniciado',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await dbService.saveProjectMetadata(cleanProj);
      setProject(cleanProj);
      setAuditRecords([]);
      setAdjustments([]);
      setCurrentPhaseId(1);
      setSelectedActivityId('p1_a1');

      await dbService.recordProtocolEvent({
        id: `evt_abort_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phaseId: 1,
        activityId: 'p1_a1',
        activityNumber: 1,
        agentRole: 'reporter',
        agentName: 'Diógenes Luna (Repórter)',
        eventType: 'flow_aborted',
        title: 'Fluxo Anterior Abortado pelo Usuário',
        description: 'Fluxo abortado conforme comando do usuário. Registros anteriores e pauta pré-definida apagados. Aplicação iniciada do zero sem informações pré-concebidas.',
        status: 'warning'
      });
    } catch (err) {
      console.error('Erro ao abortar fluxo:', err);
    }
  };

  // Load database state on mount
  const loadDatabaseState = async () => {
    try {
      let proj = await dbService.getProjectMetadata();

      // Rule: Never start with preconceived pauta or databases; start from zero unless user specifically configured
      if (
        proj.territoryDescription?.includes('Ibiapaba') ||
        proj.title?.includes('Áreas Protegidas') ||
        proj.title?.includes('Pressão Territorial') ||
        proj.territoryDescription?.includes('Araripe') ||
        !proj.title ||
        proj.title.trim() === ''
      ) {
        await dbService.resetToInitial();
        proj = {
          ...EMPTY_PROJECT_METADATA,
          id: 'proj_geojor_novo',
          title: '',
          territoryDescription: '',
          targetObject: '',
          regionalLayerName: '',
          localLayerName: '',
          detailLayerName: '',
          rawDownloadFormat: 'Shapefile (.shp, .shx, .dbf, .prj)',
          rawDownloadCrs: 'SIRGAS 2000 Brasil (EPSG:4674)',
          calculationCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
          outputCrs: 'EPSG:3857 (Web Mercator para Mapa Interativo)',
          status: 'nao_iniciado',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await dbService.saveProjectMetadata(proj);
      }

      let records = await dbService.getAuditRecords(proj.id);
      if (!proj.title || proj.title.trim() === '') {
        records = [];
      }
      const adjs = await dbService.getAdjustments(proj.id);

      setProject(proj);
      setAuditRecords(records);
      setAdjustments(adjs);
      setCurrentPhaseId(proj.currentPhaseId || 1);
      setSelectedActivityId(proj.currentActivityId || 'p1_a1');

      // Check if QGIS is running on the system when protocol starts
      const qgisInfo = await qgisMcpService.checkQgisStatus();
      setQgisStatus(qgisInfo);

      // If QGIS is running, auto integrate via MCP as requested
      if (qgisInfo.isRunning && !qgisInfo.isConnected) {
        const mcpRes = await qgisMcpService.connectMcp();
        if (mcpRes.connected) {
          setQgisStatus(qgisMcpService.getStatus());
        }
      }

      // Record protocol initialization in environment flight recorder
      await dbService.recordProtocolEvent({
        id: `evt_init_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phaseId: proj.currentPhaseId || 1,
        activityId: proj.currentActivityId || 'p1_a1',
        agentRole: 'reporter',
        agentName: 'Diógenes Luna (Repórter)',
        eventType: 'protocol_init',
        title: 'Protocolo de GeoJornalismo Científico Inicializado do Zero',
        description: `Pauta inicial: ${proj.title || 'Aguardando definição editorial do usuário'}. QGIS em execução: ${qgisInfo.isRunning ? `Sim (PID ${qgisInfo.pid || 'Ativo'}, conectado via MCP)` : 'Não detectado (Ponte MCP disponível)'}. Gravação contínua ativada.`,
        status: 'info'
      });
    } catch (err) {
      console.error('Erro ao carregar estado do banco de dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshQgisStatus = async () => {
    const info = await qgisMcpService.checkQgisStatus();
    setQgisStatus(info);
  };

  const handleConnectQgis = async () => {
    const res = await qgisMcpService.connectMcp();
    setQgisStatus(qgisMcpService.getStatus());
    await dbService.recordProtocolEvent({
      id: `evt_qgis_user_${Date.now()}`,
      timestamp: new Date().toISOString(),
      phaseId: currentPhaseId,
      agentRole: 'mcp_bridge',
      agentName: 'Agente Conector QGIS MCP',
      eventType: 'qgis_mcp_connected',
      title: 'Conexão MCP Atualizada Manualmente',
      description: `Resultado: ${res.connected ? `Conectado em modo ${res.mode}` : 'Desconectado / QGIS não detectado'}.`,
      status: res.connected ? 'success' : 'warning'
    });
  };

  const handleTriggerErrorWarning = (
    activity: ActivityDefinition,
    phase: PhaseDefinition,
    customDiagnosis?: string
  ) => {
    setErrorModalActivity(activity);
    setErrorModalPhase(phase);
    setErrorModalData({
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      activityTitle: activity.title,
      phaseId: phase.id,
      phaseName: phase.name,
      phaseCode: phase.code,
      checkpointPrompt: activity.checkpointPrompt,
      technicalCriterion: activity.technicalCriterion,
      inputsChecked: activity.inputs,
      errorType: phase.id === 3
        ? 'Inconsistência de Topologia (Auto-interseções / Geometrias Inválidas)'
        : phase.id === 4
        ? 'Incompatibilidade de Projeção Cartográfica (Divergência de SRC)'
        : 'Não Conformidade com Ponto de Checagem Obrigatório',
      errorDiagnosis: customDiagnosis || `Inconsistência detectada no ponto de checagem da Atividade ${activity.activityNumber}: "${activity.checkpointPrompt}". O critério de precisão (${activity.technicalCriterion}) não foi satisfeito.`
    });
    setIsErrorModalOpen(true);
  };

  const handleResolveFromErrorModal = async (evidence: string, correctiveAction: string) => {
    if (!errorModalActivity || !errorModalPhase || !project) return;

    await handleValidateActivity(
      errorModalActivity,
      errorModalPhase,
      'Sim',
      evidence,
      project.researcher
    );

    await dbService.recordProtocolEvent({
      id: `evt_res_${Date.now()}`,
      timestamp: new Date().toISOString(),
      phaseId: errorModalPhase.id,
      activityId: errorModalActivity.id,
      activityNumber: errorModalActivity.activityNumber,
      agentRole: 'gis_analyst',
      agentName: 'Analista SIG / QGIS',
      eventType: 'corrective_action',
      title: `Correção Aplicada: Atividade ${errorModalActivity.activityNumber} Validada`,
      description: `Ação corretiva: "${correctiveAction}". Evidência gerada: "${evidence}".`,
      status: 'success'
    });

    setIsErrorModalOpen(false);
  };

  useEffect(() => {
    loadDatabaseState();
  }, []);

  // Handler for Primary Action Button in WebmapProductionHero
  const handleStartOrResume = () => {
    if (isParalyzed && paralyzedRecord) {
      setCurrentPhaseId(paralyzedRecord.phaseId);
      setSelectedActivityId(paralyzedRecord.activityId);
      setTimeout(() => {
        const el = document.getElementById(`activity-${paralyzedRecord.activityId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
      return;
    }

    const firstUnvalidated = flatActivities.find((f) => {
      const rec = recordMap.get(f.activity.id);
      return !rec || rec.evaluation !== 'Sim';
    });

    if (firstUnvalidated) {
      setCurrentPhaseId(firstUnvalidated.phase.id);
      setSelectedActivityId(firstUnvalidated.activity.id);
      setTimeout(() => {
        const el = document.getElementById(`activity-${firstUnvalidated.activity.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    } else {
      setCurrentPhaseId(1);
      setSelectedActivityId('p1_a1');
      setTimeout(() => {
        const el = document.getElementById('activity-p1_a1');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }
  };

  // Handler to return to initial stage (Phase 1, Activity 1)
  const handleResetToInitial = async () => {
    try {
      await dbService.resetToInitial();
      const proj = await dbService.getProjectMetadata();
      setProject(proj);
      setAuditRecords([]);
      setAdjustments([]);
      setCurrentPhaseId(1);
      setSelectedActivityId('p1_a1');

      await dbService.recordProtocolEvent({
        id: `evt_reset_${Date.now()}`,
        timestamp: new Date().toISOString(),
        phaseId: 1,
        activityId: 'p1_a1',
        activityNumber: 1,
        agentRole: 'reporter',
        agentName: 'Diógenes Luna (Administrador)',
        eventType: 'protocol_init',
        title: 'Protocolo Reiniciado para a Etapa Inicial',
        description: 'O administrador Diógenes Luna reiniciou o fluxo para a Fase 1: Conceber, Atividade 1.',
        status: 'info'
      });
    } catch (err) {
      console.error('Erro ao reiniciar protocolo:', err);
    }
  };

  // Handler to publish and open webmap in HTML
  const handleOpenPublishWebmap = async () => {
    if (project) {
      try {
        const html = generatePublishedWebmapHtml(project, auditRecords);
        await fetch('/api/webmap/publish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ html, title: project.title })
        });
      } catch (e) {
        console.warn('Erro ao sincronizar publicação de webmap com o servidor:', e);
      }
    }
    setIsPublishWebmapOpen(true);
  };

  // Linear list of all 64 activities across all 6 phases
  const flatActivities = useMemo(() => {
    const list: { phase: PhaseDefinition; activity: ActivityDefinition; globalIndex: number }[] = [];
    let idx = 0;
    METHODOLOGY_PHASES.forEach((p) => {
      p.activities.forEach((a) => {
        list.push({ phase: p, activity: a, globalIndex: idx });
        idx++;
      });
    });
    return list;
  }, []);

  // Determine which activity is currently paralyzed (if any)
  const paralyzedRecord = useMemo(() => {
    return auditRecords.find((r) => r.evaluation === 'Não') || null;
  }, [auditRecords]);

  const isParalyzed = Boolean(paralyzedRecord);

  // Map of activityId -> AuditRecord
  const recordMap = useMemo(() => {
    const map = new Map<string, AuditRecord>();
    auditRecords.forEach((r) => map.set(r.activityId, r));
    return map;
  }, [auditRecords]);

  // Determine locked/unlocked state for each activity
  const unlockedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    let previousWasValid = true;

    for (let i = 0; i < flatActivities.length; i++) {
      const { activity } = flatActivities[i];

      if (i === 0) {
        map.set(activity.id, true);
      } else {
        map.set(activity.id, previousWasValid);
      }

      const rec = recordMap.get(activity.id);
      if (!rec || rec.evaluation !== 'Sim') {
        previousWasValid = false;
      }
    }
    return map;
  }, [flatActivities, recordMap]);

  // Current Phase
  const currentPhase = useMemo(() => {
    return (
      METHODOLOGY_PHASES.find((p) => p.id === currentPhaseId) ||
      METHODOLOGY_PHASES[0]
    );
  }, [currentPhaseId]);

  // Handle checkpoint validation ("Sim" or "Não")
  const handleValidateActivity = async (
    activity: ActivityDefinition,
    phase: PhaseDefinition,
    evaluation: 'Sim' | 'Não',
    evidence: string,
    operator: string
  ) => {
    if (!project) return;

    // Regra Metodológica: É proibido validar atividades sem a definição e aprovação prévia da pauta pelo jornalista
    if (!project.title || project.title.trim() === '') {
      setIsConfigOpen(true);
      return;
    }

    const timestamp = new Date().toISOString();
    const isSim = evaluation === 'Sim';

    const hash = generateAuditHash({
      projectId: project.id,
      phaseId: phase.id,
      activityNumber: activity.activityNumber,
      evaluation,
      timestamp,
      operator
    });

    const record: AuditRecord = {
      id: `rec_${activity.id}_${Date.now()}`,
      projectId: project.id,
      phaseId: phase.id,
      phaseName: phase.name,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      activityTitle: activity.title,
      checkpointPrompt: activity.checkpointPrompt,
      checkpointVerb: activity.checkpointVerb,
      evaluation,
      status: isSim ? 'Validado' : 'Invalidado_Paralisado',
      operator: operator || project.researcher,
      timestamp,
      inputsChecked: activity.inputs,
      operationsPerformed: activity.operations,
      outputProduced: activity.expectedOutput,
      technicalEvidence: evidence,
      recordHash: hash,
      errorDiagnosis: !isSim
        ? 'Erro acusado no ponto de checagem. O fluxo de trabalho foi paralisado para evitar propagação de imprecisão.'
        : undefined,
      correctiveAction: !isSim
        ? 'Aguardando ação corretiva e retificação pelo operador no SIG.'
        : undefined
    };

    // Save to IndexedDB database
    await dbService.saveAuditRecord(record);

    // Record checkpoint validation in environment flight recorder
    await dbService.recordProtocolEvent({
      id: `evt_chk_${activity.id}_${Date.now()}`,
      timestamp,
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      agentRole: isSim ? 'precision_auditor' : 'reporter',
      agentName: isSim ? 'Auditor Metodológico' : 'Repórter / Auditor',
      eventType: isSim ? 'checkpoint_validation' : 'error_detected',
      title: isSim ? `Atividade ${activity.activityNumber} Validada com Sucesso` : `Atividade ${activity.activityNumber} NÃO Validada (Erro Detectado)`,
      description: isSim
        ? `Critério atendido: "${activity.technicalCriterion}". Evidência gravada: "${evidence}". Hash: ${hash}`
        : `Erro acusado no ponto de checagem "${activity.checkpointPrompt}". O fluxo foi paralisado conforme o protocolo de Luna (2026c).`,
      payload: { checkpointPrompt: activity.checkpointPrompt, evidence, operator, hash },
      status: isSim ? 'success' : 'error',
      hash
    });

    // If an error is detected (!isSim), immediately emit the warning window with diagnosis and solution
    if (!isSim) {
      handleTriggerErrorWarning(
        activity,
        phase,
        `Inconsistência apontada durante a checagem da Atividade ${activity.activityNumber}: "${activity.checkpointPrompt}". Critério não atendido: "${activity.technicalCriterion}". A atividade NÃO FOI VALIDADA e o fluxo está suspenso até a retificação com 0 erros.`
      );
    }

    // Update project state
    const nextStatus = !isSim
      ? 'paralisado'
      : auditRecords.filter((r) => r.evaluation === 'Sim').length + 1 >= 64
      ? 'concluido'
      : 'em_andamento';

    const updatedProject: ProjectMetadata = {
      ...project,
      status: nextStatus,
      currentPhaseId: phase.id,
      currentActivityId: activity.id
    };

    await dbService.saveProjectMetadata(updatedProject);
    setProject(updatedProject);

    // Refresh memory records
    const updatedRecords = await dbService.getAuditRecords(project.id);
    setAuditRecords(updatedRecords);

    // If validated with Sim, auto-advance focus to next activity
    if (isSim) {
      const currentGlobalIdx = flatActivities.findIndex((f) => f.activity.id === activity.id);
      if (currentGlobalIdx >= 0 && currentGlobalIdx < flatActivities.length - 1) {
        const nextActivity = flatActivities[currentGlobalIdx + 1];
        setSelectedActivityId(nextActivity.activity.id);

        // If next activity belongs to next phase, smoothly update current phase
        if (nextActivity.phase.id !== phase.id) {
          setCurrentPhaseId(nextActivity.phase.id);
        }
      }
    }
  };

  // Handle resolution of paralyzed state
  const handleResolveParalyzed = async (
    diagnosis: string,
    action: string,
    recheckEvidence: string
  ) => {
    if (!paralyzedRecord || !project) return;

    const resolvedRecord: AuditRecord = {
      ...paralyzedRecord,
      evaluation: 'Sim',
      status: 'Validado',
      errorDiagnosis: diagnosis,
      correctiveAction: action,
      technicalEvidence: recheckEvidence,
      timestamp: new Date().toISOString(),
      recordHash: generateAuditHash({
        projectId: project.id,
        phaseId: paralyzedRecord.phaseId,
        activityNumber: paralyzedRecord.activityNumber,
        evaluation: 'Sim',
        timestamp: new Date().toISOString(),
        operator: project.researcher
      })
    };

    await dbService.saveAuditRecord(resolvedRecord);

    const updatedProject: ProjectMetadata = {
      ...project,
      status: 'em_andamento'
    };
    await dbService.saveProjectMetadata(updatedProject);
    setProject(updatedProject);

    const updatedRecords = await dbService.getAuditRecords(project.id);
    setAuditRecords(updatedRecords);
  };

  // Phase completion stats
  const currentPhaseRecords = auditRecords.filter((r) => r.phaseId === currentPhase.id);
  const currentPhaseValidatedCount = currentPhaseRecords.filter((r) => r.evaluation === 'Sim').length;
  const isCurrentPhaseComplete = currentPhaseValidatedCount === currentPhase.activities.length;

  if (isLoading || !project) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center p-6 text-xs font-mono text-stone-500">
        Iniciando banco de dados de auditoria geojornalística...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col text-stone-900 font-sans">
      {/* Contextual top return ribbon when navigating outside workflow */}
      {activeTab !== 'workflow' && (
        <header className="bg-white border-b border-stone-200 px-4 sm:px-6 py-2.5 flex items-center justify-between text-xs font-mono shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('workflow')}
            className="flex items-center gap-1.5 text-[#7b3819] hover:text-[#58240f] font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Painel Operacional MapeIA</span>
          </button>
          <div className="flex items-center gap-2 text-stone-500">
            <span className="font-serif font-bold text-stone-900">MapeIA</span>
            <span>·</span>
            <span className="text-stone-700">
              {activeTab === 'database'
                ? 'Banco de Auditoria & Histórico de Eventos'
                : activeTab === 'analytics'
                ? 'Métricas e Indicadores'
                : activeTab === 'agents'
                ? 'Agentes & QGIS MCP'
                : activeTab === 'map'
                ? 'Mapa Interativo'
                : activeTab === 'sandbox'
                ? 'Ambiente Seguro de Testes'
                : 'Metodologia'}
            </span>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      {activeTab === 'workflow' && (
        <div className="flex-1 pb-16">
          {/* Centered Webmap Production Hero with prominent start button */}
          <WebmapProductionHero
            project={project}
            currentPhaseId={currentPhaseId}
            onSelectPhase={(phaseId) => setCurrentPhaseId(phaseId)}
            auditRecords={auditRecords}
            isParalyzed={isParalyzed}
            onStartOrResume={handleStartOrResume}
            onResetToInitial={handleResetToInitial}
            onPublishHtml={handleOpenPublishWebmap}
            onOpenDataSources={() => setIsDataSourcesOpen(true)}
            onOpenAuditoria={() => setActiveTab('database')}
            onOpenAnalytics={() => setActiveTab('analytics')}
            onOpenAgents={() => setActiveTab('agents')}
            onOpenDesignEngine={() => setIsDesignEngineOpen(true)}
            onExportReport={() => setIsReportOpen(true)}
            onAbortFlow={handleAbortFlow}
            onOpenConfig={() => setIsConfigOpen(true)}
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Paralyzed Alert Banner when error is caught */}
            {isParalyzed && paralyzedRecord && (
              <ParalyzedAlert
                paralyzedRecord={paralyzedRecord}
                onResolveAndValidate={handleResolveParalyzed}
              />
            )}

            {/* Current Phase Metadata Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm shrink-0">
                    {currentPhase.code}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                      <span>FASE {currentPhase.id} DE 6</span>
                      <span>·</span>
                      <span>{currentPhase.activities.length} PONTOS DE CHECAGEM</span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">
                      {currentPhase.name}: {currentPhase.description}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isCurrentPhaseComplete ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ETAPA 100% VALIDADA NO BANCO
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                      {currentPhaseValidatedCount} de {currentPhase.activities.length} validadas
                    </span>
                  )}
                </div>
              </div>

              {/* Sub-properties */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                    Entrada do Fluxo:
                  </span>
                  <span className="text-slate-800 text-[11px] leading-tight block">
                    {currentPhase.inputs}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                    Saída Esperada:
                  </span>
                  <span className="text-slate-800 text-[11px] leading-tight block">
                    {currentPhase.expectedOutput}
                  </span>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase text-slate-500 block mb-0.5">
                    Artefato Jornalístico Produzido:
                  </span>
                  <span className="font-semibold text-slate-900 text-[11px] leading-tight block">
                    {currentPhase.journalisticArtifact}
                  </span>
                </div>
              </div>
            </div>

            {/* List of Activities for this Phase */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>
                  ATIVIDADES E PONTOS DE CHECAGEM CRÍTICOS (BERRET ET AL., 2023)
                </span>
                <span>Validação sequencial estrita: 'Sim' ou 'Não'</span>
              </div>

              {currentPhase.activities.map((activity) => {
                const record = recordMap.get(activity.id);
                const isUnlocked = unlockedMap.get(activity.id) ?? false;
                const isCurrent = selectedActivityId === activity.id;

                return (
                  <div id={`activity-${activity.id}`} key={activity.id} className="scroll-mt-6">
                    <ActivityCard
                      phase={currentPhase}
                      activity={activity}
                      record={record}
                      isUnlocked={isUnlocked}
                      isCurrent={isCurrent}
                      operatorName={project.researcher}
                      isPautaDefined={Boolean(project.title && project.title.trim() !== '')}
                      onOpenPautaConfig={() => setIsConfigOpen(true)}
                      onValidate={(evaluation, evidence, operator) =>
                        handleValidateActivity(activity, currentPhase, evaluation, evidence, operator)
                      }
                      onSelect={() => setSelectedActivityId(activity.id)}
                      onErrorDetected={(act, ph, customDiag) =>
                        handleTriggerErrorWarning(act, ph, customDiag)
                      }
                      onPublishHtml={handleOpenPublishWebmap}
                    />
                  </div>
                );
              })}
            </div>

            {/* Phase Navigation Footer (Standardized & Centered) */}
            {(() => {
              const hasWorkflowStarted = auditRecords.some(r => r.evaluation === 'Sim' || r.evaluation === 'Não');
              const hasPriorInvalidation = auditRecords.some(r => r.phaseId < currentPhaseId && r.evaluation === 'Não');
              const isPreviousPhaseBlocked = currentPhaseId <= 1 || (hasWorkflowStarted && !isParalyzed && !hasPriorInvalidation);

              return (
                <div className="mt-8 flex flex-col items-center justify-center gap-3 pt-6 border-t border-slate-200">
                  <div className="btn-group-center">
                    <button
                      type="button"
                      disabled={isPreviousPhaseBlocked}
                      onClick={() => {
                        if (!isPreviousPhaseBlocked) setCurrentPhaseId(currentPhaseId - 1);
                      }}
                      className="btn-base btn-md btn-secondary"
                      title={
                        isPreviousPhaseBlocked
                          ? 'Volta bloqueada: avanço sequencial estrito sem retorno (permitido apenas em caso de invalidação ativa)'
                          : `Ir para Fase ${currentPhaseId - 1}`
                      }
                    >
                      {isPreviousPhaseBlocked && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                      <span>← Fase Anterior ({currentPhaseId > 1 ? METHODOLOGY_PHASES[currentPhaseId - 2].name : ''})</span>
                    </button>

                    <div className="text-xs font-mono text-slate-600 px-3 font-semibold">
                      Fase {currentPhaseId} de 6
                    </div>

                    <button
                      type="button"
                      disabled={currentPhaseId >= 6 || (!isCurrentPhaseComplete && !auditRecords.some(r => r.phaseId === currentPhaseId + 1))}
                      onClick={() => setCurrentPhaseId(currentPhaseId + 1)}
                      className="btn-base btn-md btn-primary"
                    >
                      <span>Próxima Fase ({currentPhaseId < 6 ? METHODOLOGY_PHASES[currentPhaseId].name : ''})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isPreviousPhaseBlocked && hasWorkflowStarted && (
                    <span className="text-[11px] font-mono text-slate-500 text-center">
                      * Regra Metodológica: O fluxo não permite regressão de fase após iniciado, exceto em caso de invalidação ativa.
                    </span>
                  )}
                </div>
              );
            })()}
          </main>
        </div>
      )}

      {/* Database Inspector Tab */}
      {activeTab === 'database' && (
        <AuditDatabaseView
          project={project}
          records={auditRecords}
          adjustments={adjustments}
          onRefresh={loadDatabaseState}
          onExportReport={() => setIsReportOpen(true)}
          onPublishHtml={handleOpenPublishWebmap}
          onReturnToWorkflow={() => setActiveTab('workflow')}
        />
      )}

      {/* Analytics Dashboard with recharts */}
      {activeTab === 'analytics' && (
        <AnalysisDashboard
          records={auditRecords}
          project={project}
          adjustments={adjustments}
        />
      )}

      {/* Agents Architecture & QGIS MCP Tab */}
      {activeTab === 'agents' && (
        <AgentsView
          project={project}
          auditRecords={auditRecords}
          currentPhaseId={currentPhaseId}
          qgisStatus={qgisStatus}
          onRefreshQgisStatus={async () => {
            const st = await qgisMcpService.checkQgisStatus();
            setQgisStatus(st);
          }}
          onReturnToWorkflow={() => setActiveTab('workflow')}
        />
      )}

      {/* Interactive 3-Level Territorial Map Preview */}
      {activeTab === 'map' && (
        <InteractiveMapPreview
          project={project}
          auditRecords={auditRecords}
          onPublishHtml={handleOpenPublishWebmap}
        />
      )}

      {/* Methodological Experimental Sandbox (Ambiente Seguro de Testes) */}
      {activeTab === 'sandbox' && (
        <MethodologicalSandbox project={project} officialRecords={auditRecords} />
      )}

      {/* Theoretical Methodology Reference */}
      {activeTab === 'methodology' && <MethodologyDocModal />}

      {/* Journalistic Design Engine Modal */}
      <JournalisticDesignEngine
        isOpen={isDesignEngineOpen}
        onClose={() => setIsDesignEngineOpen(false)}
      />

      {/* Project Configuration Modal */}
      <ProjectConfigModal
        project={project}
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSave={async (updated) => {
          await dbService.saveProjectMetadata(updated);
          setProject(updated);
        }}
        onResetDatabase={async () => {
          await dbService.resetToInitial();
          await loadDatabaseState();
          setIsConfigOpen(false);
        }}
      />

      {/* Scientific Report Viewer Modal */}
      <ReportViewerModal
        project={project}
        records={auditRecords}
        adjustments={adjustments}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      {/* Activity Validation Error Warning Window Modal */}
      <ActivityValidationErrorModal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        activity={errorModalActivity}
        phase={errorModalPhase}
        errorData={errorModalData}
        onResolveAndValidate={handleResolveFromErrorModal}
        onKeepParalyzed={async (diagnosis) => {
          if (errorModalActivity && errorModalPhase) {
            await handleValidateActivity(
              errorModalActivity,
              errorModalPhase,
              'Não',
              'Erro confirmado: fluxo mantido paralisado para auditoria.',
              project?.researcher || 'Diógenes Luna'
            );
          }
          setIsErrorModalOpen(false);
        }}
        isQgisConnected={qgisStatus.isConnected}
      />

      {/* Protocol Flight Recorder Modal */}
      <ProtocolFlightRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
      />

      {/* Published Webmap Standalone HTML Modal */}
      {project && (
        <PublishedWebmapModal
          isOpen={isPublishWebmapOpen}
          onClose={() => setIsPublishWebmapOpen(false)}
          project={project}
          records={auditRecords}
        />
      )}

      {/* Data Sources and Physical Storage Modal */}
      {project && (
        <DataSourcesAndStorageModal
          isOpen={isDataSourcesOpen}
          onClose={() => setIsDataSourcesOpen(false)}
          project={project}
          records={auditRecords}
        />
      )}

      {/* Clean quiet footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Protocolo de GeoJornalismo Científico (Luna, 2026c)
          </span>
          <span className="text-[11px] text-slate-400">
            Armazenamento: IndexedDB Persistente com Trilha de Auditoria
          </span>
        </div>
      </footer>
    </div>
  );
}
