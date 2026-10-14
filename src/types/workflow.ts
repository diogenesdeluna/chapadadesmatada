/**
 * Protocolo GeoJornalismo - Tipos e Interfaces
 * Baseado na metodologia de Luna (2026c).
 */

export type CheckpointVerb = 'Validar' | 'Valide' | 'Analise' | 'Analisar' | 'Verifique' | 'Verificar';

export type BinaryEvaluation = 'Sim' | 'Não' | null;

export type WorkflowStatus = 'nao_iniciado' | 'em_andamento' | 'paralisado' | 'concluido';

export interface ActivityDefinition {
  id: string;
  phaseId: number;
  activityNumber: number;
  title: string;
  description: string;
  inputs: string;
  operations: string;
  expectedOutput: string;
  checkpointPrompt: string;
  checkpointVerb: CheckpointVerb;
  technicalCriterion: string;
  defaultEvidenceHint: string;
  layerLevel?: 'Regional' | 'Local' | 'Detalhe' | 'Multi-camada';
}

export interface PhaseDefinition {
  id: number;
  code: string; // '4.1', '4.2', etc.
  name: string; // 'Conceber', 'Compilar', 'Limpar', 'Contextualizar', 'Analisar', 'Comunicar'
  description: string;
  inputs: string;
  expectedOutput: string;
  journalisticArtifact: string;
  activities: ActivityDefinition[];
}

export interface AuditRecord {
  id: string;
  projectId: string;
  phaseId: number;
  phaseName: string;
  activityId: string;
  activityNumber: number;
  activityTitle: string;
  checkpointPrompt: string;
  checkpointVerb: CheckpointVerb;
  evaluation: 'Sim' | 'Não';
  status: 'Validado' | 'Invalidado_Paralisado' | 'Retificado';
  operator: string;
  timestamp: string; // ISO 8601
  inputsChecked: string;
  operationsPerformed: string;
  outputProduced: string;
  technicalEvidence: string;
  errorDiagnosis?: string;
  correctiveAction?: string;
  recordHash: string;
}

export interface DatabaseAdjustment {
  id: string;
  projectId: string;
  targetRecordId: string;
  adjustedAt: string;
  adjustedBy: string;
  justification: string;
  previousEvaluation: 'Sim' | 'Não';
  newEvaluation: 'Sim' | 'Não';
  previousEvidence: string;
  newEvidence: string;
}

export interface ProjectMetadata {
  id: string;
  title: string;
  researcher: string;
  institution: string;
  territoryDescription: string;
  targetObject: string; // e.g. "Sobreposição de alertas de desmatamento em APA"
  regionalLayerName: string;
  localLayerName: string;
  detailLayerName: string;
  rawDownloadFormat?: string; // "Padrão vetorial ShapeFile (.shp, .shx, .dbf, .prj)"
  rawDownloadCrs?: string; // "SIRGAS 2000 Brasil (EPSG:4674)"
  calculationCrs: string; // "SIRGAS 2000 - Brasil Albers (EPSG:10857 / IBGE)"
  outputCrs: string; // "EPSG:3857 (Web Mercator)"
  createdAt: string;
  updatedAt: string;
  currentPhaseId: number;
  currentActivityId: string;
  status: WorkflowStatus;
}

export type AgentRole = 'reporter' | 'gis_analyst' | 'precision_auditor' | 'iag_communicator' | 'mcp_bridge';

export interface AgentProfile {
  id: AgentRole;
  name: string;
  roleLabel: string;
  description: string;
  badgeColor: string;
  responsibilities: string[];
}

export interface AgentInteractionMessage {
  id: string;
  timestamp: string;
  sender: AgentRole;
  recipient: AgentRole | 'all';
  phaseId: number;
  activityId?: string;
  activityNumber?: number;
  intent:
    | 'handshake'
    | 'hypothesis'
    | 'execution_request'
    | 'execution_result'
    | 'audit_check'
    | 'checkpoint_verdict'
    | 'error_flag'
    | 'correction_instruction'
    | 'story_generation';
  content: string;
  technicalDetails?: string;
  actionItems?: string[];
  status?: 'pending' | 'success' | 'warning' | 'error';
}

export interface QgisMcpStatus {
  isRunning: boolean;
  pid?: number | null;
  processDetails?: string | null;
  mcpBridgeSupported: boolean;
  connectionMode: 'live_qgis' | 'mcp_bridge_emulator' | 'none';
  isConnected: boolean;
  mcpPort: number;
  connectedAt?: string | null;
  checkedAt: string;
  serverInfo?: {
    name: string;
    version: string;
    protocolVersion: string;
  };
  toolsAvailable?: Array<{ name: string; description: string }>;
}

export interface ProtocolRecordedEvent {
  id: string;
  timestamp: string;
  phaseId: number;
  activityId?: string;
  activityNumber?: number;
  agentRole: AgentRole;
  agentName: string;
  eventType:
    | 'protocol_init'
    | 'qgis_mcp_check'
    | 'qgis_mcp_connected'
    | 'activity_start'
    | 'checkpoint_validation'
    | 'error_detected'
    | 'corrective_action'
    | 'agent_handoff'
    | 'layer_processed'
    | 'flow_aborted';
  title: string;
  description: string;
  payload?: any;
  status: 'info' | 'success' | 'warning' | 'error';
  hash?: string;
}

export interface ActivityValidationErrorData {
  activityId: string;
  activityNumber: number;
  activityTitle: string;
  phaseId: number;
  phaseName: string;
  phaseCode: string;
  checkpointPrompt: string;
  technicalCriterion: string;
  inputsChecked: string;
  errorType: string;
  errorDiagnosis: string;
  methodologicalViolation: string;
  correctiveSteps: string[];
  recommendedTool: string;
  automatedFixAvailable: boolean;
  evidenceGenerated?: string;
}

