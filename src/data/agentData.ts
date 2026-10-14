import { AgentProfile, AgentRole, AgentInteractionMessage, ActivityDefinition, PhaseDefinition } from '../types/workflow';

export const AGENT_PROFILES: Record<AgentRole, AgentProfile> = {
  reporter: {
    id: 'reporter',
    name: 'Diógenes Luna (Repórter Investigativo)',
    roleLabel: 'Jornalista Líder & Editor da Pauta',
    description: 'Delimita a hipótese jornalística, define as questões territoriais, avalia a relevância de interesse público e valida o enquadramento factual da apuração.',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    responsibilities: [
      'Concepção editorial e hipóteses da investigação',
      'Critérios de interesse público e fontes primárias',
      'Auditoria de coerência entre os dados e a narrativa',
      'Aprovação final do artefato jornalístico'
    ]
  },
  gis_analyst: {
    id: 'gis_analyst',
    name: 'Especialista SIG / QGIS LTR',
    roleLabel: 'Analista de Geoprocessamento & Cartografia',
    description: 'Recebe as bases públicas oficiais do Brasil no padrão vetorial Shapefile (.shp) com coordenadas SIRGAS 2000 (EPSG:4674). Executa a reprojeção obrigatória para SIRGAS 2000 Brasil Albers (EPSG:10857) como etapa antecedente indispensável à criação do projeto QGIS de cálculo e do GeoPackage de cálculo (dados_calculos.gpkg). Assegura que TODO e qualquer cálculo de área seja executado estritamente em EPSG:10857.',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    responsibilities: [
      'Ingestão de Shapefiles oficiais do governo em SIRGAS 2000 (EPSG:4674)',
      'Reprojeção obrigatória para SIRGAS 2000 Brasil Albers (EPSG:10857)',
      'Criação do projeto QGIS e GeoPackage de cálculos isolado',
      'Execução de 100% dos cálculos de áreas (ha) em EPSG:10857',
      'Limpeza topológica e saneamento de nós degenerados no QGIS'
    ]
  },
  precision_auditor: {
    id: 'precision_auditor',
    name: 'Auditor Metodológico (Luna 2026c)',
    roleLabel: 'Inspetor de Precisão & Cadeia de Custódia',
    description: 'Aplica com tolerância zero os critérios de precisão científica de Luna (2026c). Audita a custódia desde os Shapefiles brutos em EPSG:4674 até a integridade métrica da reprojeção para EPSG:10857, bloqueia o fluxo perante qualquer divergência e emite hashes imutáveis.',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    responsibilities: [
      'Verificação da conformidade do CRS de entrada (Shapefile EPSG:4674)',
      'Auditoria de reprojeção prévia obrigatória para EPSG:10857',
      'Validação binária estrita (Sim / Não) em 64 pontos de checagem',
      'Paralisação imediata ao detectar anomalia sem reiniciar da 1ª etapa',
      'Emissão do laudo de auditoria e hashes de integridade SHA-256'
    ]
  },
  iag_communicator: {
    id: 'iag_communicator',
    name: 'Assistente Editorial Gemini (Google GenAI)',
    roleLabel: 'Comunicador Narrativo & Grounding Espacial',
    description: 'Transforma dados geográficos em narrativa estruturada em 3 níveis (Regional, Local, Detalhe), checa pontos de referência no Google Maps Grounding e refina o design interativo dos mapas.',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    responsibilities: [
      'Narrativa em três escalas territoriais',
      'Redação de cards de feição e textos didáticos',
      'Verificação com Google Maps Grounding',
      'Testes de prompts e acessibilidade visual (WCAG AA)'
    ]
  },
  mcp_bridge: {
    id: 'mcp_bridge',
    name: 'Conector QGIS-MCP Bridge',
    roleLabel: 'Ponte de Protocolo de Contexto do Modelo',
    description: 'Interliga este ambiente web diretamente à sessão em execução do QGIS através da especificação Model Context Protocol (MCP), transmitindo comandos, camadas e algoritmos automatizados.',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    responsibilities: [
      'Sondagem de processos ativos do QGIS no sistema',
      'Troca de mensagens padronizadas JSON-RPC via MCP',
      'Execução remota de algoritmos nativos do QGIS',
      'Sincronização em tempo real de camadas e geometrias'
    ]
  }
};

/**
 * Generate transparent agent interactions for a given activity
 */
export function generateAgentInteractionsForActivity(
  phase: PhaseDefinition,
  activity: ActivityDefinition,
  evaluation?: 'Sim' | 'Não' | null
): AgentInteractionMessage[] {
  const baseTime = new Date().toLocaleTimeString('pt-BR');

  const messages: AgentInteractionMessage[] = [
    {
      id: `msg_rep_${activity.id}`,
      timestamp: baseTime,
      sender: 'reporter',
      recipient: 'gis_analyst',
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      intent: 'hypothesis',
      content: `Iniciando Atividade ${activity.activityNumber} da Fase ${phase.code} (${phase.name}): "${activity.title}". Nosso objetivo editorial é assegurar: "${activity.description}".`,
      technicalDetails: `Entrada esperada: ${activity.inputs} | Critério da Pauta: ${activity.technicalCriterion}`,
      actionItems: ['Verificar dados brutos', 'Aplicar parâmetros do protocolo']
    },
    {
      id: `msg_mcp_${activity.id}`,
      timestamp: baseTime,
      sender: 'mcp_bridge',
      recipient: 'gis_analyst',
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      intent: 'execution_request',
      content: `Ponte MCP sincronizada com o projeto QGIS. Camadas ativas verificadas. Pronto para despachar operações de processamento da atividade.`,
      technicalDetails: `Algoritmos disponíveis: native:fixgeometries, native:reproject, native:intersection.`,
      status: 'success'
    },
    {
      id: `msg_gis_${activity.id}`,
      timestamp: baseTime,
      sender: 'gis_analyst',
      recipient: 'precision_auditor',
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      intent: 'execution_result',
      content: `Operações espaciais executadas conforme o manual técnico: "${activity.operations}". Saída produzida: "${activity.expectedOutput}". Submeto ao ponto de checagem.`,
      technicalDetails: `Parâmetros de execução: CRS SIRGAS 2000 Brasil Albers (EPSG:10857), tolerância de nó = 0.0001m.`,
      status: 'success'
    },
    {
      id: `msg_aud_${activity.id}`,
      timestamp: baseTime,
      sender: 'precision_auditor',
      recipient: 'all',
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      intent: evaluation === 'Não' ? 'error_flag' : evaluation === 'Sim' ? 'checkpoint_verdict' : 'audit_check',
      content:
        evaluation === 'Não'
          ? `ALERTA DE IMPRECISÃO: O ponto de checagem "${activity.checkpointPrompt}" FOI REPROVADO. A atividade NÃO FOI VALIDADA e o fluxo está paralisado para evitar propagação de erro.`
          : evaluation === 'Sim'
          ? `CONFORMIDADE ATINGIDA: Ponto de checagem validado com SIM. Evidência técnica gravada no banco de dados com hash de custódia.`
          : `AVALIAÇÃO EM ANDAMENTO: Analisando o ponto de checagem (${activity.checkpointVerb}): "${activity.checkpointPrompt}". Métrica binária estrita.`,
      technicalDetails: `Critério técnico de conformidade: ${activity.technicalCriterion}`,
      status: evaluation === 'Não' ? 'error' : evaluation === 'Sim' ? 'success' : 'pending'
    },
    {
      id: `msg_iag_${activity.id}`,
      timestamp: baseTime,
      sender: 'iag_communicator',
      recipient: 'reporter',
      phaseId: phase.id,
      activityId: activity.id,
      activityNumber: activity.activityNumber,
      intent: 'story_generation',
      content:
        evaluation === 'Não'
          ? `Aguardando resolução pelo Analista SIG e homologação pelo Auditor antes de integrar qualquer dado à narrativa editorial.`
          : `Dados homologados. Gerando card contextual nos três níveis territoriais para manter total fidelidade aos fatos apurados.`,
      technicalDetails: `Escalas: Nível 1 Regional (APA), Nível 2 Local (Cariri), Nível 3 Detalhe (Alertas).`,
      status: evaluation === 'Não' ? 'warning' : 'success'
    }
  ];

  return messages;
}
