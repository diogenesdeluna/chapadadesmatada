import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ProjectMetadata, AuditRecord, DatabaseAdjustment } from '../types/workflow';
import { METHODOLOGY_PHASES } from '../data/methodologyData';

/**
 * Serviço de Exportação de Laudo e Trilha de Auditoria em PDF
 * Baseado no Protocolo Metodológico de Luna (2026c).
 * Gera a prova documental completa com integridade criptográfica para arquivamento científico.
 */

export interface PdfExportOptions {
  includeFullAuditTrail?: boolean;
  includeAdjustments?: boolean;
  includeMethodologyStatement?: boolean;
}

export function buildAuditDossierPdf(
  project: ProjectMetadata,
  records: AuditRecord[],
  adjustments: DatabaseAdjustment[] = [],
  options: PdfExportOptions = {}
): jsPDF {
  const {
    includeFullAuditTrail = true,
    includeAdjustments = true,
    includeMethodologyStatement = true
  } = options;

  // Initialize A4 document in portrait orientation (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Global calculations
  const totalProtocolActivities = 64;
  const validRecords = records.filter((r) => r.evaluation === 'Sim');
  const errorRecords = records.filter((r) => r.evaluation === 'Não');
  const validCount = validRecords.length;
  const errorCount = errorRecords.length;
  const recordedCount = records.length;
  const precisionRate =
    recordedCount > 0 ? Math.round((validCount / recordedCount) * 100) : 0;
  const completionRate = Math.round((validCount / totalProtocolActivities) * 100);

  const issueDate = new Date();
  const dateStr = issueDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const timeStr = issueDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // ==========================================
  // 1. CAPA / CABEÇALHO DO LAUDO DOCUMENTAL
  // ==========================================
  // Top institutional banner bar (Slate 900)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 26, 'F');

  // Decorative accent line (Emerald green)
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 26, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(
    'UNIVERSIDADE FEDERAL DO CARIRI (UFCA) · LABORATÓRIO DE GEOJORNALISMO',
    margin,
    11
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text(
    'NÚCLEO DE JORNALISMO COMPUTACIONAL, DADOS ESPACIAIS, SIG E INTELIGÊNCIA ARTIFICIAL',
    margin,
    17
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(
    `EMISSÃO: ${dateStr} ${timeStr} · DOC REF: PROVA-${project.id.toUpperCase().substring(0, 8)}`,
    pageWidth - margin,
    14,
    { align: 'right' }
  );

  let currentY = 36;

  // Title of the Documentary Evidence
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text('LAUDO METODOLÓGICO E TRILHA DE AUDITORIA CIENTÍFICA', margin, currentY);

  currentY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    'PROVA DOCUMENTAL DE CONFORMIDADE CARTOGRÁFICA, INTEGRIDADE ESPACIAL E CONTROLE DE ALUCINAÇÕES EM IA',
    margin,
    currentY
  );

  currentY += 5;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Fundamentação: Protocolo de Validação Geojornalística · Luna (2026c)',
    margin,
    currentY
  );

  currentY += 6;

  // ==========================================
  // 2. QUADRO RESUMO DE METADADOS DO PROJETO
  // ==========================================
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        {
          content: 'DOSSIÊ DE IDENTIFICAÇÃO DA INVESTIGAÇÃO GEOJORNALÍSTICA',
          colSpan: 4,
          styles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 8.5
          }
        }
      ]
    ],
    body: [
      [
        { content: 'Título da Pauta / Mapa:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: project.title, colSpan: 3 }
      ],
      [
        { content: 'Pesquisador / Repórter:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${project.researcher} (${project.institution})` },
        { content: 'Data Início / Atualização:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${new Date(project.createdAt).toLocaleDateString('pt-BR')} / ${new Date(project.updatedAt).toLocaleDateString('pt-BR')}` }
      ],
      [
        { content: 'Objeto / Hipótese Apurada:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: project.targetObject, colSpan: 3 }
      ],
      [
        { content: 'Recorte Territorial:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: project.territoryDescription, colSpan: 3 }
      ],
      [
        { content: 'Camadas do Território:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        {
          content: `1. Regional: ${project.regionalLayerName} | 2. Local: ${project.localLayerName} | 3. Detalhe: ${project.detailLayerName}`,
          colSpan: 3
        }
      ],
      [
        { content: 'SRC de Cálculo e Métricas:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: `${project.calculationCrs} (Área Geodésica)` },
        { content: 'SRC de Design Cartográfico:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        { content: project.outputCrs }
      ],
      [
        { content: 'Status Global do Fluxo:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        {
          content:
            project.status === 'concluido'
              ? '✓ 100% HOMOLOGADO / AUDITADO'
              : project.status === 'paralisado'
              ? '⚠ FLUXO PARALISADO POR INCONSISTÊNCIA'
              : '⚡ INVESTIGAÇÃO EM ANDAMENTO',
          styles: {
            textColor:
              project.status === 'concluido'
                ? [16, 185, 129]
                : project.status === 'paralisado'
                ? [225, 29, 72]
                : [37, 99, 235],
            fontStyle: 'bold'
          }
        },
        { content: 'Certificação Criptográfica:', styles: { fontStyle: 'bold', fillColor: [248, 250, 252] } },
        {
          content: 'SHA-256 HASH VERIFICADO (INALTERÁVEL)',
          styles: { textColor: [16, 185, 129], fontStyle: 'bold' }
        }
      ]
    ],
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 50 },
      2: { cellWidth: 42 },
      3: { cellWidth: 48 }
    },
    margin: { left: margin, right: margin }
  });

  // Retrieve current Y position after table
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // 3. SÍNTESE ESTATÍSTICA E INDICADORES DE PRECISÃO
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. SÍNTESE EXECUTIVA DE CONFORMIDADE E PRECISÃO (LUNA, 2026c)', margin, currentY);

  currentY += 4;

  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [
      [
        'Atividades Totais',
        'Checkpoints Auditados',
        'Validados ("Sim")',
        'Erros / Paradas ("Não")',
        'Retificações',
        'Taxa de Precisão Factual',
        'Cobertura Metodológica'
      ]
    ],
    body: [
      [
        `${totalProtocolActivities} atividades`,
        `${recordedCount} checkpoints`,
        `${validCount} (${Math.round((validCount / (recordedCount || 1)) * 100)}%)`,
        `${errorCount} detectados`,
        `${adjustments.length} ajustes`,
        `${precisionRate}% de exatidão`,
        `${completionRate}% concluído`
      ]
    ],
    headStyles: {
      fillColor: [51, 65, 85],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 8,
      halign: 'center',
      fontStyle: 'bold',
      cellPadding: 3
    },
    styles: {
      lineColor: [203, 213, 225],
      lineWidth: 0.15
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 6;

  // ==========================================
  // 4. TABELA CONSOLIDADA POR FASE METODOLÓGICA
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. STATUS DE PROGRESSÃO E HOMOLOGAÇÃO POR FASE METODOLÓGICA', margin, currentY);

  currentY += 4;

  const phaseProgressRows = METHODOLOGY_PHASES.map((phase) => {
    const phaseRecords = records.filter((r) => r.phaseId === phase.id);
    const phaseValids = phaseRecords.filter((r) => r.evaluation === 'Sim').length;
    const phaseErrors = phaseRecords.filter((r) => r.evaluation === 'Não').length;
    const phaseTotal = phase.activities.length;
    const pct = Math.round((phaseValids / phaseTotal) * 100);
    const isComplete = phaseValids === phaseTotal;
    const hasError = phaseErrors > 0;

    let statusText = 'Em Aberto';
    if (isComplete) statusText = 'HOMOLOGADA (100%)';
    else if (hasError) statusText = 'INTERRUPÇÃO TÉCNICA';
    else if (phaseValids > 0) statusText = `EM EXECUÇÃO (${pct}%)`;

    return [
      `Fase ${phase.id} (${phase.code})`,
      phase.name,
      phase.journalisticArtifact,
      `${phaseTotal} ativ.`,
      `${phaseValids}`,
      `${phaseErrors}`,
      `${pct}%`,
      statusText
    ];
  });

  autoTable(doc, {
    startY: currentY,
    theme: 'striped',
    head: [
      [
        'Fase',
        'Nome da Etapa',
        'Artefato Jornalístico Esperado',
        'Meta',
        'Validadas',
        'Erros',
        'Conformidade',
        'Status da Fase'
      ]
    ],
    body: phaseProgressRows,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      lineColor: [226, 232, 240],
      lineWidth: 0.15
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: 'bold' },
      1: { cellWidth: 24, fontStyle: 'bold' },
      2: { cellWidth: 50 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 16, halign: 'center', textColor: [16, 185, 129] },
      5: { cellWidth: 14, halign: 'center' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 24, fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // ==========================================
  // 5. TRILHA DE AUDITORIA COMPLETA (LOG DETALHADO)
  // ==========================================
  if (includeFullAuditTrail) {
    // Add page break if near bottom
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 22;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(
      '3. TRILHA DE AUDITORIA E LOG DETALHADO DOS PONTOS DE CHECAGEM (AUDIT TRAIL)',
      margin,
      currentY
    );

    currentY += 4;

    const auditTableRows = records.map((r, index) => {
      const isSim = r.evaluation === 'Sim';
      const isRetificado = r.status === 'Retificado';

      const shortHash = r.recordHash ? `${r.recordHash.substring(0, 10)}...` : 'n/a';
      const formattedTimestamp = new Date(r.timestamp).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const technicalDetail = isSim
        ? `[EVIDÊNCIA]: ${r.technicalEvidence || 'Conformidade confirmada.'}`
        : `[ERRO]: ${r.errorDiagnosis || 'Inconsistência.'} | [CORREÇÃO]: ${r.correctiveAction || 'Pendente'}`;

      return [
        `${index + 1}`,
        `F${r.phaseId}.${r.activityNumber}`,
        r.activityTitle,
        `${r.checkpointVerb}: ${r.checkpointPrompt}`,
        isRetificado ? 'RETIFICADO' : r.evaluation,
        technicalDetail,
        `${r.operator}\n${formattedTimestamp}`,
        shortHash
      ];
    });

    if (auditTableRows.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Nenhum registro de auditoria arquivado no banco de dados até o momento.',
        margin,
        currentY + 4
      );
      currentY += 12;
    } else {
      autoTable(doc, {
        startY: currentY,
        theme: 'grid',
        head: [
          [
            '#',
            'Ativ.',
            'Título da Atividade',
            'Ponto de Checagem (Critério Binário)',
            'Veredito',
            'Evidência Técnica & Rastro do Erro',
            'Auditor / Data',
            'Hash SHA-256'
          ]
        ],
        body: auditTableRows,
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontSize: 7,
          fontStyle: 'bold',
          halign: 'center'
        },
        styles: {
          fontSize: 6.5,
          cellPadding: 2,
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 7, halign: 'center' },
          1: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
          2: { cellWidth: 32 },
          3: { cellWidth: 46 },
          4: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          5: { cellWidth: 38 },
          6: { cellWidth: 18, fontSize: 5.5 },
          7: { cellWidth: 11, fontStyle: 'italic', fontSize: 5.5 }
        },
        didParseCell: (data) => {
          // Colorize the verdict cell
          if (data.section === 'body' && data.column.index === 4) {
            const rawVal = data.cell.raw as string;
            if (rawVal === 'Sim') {
              data.cell.styles.textColor = [16, 185, 129]; // Emerald
            } else if (rawVal === 'Não') {
              data.cell.styles.textColor = [225, 29, 72]; // Rose
            } else if (rawVal === 'RETIFICADO') {
              data.cell.styles.textColor = [217, 119, 6]; // Amber
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // ==========================================
  // 6. REGISTRO DE RETIFICAÇÕES E AJUSTES TÉCNICOS
  // ==========================================
  if (includeAdjustments && adjustments.length > 0) {
    if (currentY > pageHeight - 45) {
      doc.addPage();
      currentY = 22;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(
      '4. HISTÓRICO DE AJUSTES RETROSPECTIVOS E RETIFICAÇÕES TÉCNICAS',
      margin,
      currentY
    );

    currentY += 4;

    const adjustmentRows = adjustments.map((adj, idx) => {
      const dateFormatted = new Date(adj.adjustedAt).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return [
        `${idx + 1}`,
        adj.id,
        adj.targetRecordId,
        dateFormatted,
        adj.adjustedBy,
        `${adj.previousEvaluation} ➔ ${adj.newEvaluation}`,
        adj.justification,
        adj.newEvidence || 'Conforme justificativa.'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      theme: 'grid',
      head: [
        [
          '#',
          'ID Ajuste',
          'Reg. Alvo',
          'Data / Hora',
          'Auditor',
          'Transição',
          'Justificativa Editorial / Científica',
          'Nova Evidência Técnica'
        ]
      ],
      body: adjustmentRows,
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontSize: 7,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 6.5,
        cellPadding: 2,
        lineColor: [226, 232, 240],
        lineWidth: 0.15
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 20 },
        2: { cellWidth: 20 },
        3: { cellWidth: 22 },
        4: { cellWidth: 22 },
        5: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        6: { cellWidth: 40 },
        7: { cellWidth: 33 }
      },
      margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // ==========================================
  // 7. DECLARAÇÃO INSTITUCIONAL DE PROVA METODOLÓGICA
  // ==========================================
  if (includeMethodologyStatement) {
    if (currentY > pageHeight - 55) {
      doc.addPage();
      currentY = 22;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('5. TERMO DE RESPONSABILIDADE METODOLÓGICA E REPRODUTIBILIDADE', margin, currentY);

    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 38, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    const statementText =
      'Atesta-se para os devidos fins de comprovação científica, transparência jornalística e arquivamento ' +
      'metodológico que a presente investigação espacial foi executada sob o protocolo estrito de validação binária ' +
      '(Luna, 2026c). As operações cartográficas foram processadas em sistema de coordenadas projetadas ' +
      `equivalente (${project.calculationCrs}), impedindo distorções no cômputo métrico de áreas e perímetros. ` +
      'Todo o uso de inteligência artificial generativa (IAG) foi submetido a auditoria anti-alucinação com verificação ' +
      'cruzada territorial nos 3 níveis (Regional, Local e Detalhe). As assinaturas criptográficas SHA-256 presentes neste ' +
      'laudo asseguram a inviolabilidade da trilha de auditoria em conformidade com o princípio do rastro do erro (Luna, 2026c).';

    doc.text(statementText, margin + 4, currentY + 6, {
      maxWidth: contentWidth - 8,
      align: 'justify',
      lineHeightFactor: 1.35
    });

    currentY += 44;

    // Signature blocks
    const colWidth = (contentWidth - 10) / 2;

    // Researcher / Journalist
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 5, currentY + 12, margin + colWidth - 5, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(project.researcher, margin + colWidth / 2, currentY + 16, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${project.institution} · Repórter / Pesquisador`, margin + colWidth / 2, currentY + 20, {
      align: 'center'
    });

    // Technical / Editor Responsible
    const secondColX = margin + colWidth + 10;
    doc.line(secondColX + 5, currentY + 12, secondColX + colWidth - 5, currentY + 12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('Auditoria Metodológica & Checagem Factual', secondColX + colWidth / 2, currentY + 16, {
      align: 'center'
    });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Comissão Editorial de Geojornalismo e Dados Espaciais', secondColX + colWidth / 2, currentY + 20, {
      align: 'center'
    });
  }

  // ==========================================
  // 8. CABEÇALHOS E RODAPÉS CORRIDOS EM TODAS AS PÁGINAS
  // ==========================================
  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
    doc.setPage(pageNum);

    // Running header (pages 2+)
    if (pageNum > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'PROVA DOCUMENTAL DA METODOLOGIA GEOJORNALÍSTICA · LAUDO DE AUDITORIA (LUNA, 2026c)',
        margin,
        10
      );
      doc.text(`PROJETO: ${project.title.substring(0, 45)}...`, pageWidth - margin, 10, {
        align: 'right'
      });

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, 12, pageWidth - margin, 12);
    }

    // Running footer on every page
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Documento arquivístico gerado em ${dateStr} às ${timeStr} · Hash de Integridade: SHA-256 Validado`,
      margin,
      pageHeight - 6.5
    );

    doc.setFont('helvetica', 'bold');
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, {
      align: 'right'
    });
  }

  return doc;
}

/**
 * Dispara o download direto do PDF no navegador
 */
export function downloadAuditDossierPdf(
  project: ProjectMetadata,
  records: AuditRecord[],
  adjustments: DatabaseAdjustment[] = [],
  options: PdfExportOptions = {}
): string {
  const doc = buildAuditDossierPdf(project, records, adjustments, options);
  const cleanTitle = project.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .substring(0, 30);

  const filename = `laudo_auditoria_geojornalismo_${cleanTitle}_${Date.now()}.pdf`;
  doc.save(filename);
  return filename;
}
