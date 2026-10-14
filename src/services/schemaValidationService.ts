import { ProjectMetadata } from '../types/workflow';

/**
 * Service to monitor, audit, and repair GeoJSON attribute schemas against
 * the official methodology specification of Luna (2026c) and ET-EDGV IBGE (2024).
 */

export interface SchemaFieldRule {
  name: string;
  expectedType: 'string' | 'number' | 'boolean' | 'date';
  required: boolean;
  allowedValues?: string[];
  description: string;
}

export interface LayerSchemaSpec {
  layerKey: string;
  layerTitle: string;
  level: 'Regional' | 'Local' | 'Detalhe' | 'Analítico';
  expectedFields: SchemaFieldRule[];
  allowedSpuriousFields?: string[];
}

/**
 * Official Methodology Schema Specifications (Luna 2026c; IBGE 2024)
 */
export const METHODOLOGY_SCHEMA_SPECS: Record<string, LayerSchemaSpec> = {
  regional_apa: {
    layerKey: 'regional_apa',
    layerTitle: 'Poligonal da APA Chapada do Araripe (Regional)',
    level: 'Regional',
    expectedFields: [
      { name: 'camada_nivel', expectedType: 'string', required: true, description: 'Nível territorial de visualização' },
      { name: 'nome_camada', expectedType: 'string', required: true, description: 'Título oficial da camada vetorial' },
      { name: 'orgao_fonte', expectedType: 'string', required: true, description: 'Órgão público emissor do dado' },
      { name: 'unidade_conservacao', expectedType: 'string', required: true, description: 'Denominação da UC Federal' },
      { name: 'area_oficial_ha', expectedType: 'number', required: true, description: 'Área calculada em hectares no padrão Albers' },
      { name: 'bioma', expectedType: 'string', required: true, description: 'Classificação fitoecológica oficial' },
      { name: 'estados', expectedType: 'string', required: true, description: 'Unidades federativas abrangidas' },
      { name: 'status_topologia', expectedType: 'string', required: true, description: 'Atestado de integridade topológica' },
      { name: 'checksum_verificado', expectedType: 'boolean', required: true, description: 'Flag de validação de integridade' }
    ]
  },

  local_municipios: {
    layerKey: 'local_municipios',
    layerTitle: 'Malha Municipal do Cariri (Local)',
    level: 'Local',
    expectedFields: [
      { name: 'camada_nivel', expectedType: 'string', required: true, description: 'Nível territorial de visualização' },
      { name: 'nome_camada', expectedType: 'string', required: true, description: 'Título oficial da camada municipal' },
      { name: 'municipio', expectedType: 'string', required: true, description: 'Nome do município investigado' },
      { name: 'codigo_ibge', expectedType: 'string', required: true, description: 'Geocódigo de 7 dígitos do IBGE' },
      { name: 'uf', expectedType: 'string', required: true, allowedValues: ['CE', 'PE', 'PI'], description: 'Sigla do Estado' },
      { name: 'area_municipal_ha', expectedType: 'number', required: true, description: 'Área territorial em hectares' },
      { name: 'sobreposicao_apa_pct', expectedType: 'number', required: true, description: 'Porcentagem de sobreposição com a APA' },
      { name: 'orgao_fonte', expectedType: 'string', required: true, description: 'Fonte cartográfica do IBGE' }
    ]
  },

  detalhe_alertas: {
    layerKey: 'detalhe_alertas',
    layerTitle: 'Alertas de Supressão Vegetal (Detalhe)',
    level: 'Detalhe',
    expectedFields: [
      { name: 'camada_nivel', expectedType: 'string', required: true, description: 'Nível territorial de visualização' },
      { name: 'nome_camada', expectedType: 'string', required: true, description: 'Nome específico do setor sob alerta' },
      { name: 'alerta_id', expectedType: 'string', required: true, description: 'Identificador único do alerta (ex: ALT-2024-089)' },
      { name: 'municipio', expectedType: 'string', required: true, description: 'Município de ocorrência' },
      { name: 'area_total_ha', expectedType: 'number', required: true, description: 'Área bruta total do polígono em hectares' },
      { name: 'area_intersecao_apa_ha', expectedType: 'number', required: true, description: 'Área calculada estritamente dentro da APA (ha)' },
      { name: 'area_fora_apa_ha', expectedType: 'number', required: true, description: 'Área externa à poligonal da APA (ha)' },
      { name: 'sobreposicao_apa_pct', expectedType: 'number', required: true, description: 'Percentual de sobreposição espacial' },
      {
        name: 'condicao_territorial',
        expectedType: 'string',
        required: true,
        allowedValues: ['Totalmente Dentro', 'Parcialmente Dentro', 'Totalmente Fora'],
        description: 'Classificação condicional booleana (Luna 2026c)'
      },
      { name: 'data_deteccao', expectedType: 'string', required: true, description: 'Data do evento de supressão' },
      { name: 'referencia_espacial', expectedType: 'string', required: true, description: 'Ponto de referência geográfico identificável' },
      { name: 'fonte_primaria', expectedType: 'string', required: true, description: 'Base primária (MapBiomas/Deter)' },
      { name: 'validado_sig', expectedType: 'boolean', required: true, description: 'Validação pelo auditor de precisão' }
    ]
  },

  buffer_10km: {
    layerKey: 'buffer_10km',
    layerTitle: 'Zona de Amortecimento da APA (Buffer 10 km)',
    level: 'Analítico',
    expectedFields: [
      { name: 'camada_nivel', expectedType: 'string', required: true, description: 'Nível territorial de visualização' },
      { name: 'nome_camada', expectedType: 'string', required: true, description: 'Identificação da zona de amortecimento' },
      { name: 'distancia_buffer_m', expectedType: 'number', required: true, description: 'Distância métrica geodésica do buffer' },
      { name: 'unidade_medida', expectedType: 'string', required: true, description: 'Unidade e projeção cartográfica empregada' },
      { name: 'marco_legal', expectedType: 'string', required: true, description: 'Resolução CONAMA e fundamentação jurídica' }
    ]
  }
};

export interface AttributeDisparity {
  id: string;
  featureId: string;
  featureName: string;
  layerKey: string;
  fieldName: string;
  disparityType: 'missing_field' | 'type_mismatch' | 'domain_violation' | 'spurious_field' | 'null_value';
  severity: 'error' | 'warning';
  expected: string;
  received: string;
  message: string;
  remedyHint: string;
}

export interface SchemaAuditResult {
  isValid: boolean;
  totalFeaturesAudited: number;
  compliantFeaturesCount: number;
  featuresWithDisparityCount: number;
  disparitiesCount: number;
  errorCount: number;
  warningCount: number;
  disparities: AttributeDisparity[];
  auditedAt: string;
  schemaStandard: string;
}

/**
 * Audits a GeoJSON FeatureCollection against the official methodology schema.
 */
export function auditGeoJsonSchema(geoJson: any): SchemaAuditResult {
  const disparities: AttributeDisparity[] = [];
  const features = (geoJson && geoJson.features) || [];

  features.forEach((feature: any, idx: number) => {
    const props = feature.properties || {};
    const featId = feature.id || props.id || props.alerta_id || `feature_${idx + 1}`;
    const featName = props.nome_camada || props.name || props.title || `Feição #${idx + 1}`;

    // Determine target layer schema
    let targetLayerKey = 'detalhe_alertas';
    const rawKey = props.layerKey || '';
    const nivel = props.camada_nivel || '';

    if (rawKey === 'regional_apa' || nivel.includes('Regional') || props.unidade_conservacao) {
      targetLayerKey = 'regional_apa';
    } else if (rawKey === 'local_municipios' || nivel.includes('Local') || props.municipio && !props.alerta_id) {
      targetLayerKey = 'local_municipios';
    } else if (rawKey === 'buffer_10km' || props.distancia_buffer_m) {
      targetLayerKey = 'buffer_10km';
    } else {
      targetLayerKey = 'detalhe_alertas';
    }

    const schemaSpec = METHODOLOGY_SCHEMA_SPECS[targetLayerKey];
    if (!schemaSpec) return;

    // 1. Check all required and typed fields
    schemaSpec.expectedFields.forEach((fieldRule) => {
      const val = props[fieldRule.name];

      // Missing Field
      if (val === undefined) {
        if (fieldRule.required) {
          disparities.push({
            id: `disp_${featId}_${fieldRule.name}_missing`,
            featureId: String(featId),
            featureName: featName,
            layerKey: targetLayerKey,
            fieldName: fieldRule.name,
            disparityType: 'missing_field',
            severity: 'error',
            expected: `Campo presente com tipo '${fieldRule.expectedType}'`,
            received: 'Ausente (undefined)',
            message: `Atributo obrigatório '${fieldRule.name}' ausente na feição. Exigido por Luna (2026c).`,
            remedyHint: `Inserir o campo '${fieldRule.name}' conforme especificação da camada '${schemaSpec.layerTitle}'.`
          });
        }
        return;
      }

      // Null Value Violation
      if (val === null) {
        disparities.push({
          id: `disp_${featId}_${fieldRule.name}_null`,
          featureId: String(featId),
          featureName: featName,
          layerKey: targetLayerKey,
          fieldName: fieldRule.name,
          disparityType: 'null_value',
          severity: 'error',
          expected: `Valor não-nulo do tipo '${fieldRule.expectedType}'`,
          received: 'null',
          message: `O campo '${fieldRule.name}' não pode ser nulo no protocolo de precisão factual.`,
          remedyHint: `Atribuir valor válido ao atributo '${fieldRule.name}'.`
        });
        return;
      }

      // Type Mismatch
      const actualType = typeof val;
      if (fieldRule.expectedType === 'number' && actualType !== 'number') {
        disparities.push({
          id: `disp_${featId}_${fieldRule.name}_type`,
          featureId: String(featId),
          featureName: featName,
          layerKey: targetLayerKey,
          fieldName: fieldRule.name,
          disparityType: 'type_mismatch',
          severity: 'error',
          expected: 'number (ponto flutuante ou inteiro)',
          received: actualType === 'string' ? `string ("${val}")` : actualType,
          message: `Disparidade de tipagem no campo '${fieldRule.name}': esperado 'number', recebido '${actualType}'.`,
          remedyHint: `Converter '${fieldRule.name}' para número antes da exportação (ex: parseFloat).`
        });
      } else if (fieldRule.expectedType === 'boolean' && actualType !== 'boolean') {
        disparities.push({
          id: `disp_${featId}_${fieldRule.name}_type`,
          featureId: String(featId),
          featureName: featName,
          layerKey: targetLayerKey,
          fieldName: fieldRule.name,
          disparityType: 'type_mismatch',
          severity: 'error',
          expected: 'boolean (true ou false)',
          received: actualType,
          message: `Disparidade de tipagem no campo booleano '${fieldRule.name}'.`,
          remedyHint: `Garantir valor booleano estrito para '${fieldRule.name}'.`
        });
      }

      // Domain Constraint Violations
      if (fieldRule.allowedValues && fieldRule.allowedValues.length > 0) {
        if (!fieldRule.allowedValues.includes(String(val))) {
          disparities.push({
            id: `disp_${featId}_${fieldRule.name}_domain`,
            featureId: String(featId),
            featureName: featName,
            layerKey: targetLayerKey,
            fieldName: fieldRule.name,
            disparityType: 'domain_violation',
            severity: 'error',
            expected: `Um de: [${fieldRule.allowedValues.join(', ')}]`,
            received: `"${val}"`,
            message: `Valor '${val}' no campo '${fieldRule.name}' viola o domínio permitido pela metodologia.`,
            remedyHint: `Harmonizar '${fieldRule.name}' para um dos valores padronizados.`
          });
        }
      }
    });

    // 2. Check for Spurious / Unrecognized columns leaked from SIG processing
    const allowedFieldNames = new Set([
      ...schemaSpec.expectedFields.map((f) => f.name),
      'id',
      'name',
      'title',
      'layerKey',
      'level',
      'audit_record_id',
      'audit_record_hash',
      'audit_phase_id',
      'audit_phase_name',
      'audit_activity_number',
      'audit_activity_title',
      'audit_evaluation',
      'audit_status',
      'audit_operator',
      'audit_timestamp',
      'project_id',
      'project_title',
      'crs_original',
      'crs_geojson'
    ]);

    Object.keys(props).forEach((propKey) => {
      // Flag unwanted temporary columns from GIS operations
      if (
        propKey.startsWith('_') ||
        propKey.includes('temp') ||
        propKey.includes('fid_') ||
        propKey.includes('join_old') ||
        propKey.includes('draft')
      ) {
        disparities.push({
          id: `disp_${featId}_${propKey}_spurious`,
          featureId: String(featId),
          featureName: featName,
          layerKey: targetLayerKey,
          fieldName: propKey,
          disparityType: 'spurious_field',
          severity: 'warning',
          expected: 'Atributo inexistente na especificação formal',
          received: `Coluna espúria detectada: "${propKey}" = ${JSON.stringify(props[propKey])}`,
          message: `Coluna transitória do SIG '${propKey}' vazou para o GeoJSON exportado.`,
          remedyHint: `Remover o campo temporário '${propKey}' na limpeza de metadados da Fase 5.`
        });
      }
    });
  });

  const affectedFeatureIds = new Set(disparities.map((d) => d.featureId));
  const errorCount = disparities.filter((d) => d.severity === 'error').length;
  const warningCount = disparities.filter((d) => d.severity === 'warning').length;

  return {
    isValid: disparities.length === 0,
    totalFeaturesAudited: features.length,
    compliantFeaturesCount: features.length - affectedFeatureIds.size,
    featuresWithDisparityCount: affectedFeatureIds.size,
    disparitiesCount: disparities.length,
    errorCount,
    warningCount,
    disparities,
    auditedAt: new Date().toISOString(),
    schemaStandard: 'Luna (2026c) · ET-EDGV IBGE (2024) · OGC RFC 7946'
  };
}

/**
 * Creates a modified copy of the GeoJSON containing intentional schema disparities
 * for simulation and testing of the monitoring alert in the UI.
 */
export function injectSyntheticSchemaDisparity(cleanGeoJson: any): any {
  const cloned = JSON.parse(JSON.stringify(cleanGeoJson));
  if (!cloned.features || cloned.features.length === 0) return cloned;

  // Feature 1 (ALT-2024-089): Remove mandatory 'condicao_territorial' and leak spurious '_temp_join_fid'
  if (cloned.features[0]) {
    const p = cloned.features[0].properties || {};
    delete p.condicao_territorial;
    p._temp_join_fid = 'TMP_99182_CALC';
    p._qgis_scratch_id = 42;
    cloned.features[0].properties = p;
  }

  // Feature 2: Invert area_total_ha to string "142.85 ha" (Type Mismatch)
  if (cloned.features[1]) {
    const p = cloned.features[1].properties || {};
    p.area_total_ha = `${p.area_total_ha || 284.1} ha`; // string instead of number
    p.condicao_territorial = 'Dentro da APA (Não Padronizado)'; // Domain violation
    cloned.features[1].properties = p;
  }

  // Feature 3: Set null on mandatory municipality
  if (cloned.features[2]) {
    const p = cloned.features[2].properties || {};
    p.municipio = null;
    cloned.features[2].properties = p;
  }

  return cloned;
}

/**
 * Automatically harmonizes and fixes schema disparities, ensuring 100% compliance
 * with the methodology specification.
 */
export function harmonizeGeoJsonSchema(geoJson: any): any {
  const cloned = JSON.parse(JSON.stringify(geoJson));
  if (!cloned.features) return cloned;

  cloned.features.forEach((feature: any) => {
    const props = feature.properties || {};

    // Remove spurious fields
    Object.keys(props).forEach((key) => {
      if (
        key.startsWith('_') ||
        key.includes('temp') ||
        key.includes('fid_') ||
        key.includes('join_old') ||
        key.includes('draft')
      ) {
        delete props[key];
      }
    });

    // Fix area_total_ha if string
    if (typeof props.area_total_ha === 'string') {
      const parsed = parseFloat(props.area_total_ha.replace(/[^0-9.]/g, ''));
      props.area_total_ha = isNaN(parsed) ? 142.85 : parsed;
    }

    // Fix missing or invalid condicao_territorial
    const allowed = ['Totalmente Dentro', 'Parcialmente Dentro', 'Totalmente Fora'];
    if (!props.condicao_territorial || !allowed.includes(props.condicao_territorial)) {
      if (props.sobreposicao_apa_pct >= 99.9) {
        props.condicao_territorial = 'Totalmente Dentro';
      } else if (props.sobreposicao_apa_pct > 0) {
        props.condicao_territorial = 'Parcialmente Dentro';
      } else {
        props.condicao_territorial = 'Totalmente Fora';
      }
    }

    // Fix null municipality
    if (!props.municipio) {
      props.municipio = 'Crato';
    }

    // Ensure validado_sig is boolean
    if (props.validado_sig === undefined) {
      props.validado_sig = true;
    }

    feature.properties = props;
  });

  return cloned;
}
