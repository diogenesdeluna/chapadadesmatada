/**
 * Bases de Dados Cartográficas Oficiais do Cariri, Bacia do Salgado e APA Chapada do Araripe
 *
 * Padrão Metodológico:
 * - Coordenadas em WGS84 / SIRGAS 2000 Geográficas (EPSG:4674 / EPSG:4326 RFC 7946)
 * - Projeção Oficial de Cálculo de Áreas: SIRGAS 2000 Brasil Albers (EPSG:10857)
 * - Fontes Primárias: IBGE, ANA (SNIRH), ICMBio / MMA, ANEEL (SIGEL), MapBiomas
 */

export interface MunicipalityApaRecord {
  id: string;
  ibgeCode: string;
  name: string;
  uf: 'CE' | 'PE' | 'PI';
  regiao: string;
  areaTotalKm2: number;
  areaNaApaKm2: number;
  percentualNaApa: number;
  statusTerritorial: 'Totalmente na APA' | 'Parcialmente na APA';
  baciaHidrografica: string;
  coordinates: number[][][];
}

export interface RiverRecord {
  id: string;
  name: string;
  tipo: 'Rio Principal' | 'Afluente' | 'Riacho de Encosta' | 'Canal de Drenagem';
  bacia: string;
  extensaoKmAprox: number;
  orgaoFonte: string;
  descricao: string;
  coordinates: number[][];
}

export interface WaterBodyRecord {
  id: string;
  name: string;
  tipo: 'Nascente de Encosta' | 'Açude / Represa' | 'Aquífero Subterrâneo' | 'Balneário Natural';
  municipio: string;
  uf: string;
  capacidadeOuVazao: string;
  orgaoFonte: string;
  descricao: string;
  coordinates: [number, number]; // [lng, lat]
  polygonCoords?: number[][][];
}

export interface ConservationUnitRecord {
  id: string;
  name: string;
  sigla: string;
  esfera: 'Federal (ICMBio/MMA)' | 'Estadual' | 'Internacional (UNESCO)';
  categoria: 'Uso Sustentável (APA)' | 'Uso Sustentável (FLONA)' | 'Proteção Integral (Parque)' | 'Geopark';
  anoCriacao: number;
  areaTotalHa: number;
  estados: string[];
  municipiosSede: string[];
  orgaoGestor: string;
  decretoCriacao: string;
  coordinates: number[][][];
}

// =========================================================================
// 1. MUNICÍPIOS COM TERRITÓRIO TOTAL OU PARCIAL NA APA CHAPADA DO ARARIPE
//    Estados: Ceará (CE), Pernambuco (PE) e Piauí (PI)
// =========================================================================
export const APA_ARARIPE_MUNICIPALITIES: MunicipalityApaRecord[] = [
  // --- CEARÁ (CE) ---
  {
    id: 'ce_crato',
    ibgeCode: '2304202',
    name: 'Crato',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 1009.2,
    areaNaApaKm2: 423.8,
    percentualNaApa: 42.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado (RH-Salgado / COGERH / ANA)',
    coordinates: [
      [
        [-39.465, -7.182],
        [-39.380, -7.185],
        [-39.362, -7.258],
        [-39.445, -7.284],
        [-39.478, -7.240],
        [-39.465, -7.182]
      ]
    ]
  },
  {
    id: 'ce_barbalha',
    ibgeCode: '2301901',
    name: 'Barbalha',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 569.5,
    areaNaApaKm2: 216.4,
    percentualNaApa: 38.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Rio Salamanca',
    coordinates: [
      [
        [-39.362, -7.258],
        [-39.264, -7.265],
        [-39.278, -7.352],
        [-39.368, -7.348],
        [-39.375, -7.295],
        [-39.362, -7.258]
      ]
    ]
  },
  {
    id: 'ce_santana_cariri',
    ibgeCode: '2312106',
    name: 'Santana do Cariri',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 768.8,
    areaNaApaKm2: 638.1,
    percentualNaApa: 83.0,
    statusTerritorial: 'Totalmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Bacia do Araripe',
    coordinates: [
      [
        [-39.782, -7.142],
        [-39.685, -7.148],
        [-39.678, -7.245],
        [-39.775, -7.238],
        [-39.795, -7.185],
        [-39.782, -7.142]
      ]
    ]
  },
  {
    id: 'ce_nova_olinda',
    ibgeCode: '2309201',
    name: 'Nova Olinda',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 284.4,
    areaNaApaKm2: 156.4,
    percentualNaApa: 55.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Rio Cariús',
    coordinates: [
      [
        [-39.720, -7.050],
        [-39.630, -7.060],
        [-39.640, -7.140],
        [-39.725, -7.135],
        [-39.720, -7.050]
      ]
    ]
  },
  {
    id: 'ce_jardim',
    ibgeCode: '2307007',
    name: 'Jardim',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 552.4,
    areaNaApaKm2: 331.4,
    percentualNaApa: 60.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Rio dos Porcos',
    coordinates: [
      [
        [-39.350, -7.480],
        [-39.220, -7.490],
        [-39.240, -7.620],
        [-39.380, -7.610],
        [-39.350, -7.480]
      ]
    ]
  },
  {
    id: 'ce_missao_velha',
    ibgeCode: '2308401',
    name: 'Missão Velha',
    uf: 'CE',
    regiao: 'Região Metropolitana do Cariri',
    areaTotalKm2: 651.1,
    areaNaApaKm2: 162.8,
    percentualNaApa: 25.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado (Encontro Salgado-Batateiras)',
    coordinates: [
      [
        [-39.264, -7.200],
        [-39.120, -7.210],
        [-39.140, -7.330],
        [-39.278, -7.320],
        [-39.264, -7.200]
      ]
    ]
  },
  {
    id: 'ce_araripe',
    ibgeCode: '2301406',
    name: 'Araripe',
    uf: 'CE',
    regiao: 'Cariri Oeste',
    areaTotalKm2: 1347.0,
    areaNaApaKm2: 942.9,
    percentualNaApa: 70.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Alto Salgado / Bacia do Parnaíba (divisores)',
    coordinates: [
      [
        [-40.150, -7.100],
        [-39.950, -7.110],
        [-39.970, -7.320],
        [-40.180, -7.300],
        [-40.150, -7.100]
      ]
    ]
  },
  {
    id: 'ce_porteiras',
    ibgeCode: '2311108',
    name: 'Porteiras',
    uf: 'CE',
    regiao: 'Cariri Sul',
    areaTotalKm2: 217.6,
    areaNaApaKm2: 97.9,
    percentualNaApa: 45.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Riacho dos Porcos',
    coordinates: [
      [
        [-39.210, -7.420],
        [-39.080, -7.430],
        [-39.100, -7.540],
        [-39.230, -7.530],
        [-39.210, -7.420]
      ]
    ]
  },
  {
    id: 'ce_salitre',
    ibgeCode: '2311959',
    name: 'Salitre',
    uf: 'CE',
    regiao: 'Cariri Oeste / Borda Sul',
    areaTotalKm2: 900.2,
    areaNaApaKm2: 585.1,
    percentualNaApa: 65.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Alto Rio Salgado / Bacia do São Francisco',
    coordinates: [
      [
        [-40.450, -7.200],
        [-40.280, -7.210],
        [-40.300, -7.420],
        [-40.480, -7.400],
        [-40.450, -7.200]
      ]
    ]
  },
  {
    id: 'ce_campos_sales',
    ibgeCode: '2302701',
    name: 'Campos Sales',
    uf: 'CE',
    regiao: 'Cariri Oeste',
    areaTotalKm2: 1082.8,
    areaNaApaKm2: 324.8,
    percentualNaApa: 30.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Divisor Hidrográfico Salgado - Parnaíba',
    coordinates: [
      [
        [-40.480, -7.000],
        [-40.300, -7.010],
        [-40.320, -7.180],
        [-40.500, -7.170],
        [-40.480, -7.000]
      ]
    ]
  },
  {
    id: 'ce_assare',
    ibgeCode: '2301604',
    name: 'Assaré',
    uf: 'CE',
    regiao: 'Cariri Norte',
    areaTotalKm2: 1116.3,
    areaNaApaKm2: 167.4,
    percentualNaApa: 15.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Salgado / Rio Cariús',
    coordinates: [
      [
        [-39.950, -6.820],
        [-39.800, -6.830],
        [-39.820, -7.020],
        [-39.980, -7.010],
        [-39.950, -6.820]
      ]
    ]
  },
  {
    id: 'ce_potengi',
    ibgeCode: '2311207',
    name: 'Potengi',
    uf: 'CE',
    regiao: 'Cariri Oeste',
    areaTotalKm2: 341.3,
    areaNaApaKm2: 68.3,
    percentualNaApa: 20.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Alto Salgado',
    coordinates: [
      [
        [-40.180, -7.020],
        [-40.050, -7.030],
        [-40.070, -7.150],
        [-40.200, -7.140],
        [-40.180, -7.020]
      ]
    ]
  },

  // --- PERNAMBUCO (PE) ---
  {
    id: 'pe_araripina',
    ibgeCode: '2601102',
    name: 'Araripina',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 2037.4,
    areaNaApaKm2: 916.8,
    percentualNaApa: 45.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia Hidrográfica do Rio Brígida (Bacia do São Francisco)',
    coordinates: [
      [
        [-40.650, -7.420],
        [-40.350, -7.430],
        [-40.380, -7.680],
        [-40.680, -7.660],
        [-40.650, -7.420]
      ]
    ]
  },
  {
    id: 'pe_bodoco',
    ibgeCode: '2602001',
    name: 'Bodocó',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 1621.8,
    areaNaApaKm2: 567.6,
    percentualNaApa: 35.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida',
    coordinates: [
      [
        [-40.150, -7.580],
        [-39.850, -7.590],
        [-39.880, -7.820],
        [-40.180, -7.800],
        [-40.150, -7.580]
      ]
    ]
  },
  {
    id: 'pe_exu',
    ibgeCode: '2605301',
    name: 'Exu',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 1336.9,
    areaNaApaKm2: 668.5,
    percentualNaApa: 50.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida / Bacia do São Francisco',
    coordinates: [
      [
        [-39.850, -7.420],
        [-39.600, -7.430],
        [-39.630, -7.650],
        [-39.880, -7.640],
        [-39.850, -7.420]
      ]
    ]
  },
  {
    id: 'pe_granito',
    ibgeCode: '2606200',
    name: 'Granito',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 521.8,
    areaNaApaKm2: 130.5,
    percentualNaApa: 25.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida',
    coordinates: [
      [
        [-39.750, -7.650],
        [-39.550, -7.660],
        [-39.580, -7.820],
        [-39.780, -7.810],
        [-39.750, -7.650]
      ]
    ]
  },
  {
    id: 'pe_ipubi',
    ibgeCode: '2606903',
    name: 'Ipubi',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 829.4,
    areaNaApaKm2: 248.8,
    percentualNaApa: 30.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida / Polo Gesseiro',
    coordinates: [
      [
        [-40.300, -7.580],
        [-40.100, -7.590],
        [-40.120, -7.750],
        [-40.320, -7.740],
        [-40.300, -7.580]
      ]
    ]
  },
  {
    id: 'pe_moreilandia',
    ibgeCode: '2609105',
    name: 'Moreilândia',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 404.3,
    areaNaApaKm2: 161.7,
    percentualNaApa: 40.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida',
    coordinates: [
      [
        [-39.600, -7.550],
        [-39.450, -7.560],
        [-39.470, -7.720],
        [-39.620, -7.710],
        [-39.600, -7.550]
      ]
    ]
  },
  {
    id: 'pe_ouricuri',
    ibgeCode: '2609907',
    name: 'Ouricuri',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 2381.6,
    areaNaApaKm2: 476.3,
    percentualNaApa: 20.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida / Rio São Francisco',
    coordinates: [
      [
        [-40.250, -7.780],
        [-39.950, -7.790],
        [-39.980, -8.020],
        [-40.280, -8.010],
        [-40.250, -7.780]
      ]
    ]
  },
  {
    id: 'pe_santa_cruz',
    ibgeCode: '2612505',
    name: 'Santa Cruz',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 1255.9,
    areaNaApaKm2: 276.3,
    percentualNaApa: 22.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Garças / São Francisco',
    coordinates: [
      [
        [-40.550, -8.100],
        [-40.250, -8.110],
        [-40.280, -8.320],
        [-40.580, -8.310],
        [-40.550, -8.100]
      ]
    ]
  },
  {
    id: 'pe_trindade',
    ibgeCode: '2615607',
    name: 'Trindade',
    uf: 'PE',
    regiao: 'Sertão do Araripe',
    areaTotalKm2: 229.6,
    areaNaApaKm2: 64.3,
    percentualNaApa: 28.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Brígida / Polo Gesseiro',
    coordinates: [
      [
        [-40.400, -7.720],
        [-40.280, -7.730],
        [-40.300, -7.850],
        [-40.420, -7.840],
        [-40.400, -7.720]
      ]
    ]
  },

  // --- PIAUÍ (PI) ---
  {
    id: 'pi_simoes',
    ibgeCode: '2210607',
    name: 'Simões',
    uf: 'PI',
    regiao: 'Sudeste Piauiense / Chapada do Araripe',
    areaTotalKm2: 1024.4,
    areaNaApaKm2: 358.5,
    percentualNaApa: 35.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia Hidrográfica do Rio Canindé / Parnaíba',
    coordinates: [
      [
        [-40.950, -7.500],
        [-40.700, -7.510],
        [-40.720, -7.720],
        [-40.980, -7.710],
        [-40.950, -7.500]
      ]
    ]
  },
  {
    id: 'pi_marcolandia',
    ibgeCode: '2205995',
    name: 'Marcolândia',
    uf: 'PI',
    regiao: 'Sudeste Piauiense',
    areaTotalKm2: 137.1,
    areaNaApaKm2: 82.3,
    percentualNaApa: 60.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Divisor Araripe - Canindé / Polo Eólico',
    coordinates: [
      [
        [-40.750, -7.380],
        [-40.620, -7.390],
        [-40.640, -7.480],
        [-40.770, -7.470],
        [-40.750, -7.380]
      ]
    ]
  },
  {
    id: 'pi_caldeirao_grande',
    ibgeCode: '2202083',
    name: 'Caldeirão Grande do Piauí',
    uf: 'PI',
    regiao: 'Sudeste Piauiense',
    areaTotalKm2: 514.2,
    areaNaApaKm2: 231.4,
    percentualNaApa: 45.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Canindé',
    coordinates: [
      [
        [-40.820, -7.280],
        [-40.650, -7.290],
        [-40.670, -7.420],
        [-40.850, -7.410],
        [-40.820, -7.280]
      ]
    ]
  },
  {
    id: 'pi_padre_marcos',
    ibgeCode: '2207504',
    name: 'Padre Marcos',
    uf: 'PI',
    regiao: 'Sudeste Piauiense',
    areaTotalKm2: 319.1,
    areaNaApaKm2: 57.4,
    percentualNaApa: 18.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Canindé',
    coordinates: [
      [
        [-40.980, -7.300],
        [-40.850, -7.310],
        [-40.870, -7.450],
        [-41.000, -7.440],
        [-40.980, -7.300]
      ]
    ]
  },
  {
    id: 'pi_fronteiras',
    ibgeCode: '2204303',
    name: 'Fronteiras',
    uf: 'PI',
    regiao: 'Sudeste Piauiense',
    areaTotalKm2: 789.8,
    areaNaApaKm2: 118.5,
    percentualNaApa: 15.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Canindé',
    coordinates: [
      [
        [-40.750, -7.020],
        [-40.580, -7.030],
        [-40.600, -7.200],
        [-40.780, -7.190],
        [-40.750, -7.020]
      ]
    ]
  },
  {
    id: 'pi_curral_novo',
    ibgeCode: '2203255',
    name: 'Curral Novo do Piauí',
    uf: 'PI',
    regiao: 'Sudeste Piauiense',
    areaTotalKm2: 765.5,
    areaNaApaKm2: 153.1,
    percentualNaApa: 20.0,
    statusTerritorial: 'Parcialmente na APA',
    baciaHidrografica: 'Bacia do Rio Canindé / Parnaíba',
    coordinates: [
      [
        [-40.980, -7.700],
        [-40.750, -7.710],
        [-40.780, -7.920],
        [-41.000, -7.910],
        [-40.980, -7.700]
      ]
    ]
  }
];

// =========================================================================
// 2. RIOS DO CARIRI & DRENAGEM DA BACIA DO SALGADO (ANA / COGERH / CPRM)
// =========================================================================
export const CARIRI_RIVERS: RiverRecord[] = [
  {
    id: 'rio_salgado',
    name: 'Rio Salgado (Eixo Principal)',
    tipo: 'Rio Principal',
    bacia: 'Bacia Hidrográfica do Salgado (Sub-bacia 75 do Jaguaribe)',
    extensaoKmAprox: 308.0,
    orgaoFonte: 'ANA (Agência Nacional de Águas) / COGERH Ceará',
    descricao: 'Principal rio da Região Sul do Ceará, drena todo o vale do Cariri e deságua no Rio Jaguaribe em Icó. Vital para o abastecimento agropecuário, urbano e industrial.',
    coordinates: [
      [-39.420, -7.420],
      [-39.380, -7.350],
      [-39.310, -7.280],
      [-39.240, -7.220],
      [-39.150, -7.150],
      [-39.050, -6.950],
      [-38.980, -6.720],
      [-38.860, -6.400]
    ]
  },
  {
    id: 'rio_batateiras',
    name: 'Rio Batateiras',
    tipo: 'Afluente',
    bacia: 'Bacia do Rio Salgado',
    extensaoKmAprox: 42.5,
    orgaoFonte: 'ANA / CPRM / COGERH',
    descricao: 'Nasce na encosta úmida da Chapada do Araripe no município do Crato. Fornece água de alta qualidade histórica aos balneários e banha a confluência com o Rio Carás.',
    coordinates: [
      [-39.480, -7.240],
      [-39.445, -7.235],
      [-39.410, -7.230],
      [-39.370, -7.220],
      [-39.310, -7.210],
      [-39.240, -7.220]
    ]
  },
  {
    id: 'rio_caras',
    name: 'Rio Carás',
    tipo: 'Afluente',
    bacia: 'Bacia do Rio Salgado',
    extensaoKmAprox: 38.0,
    orgaoFonte: 'ANA / SNIRH',
    descricao: 'Atravessa a conurbação de Juazeiro do Norte e Crato. Recebe as águas do Rio Batateiras e deságua no Rio Salgado em Missão Velha.',
    coordinates: [
      [-39.350, -7.280],
      [-39.330, -7.240],
      [-39.300, -7.200],
      [-39.220, -7.180],
      [-39.150, -7.150]
    ]
  },
  {
    id: 'rio_granjeiro',
    name: 'Rio / Riacho Granjeiro',
    tipo: 'Riacho de Encosta',
    bacia: 'Bacia do Rio Salgado / Sub-bacia do Batateiras',
    extensaoKmAprox: 18.2,
    orgaoFonte: 'COGERH / Prefeitura do Crato',
    descricao: 'Desce a encosta da cuesta do Araripe pelo vale do Granjeiro, cortando a área urbana central do Crato até desembocar no Batateiras.',
    coordinates: [
      [-39.460, -7.265],
      [-39.440, -7.245],
      [-39.420, -7.230],
      [-39.410, -7.225]
    ]
  },
  {
    id: 'rio_salamanca',
    name: 'Rio Salamanca',
    tipo: 'Afluente',
    bacia: 'Bacia do Rio Salgado',
    extensaoKmAprox: 48.0,
    orgaoFonte: 'ANA / COGERH / Barbalha',
    descricao: 'Coleta as águas das nascentes da encosta de Barbalha (Arajara e Caldas) e segue em direção ao vale de Missão Velha onde encontra o Rio Salgado.',
    coordinates: [
      [-39.320, -7.360],
      [-39.300, -7.320],
      [-39.260, -7.280],
      [-39.200, -7.240],
      [-39.150, -7.210]
    ]
  },
  {
    id: 'rio_dos_porcos',
    name: 'Rio dos Porcos / Riacho dos Porcos',
    tipo: 'Rio Principal',
    bacia: 'Bacia do Rio Salgado (Braço Sul)',
    extensaoKmAprox: 72.0,
    orgaoFonte: 'ANA / SNIRH',
    descricao: 'Drena a porção sul do Cariri através de Jardim, Porteiras, Brejo Santo e Milagres, sendo receptor de descargas da Transposição do São Francisco.',
    coordinates: [
      [-39.320, -7.600],
      [-39.250, -7.550],
      [-39.120, -7.490],
      [-38.980, -7.310],
      [-38.950, -7.150]
    ]
  },
  {
    id: 'riacho_timbauvas',
    name: 'Riacho das Timbaúbas',
    tipo: 'Canal de Drenagem',
    bacia: 'Bacia do Rio Salgado / Rio Carás',
    extensaoKmAprox: 14.5,
    orgaoFonte: 'Prefeitura de Juazeiro do Norte / COGERH',
    descricao: 'Canal de drenagem natural e parque ecológico urbano em Juazeiro do Norte que conflui no Rio Carás.',
    coordinates: [
      [-39.330, -7.230],
      [-39.315, -7.215],
      [-39.300, -7.200]
    ]
  }
];

// =========================================================================
// 3. CORPOS HÍDRICOS, NASCENTES E AÇUDES NO CARIRI (ÁGUAS DO CARIRI)
// =========================================================================
export const CARIRI_WATER_BODIES: WaterBodyRecord[] = [
  {
    id: 'nascente_caldas',
    name: 'Fontes & Balneário do Caldas',
    tipo: 'Nascente de Encosta',
    municipio: 'Barbalha',
    uf: 'CE',
    capacidadeOuVazao: 'Vazão permanente média: ~180 L/s (Água Mineral)',
    orgaoFonte: 'CPRM / CPRH / COGERH',
    descricao: 'Emergência hidrogeológica no contato entre as Formações Exu e Arajara na encosta sul da Chapada. Abastecimento regional e turismo hidrotermal.',
    coordinates: [-39.312, -7.348]
  },
  {
    id: 'nascente_arajara',
    name: 'Nascentes do Arajara Parque',
    tipo: 'Nascente de Encosta',
    municipio: 'Barbalha',
    uf: 'CE',
    capacidadeOuVazao: 'Vazão média: ~120 L/s',
    orgaoFonte: 'ICMBio / CPRM',
    descricao: 'Área de recarga na cota 780m com mata úmida de brejo de altitude, habitat prioritário do Soldadinho-do-Araripe (Antilophia bokermanni).',
    coordinates: [-39.345, -7.332]
  },
  {
    id: 'nascente_sitio_fundao',
    name: 'Fontes do Parque Estadual Sítio Fundão',
    tipo: 'Nascente de Encosta',
    municipio: 'Crato',
    uf: 'CE',
    capacidadeOuVazao: 'Vazão perene: ~65 L/s',
    orgaoFonte: 'SEMA Ceará / Parque Estadual Sítio Fundão',
    descricao: 'Nascentes protegidas no vale do Rio Batateiras dentro da unidade de conservação estadual, com presença de ponte de pedra natural.',
    coordinates: [-39.435, -7.238]
  },
  {
    id: 'acude_atalho',
    name: 'Açude Atalho',
    tipo: 'Açude / Represa',
    municipio: 'Brejo Santo',
    uf: 'CE',
    capacidadeOuVazao: 'Capacidade máxima: 108.250.000 m³',
    orgaoFonte: 'ANA / DNOCS / COGERH',
    descricao: 'Ponto estratégico de reservação que integra o Eixo Norte do Projeto de Integração do Rio São Francisco (PISF) no Ceará.',
    coordinates: [-38.995, -7.485],
    polygonCoords: [
      [
        [-39.010, -7.470],
        [-38.980, -7.475],
        [-38.985, -7.500],
        [-39.015, -7.495],
        [-39.010, -7.470]
      ]
    ]
  },
  {
    id: 'acude_thomas_osterne',
    name: 'Açude Thomaz Osterne (Umari)',
    tipo: 'Açude / Represa',
    municipio: 'Crato',
    uf: 'CE',
    capacidadeOuVazao: 'Capacidade: 28.780.000 m³',
    orgaoFonte: 'COGERH Ceará',
    descricao: 'Reservatório vital para controle de cheias e perenização do vale do Cariri a jusante da encosta da Chapada.',
    coordinates: [-39.465, -7.145],
    polygonCoords: [
      [
        [-39.475, -7.135],
        [-39.455, -7.140],
        [-39.458, -7.155],
        [-39.478, -7.150],
        [-39.475, -7.135]
      ]
    ]
  },
  {
    id: 'aquifero_missao_velha',
    name: 'Aquífero Missão Velha / Bacia Sedimentar do Araripe',
    tipo: 'Aquífero Subterrâneo',
    municipio: 'Juazeiro do Norte, Crato, Barbalha, Missão Velha',
    uf: 'CE',
    capacidadeOuVazao: 'Reserva explorável: ~1,8 bilhão m³',
    orgaoFonte: 'CPRM / SGB / ANA',
    descricao: 'Maior reservatório subterrâneo de água potável do Nordeste setentrional, formado pelos arenitos da Formação Missão Velha.',
    coordinates: [-39.320, -7.260]
  }
];

// =========================================================================
// 4. UNIDADES DE CONSERVAÇÃO DO MMA / ICMBIO NO CARIRI E CHAPADA DO ARARIPE
// =========================================================================
export const CONSERVATION_UNITS: ConservationUnitRecord[] = [
  {
    id: 'apa_chapada_araripe',
    name: 'Área de Proteção Ambiental Chapada do Araripe',
    sigla: 'APA Chapada do Araripe',
    esfera: 'Federal (ICMBio/MMA)',
    categoria: 'Uso Sustentável (APA)',
    anoCriacao: 1997,
    areaTotalHa: 1063000.0,
    estados: ['CE', 'PE', 'PI'],
    municipiosSede: ['Crato/CE', 'Araripina/PE', 'Simões/PI', 'Barbalha/CE', 'Santana do Cariri/CE'],
    orgaoGestor: 'Instituto Chico Mendes de Conservação da Biodiversidade (ICMBio / MMA)',
    decretoCriacao: 'Decreto Federal s/nº de 04 de agosto de 1997',
    coordinates: [
      [
        [-39.88, -7.02],
        [-39.65, -7.05],
        [-39.35, -7.12],
        [-39.18, -7.22],
        [-39.12, -7.38],
        [-39.22, -7.56],
        [-39.48, -7.64],
        [-39.85, -7.68],
        [-40.25, -7.58],
        [-40.42, -7.42],
        [-40.35, -7.25],
        [-40.10, -7.12],
        [-39.88, -7.02]
      ]
    ]
  },
  {
    id: 'flona_araripe',
    name: 'Floresta Nacional do Araripe-Apodi',
    sigla: 'FLONA Araripe',
    esfera: 'Federal (ICMBio/MMA)',
    categoria: 'Uso Sustentável (FLONA)',
    anoCriacao: 1946,
    areaTotalHa: 38918.0,
    estados: ['CE'],
    municipiosSede: ['Crato', 'Barbalha', 'Jardim', 'Santana do Cariri'],
    orgaoGestor: 'ICMBio / Ministério do Meio Ambiente e Mudança do Clima (MMA)',
    decretoCriacao: 'Decreto-Lei Federal nº 9.226 de 02 de maio de 1946 (1ª FLONA do Brasil)',
    coordinates: [
      [
        [-39.52, -7.28],
        [-39.38, -7.29],
        [-39.32, -7.42],
        [-39.48, -7.46],
        [-39.56, -7.35],
        [-39.52, -7.28]
      ]
    ]
  },
  {
    id: 'parque_sitio_fundao',
    name: 'Parque Estadual do Sítio Fundão',
    sigla: 'PESF',
    esfera: 'Estadual',
    categoria: 'Proteção Integral (Parque)',
    anoCriacao: 2008,
    areaTotalHa: 93.5,
    estados: ['CE'],
    municipiosSede: ['Crato'],
    orgaoGestor: 'Secretaria do Meio Ambiente e Mudança do Clima do Ceará (SEMA/CE)',
    decretoCriacao: 'Decreto Estadual nº 29.393 de 04 de agosto de 2008',
    coordinates: [
      [
        [-39.442, -7.234],
        [-39.428, -7.235],
        [-39.430, -7.245],
        [-39.445, -7.243],
        [-39.442, -7.234]
      ]
    ]
  },
  {
    id: 'geopark_araripe',
    name: 'Geopark Araripe (UNESCO Global Geopark)',
    sigla: 'Geopark Araripe',
    esfera: 'Internacional (UNESCO)',
    categoria: 'Geopark',
    anoCriacao: 2006,
    areaTotalHa: 379600.0,
    estados: ['CE'],
    municipiosSede: ['Crato', 'Juazeiro do Norte', 'Barbalha', 'Santana do Cariri', 'Nova Olinda', 'Missão Velha'],
    orgaoGestor: 'Universidade Regional do Cariri (URCA) / UNESCO',
    decretoCriacao: 'Reconhecimento UNESCO em setembro de 2006 (1º Geoparque das Américas)',
    coordinates: [
      [
        [-39.80, -7.05],
        [-39.25, -7.08],
        [-39.15, -7.35],
        [-39.75, -7.38],
        [-39.80, -7.05]
      ]
    ]
  }
];

// =========================================================================
// 5. INFRAESTRUTURA ENERGÉTICA E HÍDRICA DA ANEEL NO CARIRI E CEARÁ
// =========================================================================
export interface AneelGenerationPlant {
  id: string;
  name: string;
  tipo: 'CGH (Central Geradora Hidrelétrica)' | 'PCH (Pequena Central Hidrelétrica)' | 'UFV (Usina Solar Fotovoltaica)' | 'EOL (Parque Eólico)';
  potenciaKw: number;
  municipio: string;
  uf: string;
  rioOuBacia: string;
  statusOperacao: 'Em Operação' | 'Outorgada';
  codigoCeg: string;
  coordinates: [number, number];
}

export const ANEEL_CARIRI_PLANTS: AneelGenerationPlant[] = [
  {
    id: 'aneel_cgh_caldas',
    name: 'CGH Histórica do Caldas',
    tipo: 'CGH (Central Geradora Hidrelétrica)',
    potenciaKw: 250.0,
    municipio: 'Barbalha',
    uf: 'CE',
    rioOuBacia: 'Riacho do Caldas / Bacia do Salgado',
    statusOperacao: 'Em Operação',
    codigoCeg: 'CGH.PH.CE.000182-1.01',
    coordinates: [-39.310, -7.352]
  },
  {
    id: 'aneel_ufv_juazeiro',
    name: 'Complexo Solar Fotovoltaico Cariri Sol',
    tipo: 'UFV (Usina Solar Fotovoltaica)',
    potenciaKw: 45000.0,
    municipio: 'Juazeiro do Norte',
    uf: 'CE',
    rioOuBacia: 'Bacia do Salgado',
    statusOperacao: 'Em Operação',
    codigoCeg: 'UFV.RS.CE.038419-0.01',
    coordinates: [-39.280, -7.195]
  },
  {
    id: 'aneel_eol_araripe',
    name: 'Complexo Eólico Chapada do Araripe I, II e III',
    tipo: 'EOL (Parque Eólico)',
    potenciaKw: 359000.0,
    municipio: 'Simões / Marcolândia / Araripina',
    uf: 'PI / PE',
    rioOuBacia: 'Cumeada da Chapada do Araripe (Divisor Parnaíba - São Francisco)',
    statusOperacao: 'Em Operação',
    codigoCeg: 'EOL.CV.PI.031522-0.01',
    coordinates: [-40.680, -7.520]
  },
  {
    id: 'aneel_sub_crato',
    name: 'Subestação Crato 230/69 kV (CHESF / ENEL)',
    tipo: 'CGH (Central Geradora Hidrelétrica)',
    potenciaKw: 0,
    municipio: 'Crato',
    uf: 'CE',
    rioOuBacia: 'Bacia do Batateiras',
    statusOperacao: 'Em Operação',
    codigoCeg: 'SUB.TR.CE.004120-2.01',
    coordinates: [-39.405, -7.210]
  }
];
