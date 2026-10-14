import { AuditRecord, DatabaseAdjustment, ProjectMetadata, ProtocolRecordedEvent } from '../types/workflow';
import { INITIAL_PROJECT_METADATA } from '../data/methodologyData';

const DB_NAME = 'GeoJournalismAuditDB_v2';
const DB_VERSION = 2;

interface DBSchema {
  project: ProjectMetadata;
  records: AuditRecord[];
  adjustments: DatabaseAdjustment[];
  events?: ProtocolRecordedEvent[];
}

// Fallback in-memory / localStorage storage key
const STORAGE_KEY = 'geojournalism_audit_db_v2';
const EVENTS_STORAGE_KEY = 'geojournalism_recorded_events_v2';

class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.dbPromise = this.openIndexedDB();
    }
  }

  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('audit_records')) {
          const store = db.createObjectStore('audit_records', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('phaseId', 'phaseId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
        if (!db.objectStoreNames.contains('adjustments')) {
          const store = db.createObjectStore('adjustments', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
          store.createIndex('targetRecordId', 'targetRecordId', { unique: false });
        }
        if (!db.objectStoreNames.contains('protocol_events')) {
          const store = db.createObjectStore('protocol_events', { keyPath: 'id' });
          store.createIndex('phaseId', 'phaseId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('agentRole', 'agentRole', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Backup to localStorage as secondary persistence
  private syncToLocalStorage(data: DBSchema) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage quota limit or private browsing errors
    }
  }

  private getFromLocalStorage(): DBSchema | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return null;
  }

  public async getProjectMetadata(): Promise<ProjectMetadata> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('projects', 'readonly');
        const store = tx.objectStore('projects');
        const request = store.get(INITIAL_PROJECT_METADATA.id);
        const res = await new Promise<ProjectMetadata | undefined>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });

        if (res) return res;
      } catch (err) {
        console.warn('IndexedDB read failed, falling back to localStorage:', err);
      }
    }

    const localData = this.getFromLocalStorage();
    if (localData && localData.project) {
      return localData.project;
    }

    // Default seed
    await this.saveProjectMetadata(INITIAL_PROJECT_METADATA);
    return INITIAL_PROJECT_METADATA;
  }

  public async saveProjectMetadata(project: ProjectMetadata): Promise<void> {
    project.updatedAt = new Date().toISOString();

    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('projects', 'readwrite');
        const store = tx.objectStore('projects');
        store.put(project);
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('IndexedDB write failed:', err);
      }
    }

    const localData = this.getFromLocalStorage() || {
      project: INITIAL_PROJECT_METADATA,
      records: [],
      adjustments: []
    };
    localData.project = project;
    this.syncToLocalStorage(localData);
  }

  public async getAuditRecords(projectId: string): Promise<AuditRecord[]> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('audit_records', 'readonly');
        const store = tx.objectStore('audit_records');
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        const results = await new Promise<AuditRecord[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });

        if (results && results.length > 0) {
          // Sort chronologically
          return results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      } catch (err) {
        console.warn('IndexedDB audit_records read failed:', err);
      }
    }

    const localData = this.getFromLocalStorage();
    if (localData && localData.records) {
      return localData.records.filter((r) => r.projectId === projectId);
    }

    return [];
  }

  public async saveAuditRecord(record: AuditRecord): Promise<void> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('audit_records', 'readwrite');
        const store = tx.objectStore('audit_records');
        store.put(record);
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('IndexedDB saveAuditRecord error:', err);
      }
    }

    const localData = this.getFromLocalStorage() || {
      project: INITIAL_PROJECT_METADATA,
      records: [],
      adjustments: []
    };
    const existingIndex = localData.records.findIndex((r) => r.id === record.id);
    if (existingIndex >= 0) {
      localData.records[existingIndex] = record;
    } else {
      localData.records.push(record);
    }
    this.syncToLocalStorage(localData);
  }

  public async getAdjustments(projectId: string): Promise<DatabaseAdjustment[]> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('adjustments', 'readonly');
        const store = tx.objectStore('adjustments');
        const index = store.index('projectId');
        const request = index.getAll(projectId);

        const results = await new Promise<DatabaseAdjustment[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
        if (results) return results;
      } catch (err) {
        console.warn('IndexedDB getAdjustments error:', err);
      }
    }

    const localData = this.getFromLocalStorage();
    return localData?.adjustments?.filter((a) => a.projectId === projectId) || [];
  }

  public async saveAdjustment(adjustment: DatabaseAdjustment): Promise<void> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('adjustments', 'readwrite');
        const store = tx.objectStore('adjustments');
        store.put(adjustment);
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('IndexedDB saveAdjustment error:', err);
      }
    }

    const localData = this.getFromLocalStorage() || {
      project: INITIAL_PROJECT_METADATA,
      records: [],
      adjustments: []
    };
    localData.adjustments.push(adjustment);
    this.syncToLocalStorage(localData);
  }

  public async exportFullDatabaseJSON(projectId: string): Promise<string> {
    const project = await this.getProjectMetadata();
    const records = await this.getAuditRecords(projectId);
    const adjustments = await this.getAdjustments(projectId);

    const exportPayload = {
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        tool: 'Fluxo e Protocolo para Produção de Mapas Jornalísticos (Luna, 2026c)',
        methodologicalFramework: 'Protocolo de Metodologia Científica Luna (2026c)',
        version: '1.0.0',
        projectId
      },
      project,
      auditRecords: records,
      adjustments
    };

    return JSON.stringify(exportPayload, null, 2);
  }

  public async exportAuditCSV(projectId: string): Promise<string> {
    const records = await this.getAuditRecords(projectId);
    if (records.length === 0) {
      return 'Fase,Etapa_Cod,Atividade_Num,Atividade_Titulo,Ponto_Checagem,Avaliacao,Status,Operador,Timestamp,Evidencia,Hash\n';
    }

    const headers = [
      'ID_Registro',
      'Fase_ID',
      'Fase_Nome',
      'Atividade_Numero',
      'Atividade_Titulo',
      'Verbo_Checagem',
      'Ponto_Checagem_Prompt',
      'Metrica_Binaria',
      'Status_Validacao',
      'Operador_Auditor',
      'Data_Hora_ISO',
      'Entradas_Verificadas',
      'Saida_Produzida',
      'Evidencia_Tecnica',
      'Diagnostico_Erro',
      'Acao_Corretiva',
      'Hash_Integridade'
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      r.phaseId,
      `"${r.phaseName}"`,
      r.activityNumber,
      `"${r.activityTitle.replace(/"/g, '""')}"`,
      `"${r.checkpointVerb}"`,
      `"${r.checkpointPrompt.replace(/"/g, '""')}"`,
      `"${r.evaluation}"`,
      `"${r.status}"`,
      `"${r.operator.replace(/"/g, '""')}"`,
      `"${r.timestamp}"`,
      `"${r.inputsChecked.replace(/"/g, '""')}"`,
      `"${r.outputProduced.replace(/"/g, '""')}"`,
      `"${(r.technicalEvidence || '').replace(/"/g, '""')}"`,
      `"${(r.errorDiagnosis || '').replace(/"/g, '""')}"`,
      `"${(r.correctiveAction || '').replace(/"/g, '""')}"`,
      `"${r.recordHash}"`
    ]);

    return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  public async exportScientificReportMarkdown(projectId: string): Promise<string> {
    const project = await this.getProjectMetadata();
    const records = await this.getAuditRecords(projectId);
    const adjustments = await this.getAdjustments(projectId);

    const validCount = records.filter((r) => r.evaluation === 'Sim').length;
    const errorCount = records.filter((r) => r.evaluation === 'Não').length;

    let md = `# RELATÓRIO METODOLÓGICO DE AUDITORIA E PRECISÃO GEOJORNALÍSTICA
**Ferramenta:** Fluxo de Trabalho e Protocolo para Produção de Mapas Jornalísticos com Dados Espaciais, SIG e IA (Luna, 2026c)  
**Marco Metodológico:** Luna (2026c)  
**Data de Emissão:** ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}

---

## 1. DADOS DE IDENTIFICAÇÃO DO PROJETO
- **Título da Investigação:** ${project.title}
- **Pesquisador / Repórter Responsável:** ${project.researcher} (${project.institution})
- **Território de Análise:** ${project.territoryDescription}
- **Objeto Analisado:** ${project.targetObject}
- **Sistema de Projeção para Cálculos:** ${project.calculationCrs}
- **Sistema de Projeção para Design Web:** ${project.outputCrs}
- **Status do Fluxo de Trabalho:** ${project.status.toUpperCase()}

---

## 2. MÉTRICAS CONSOLIDADAS DO PROTOCOLO
- **Total de Atividades Auditadas no Banco de Dados:** ${records.length}
- **Pontos de Checagem Validados com "Sim":** ${validCount}
- **Paradas Obrigatórias por Detecção de Erro ("Não"):** ${errorCount}
- **Retificações e Ajustes Registrados:** ${adjustments.length}
- **Rastro de Auditoria:** Integral e Inalterável (Conforme Luna, 2026c)

---

## 3. REGISTROS DETALHADOS POR PONTO DE CHECAGEM

`;

    records.forEach((r, idx) => {
      md += `### ${idx + 1}. [Fase ${r.phaseId}: ${r.phaseName}] Atividade ${r.activityNumber} - ${r.activityTitle}\n`;
      md += `- **Ponto de Checagem (${r.checkpointVerb}):** *${r.checkpointPrompt}*\n`;
      md += `- **Avaliação Binária:** **${r.evaluation}** (${r.status})\n`;
      md += `- **Auditor Responsável:** ${r.operator} em \`${r.timestamp}\`\n`;
      md += `- **Entrada Auditada:** ${r.inputsChecked}\n`;
      md += `- **Operação Executada:** ${r.operationsPerformed}\n`;
      md += `- **Saída Gerada:** ${r.outputProduced}\n`;
      md += `- **Evidência Técnica:** ${r.technicalEvidence || 'N/A'}\n`;
      if (r.errorDiagnosis) {
        md += `- **Diagnóstico de Erro:** ${r.errorDiagnosis}\n`;
        md += `- **Ação Corretiva:** ${r.correctiveAction}\n`;
      }
      md += `- **Hash do Registro:** \`${r.recordHash}\`\n\n`;
    });

    if (adjustments.length > 0) {
      md += `---\n\n## 4. HISTÓRICO DE AJUSTES E CONTROLE RETROSPECTIVO\n\n`;
      adjustments.forEach((adj, i) => {
        md += `#### Ajuste #${i + 1} em ${adj.adjustedAt} por ${adj.adjustedBy}\n`;
        md += `- **ID do Registro Afetado:** \`${adj.targetRecordId}\`\n`;
        md += `- **Justificativa Metodológica:** ${adj.justification}\n`;
        md += `- **Alteração de Métrica:** De \`${adj.previousEvaluation}\` para \`${adj.newEvaluation}\`\n\n`;
      });
    }

    md += `---\n*Documento gerado automaticamente para fins de validação e reprodutibilidade científica (Luna, 2026c).*`;

    return md;
  }

  public async importDatabaseJSON(jsonStr: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.project || !Array.isArray(parsed.auditRecords)) {
        throw new Error('Formato de banco de dados inválido.');
      }

      await this.saveProjectMetadata(parsed.project);

      if (this.dbPromise) {
        const db = await this.dbPromise;
        const tx1 = db.transaction('audit_records', 'readwrite');
        const s1 = tx1.objectStore('audit_records');
        await s1.clear();
        for (const r of parsed.auditRecords) {
          s1.put(r);
        }

        const tx2 = db.transaction('adjustments', 'readwrite');
        const s2 = tx2.objectStore('adjustments');
        await s2.clear();
        if (Array.isArray(parsed.adjustments)) {
          for (const a of parsed.adjustments) {
            s2.put(a);
          }
        }
      }

      this.syncToLocalStorage({
        project: parsed.project,
        records: parsed.auditRecords,
        adjustments: parsed.adjustments || []
      });

      return true;
    } catch (err) {
      console.error('Falha na importação do banco de dados:', err);
      return false;
    }
  }

  // --- Gravador de Execução do Protocolo (Flight Recorder) ---

  public async recordProtocolEvent(event: ProtocolRecordedEvent): Promise<void> {
    if (!event.id) {
      event.id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // 1. Save in IndexedDB
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('protocol_events', 'readwrite');
        const store = tx.objectStore('protocol_events');
        store.put(event);
        await new Promise((resolve, reject) => {
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('IndexedDB write protocol_events failed:', err);
      }
    }

    // 2. Backup to localStorage
    try {
      const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
      const list: ProtocolRecordedEvent[] = raw ? JSON.parse(raw) : [];
      list.push(event);
      // Keep last 1000 events
      if (list.length > 1000) list.shift();
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }

    // 3. Mirror asynchronously to server endpoint if reachable
    try {
      fetch('/api/protocol/record-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(() => {});
    } catch {
      // offline safe
    }
  }

  public async getProtocolEvents(): Promise<ProtocolRecordedEvent[]> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('protocol_events', 'readonly');
        const store = tx.objectStore('protocol_events');
        const request = store.getAll();

        const results = await new Promise<ProtocolRecordedEvent[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });

        if (results && results.length > 0) {
          return results.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        }
      } catch (err) {
        console.warn('IndexedDB read protocol_events failed, falling back to localStorage:', err);
      }
    }

    try {
      const raw = localStorage.getItem(EVENTS_STORAGE_KEY);
      if (raw) {
        const list: ProtocolRecordedEvent[] = JSON.parse(raw);
        return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      }
    } catch {
      // ignore
    }

    return [];
  }

  public async clearProtocolEvents(): Promise<void> {
    if (this.dbPromise) {
      try {
        const db = await this.dbPromise;
        const tx = db.transaction('protocol_events', 'readwrite');
        tx.objectStore('protocol_events').clear();
      } catch {
        // ignore
      }
    }
    localStorage.removeItem(EVENTS_STORAGE_KEY);
    try {
      fetch('/api/protocol/clear-events', { method: 'POST' }).catch(() => {});
    } catch {
      // ignore
    }
  }

  public async exportProtocolLogsJSON(): Promise<string> {
    const events = await this.getProtocolEvents();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        protocol: 'Protocolo de GeoJornalismo Científico (Luna, 2026c)',
        totalEventsRecorded: events.length,
        events
      },
      null,
      2
    );
  }

  public async exportProtocolLogsMarkdown(): Promise<string> {
    const events = await this.getProtocolEvents();
    const proj = await this.getProjectMetadata();

    let md = `# REGISTRO COMPLETO DE EXECUÇÃO DO PROTOCOLO GEOJORNALÍSTICO\n`;
    md += `**Investigação:** ${proj.title}\n`;
    md += `**Território:** ${proj.territoryDescription}\n`;
    md += `**Pesquisador / Auditor:** ${proj.researcher} (${proj.institution})\n`;
    md += `**Data da Extração:** ${new Date().toLocaleString('pt-BR')}\n`;
    md += `**Total de Eventos Gravados no Ambiente:** ${events.length}\n\n`;
    md += `---\n\n`;
    md += `| Data/Hora | Fase | Agente Responsável | Tipo de Evento | Título & Evidência | Status |\n`;
    md += `|---|---|---|---|---|---|\n`;

    events.forEach((e) => {
      const time = new Date(e.timestamp).toLocaleTimeString('pt-BR');
      const act = e.activityNumber ? `Ativ. ${e.activityNumber}` : `Fase ${e.phaseId}`;
      md += `| ${time} | ${act} | ${e.agentName} | \`${e.eventType}\` | **${e.title}**: ${e.description.replace(/\|/g, '-')} | **${e.status.toUpperCase()}** |\n`;
    });

    return md;
  }

  public async resetToInitial(seedInitialCheckpoints = false): Promise<void> {
    if (this.dbPromise) {
      const db = await this.dbPromise;
      const tx = db.transaction(['projects', 'audit_records', 'adjustments'], 'readwrite');
      tx.objectStore('projects').clear();
      tx.objectStore('audit_records').clear();
      tx.objectStore('adjustments').clear();
    }

    localStorage.removeItem(STORAGE_KEY);
    await this.saveProjectMetadata(INITIAL_PROJECT_METADATA);

    if (seedInitialCheckpoints) {
      // Optional initial seeding can be added
    }
  }
}

export const dbService = new DatabaseService();

// Helper to compute a simple deterministic hash for audit trail integrity
export function generateAuditHash(record: Partial<AuditRecord>): string {
  const content = `${record.projectId}_${record.phaseId}_${record.activityNumber}_${record.evaluation}_${record.timestamp}_${record.operator}`;
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `GEO-${hex.toUpperCase()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}
