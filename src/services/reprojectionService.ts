import proj4 from 'proj4';
import shp from 'shpjs';

// Definition of official Coordinate Reference Systems
export const CRS_DEFS = {
  // SIRGAS 2000 Brasil Geográficas (Padrão de Download de Dados Públicos do Brasil)
  EPSG_4674: '+proj=longlat +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +no_defs',
  // SIRGAS 2000 / Brasil Albers (Padrão Oficial IBGE para Cálculos de Área e Sobreposição)
  EPSG_10857: '+proj=aea +lat_0=-12 +lon_0=-54 +lat_1=-2 +lat_2=-22 +x_0=5000000 +y_0=10000000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
  // Web Mercator para visualização e publicação em Leaflet
  EPSG_3857: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs',
  // WGS 84
  EPSG_4326: '+proj=longlat +datum=WGS84 +no_defs'
};

// Register definitions in proj4
proj4.defs('EPSG:4674', CRS_DEFS.EPSG_4674);
proj4.defs('EPSG:10857', CRS_DEFS.EPSG_10857);
proj4.defs('EPSG:3857', CRS_DEFS.EPSG_3857);
proj4.defs('EPSG:4326', CRS_DEFS.EPSG_4326);

export interface ReprojectionStats {
  featureCount: number;
  originalCrs: 'EPSG:4674 (SIRGAS 2000 Brasil)';
  targetCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)';
  totalAreaHa: number;
  totalAreaKm2: number;
  sampleOriginalCoordinates: [number, number]; // [lon, lat]
  sampleProjectedCoordinates: [number, number];  // [x, y] em metros
  boundingBoxMeters: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
  reprojectedAt: string;
  sourceFileName?: string;
}

export interface ReprojectionResult {
  success: boolean;
  message: string;
  reprojectedGeoJson: any;
  stats: ReprojectionStats;
  qgisProjectReady: boolean;
  geopackageLayerName: string;
}

/**
 * Calculates planar polygon area in square meters using Shoelace formula on projected metric coordinates
 */
export function calculatePlanarPolygonAreaM2(ring: [number, number][]): number {
  let area = 0;
  const n = ring.length;
  if (n < 3) return 0;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += ring[i][0] * ring[j][1];
    area -= ring[j][0] * ring[i][1];
  }
  return Math.abs(area) / 2.0;
}

/**
 * Transforms a single coordinate pair [longitude, latitude] in EPSG:4674 to [x, y] in EPSG:10857 (meters)
 */
export function transform4674To10857(coord: [number, number]): [number, number] {
  const result = proj4('EPSG:4674', 'EPSG:10857', [coord[0], coord[1]]);
  return [Number(result[0].toFixed(3)), Number(result[1].toFixed(3))];
}

/**
 * Transforms a coordinate pair [x, y] in EPSG:10857 back to [lon, lat] in EPSG:4674
 */
export function transform10857To4674(coord: [number, number]): [number, number] {
  const result = proj4('EPSG:10857', 'EPSG:4674', [coord[0], coord[1]]);
  return [Number(result[0].toFixed(6)), Number(result[1].toFixed(6))];
}

/**
 * Recursively reprojects coordinates in GeoJSON geometry from EPSG:4674 to EPSG:10857
 */
function reprojectCoordsNode(coords: any): any {
  if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
    return transform4674To10857([coords[0], coords[1]]);
  }
  return coords.map((child: any) => reprojectCoordsNode(child));
}

export class ReprojectionService {
  /**
   * Receives a raw vector dataset in EPSG:4674 (SIRGAS 2000 Brasil)
   * and executes the official IBGE reprojection to EPSG:10857 (SIRGAS 2000 / Brasil Albers).
   *
   * This is the mandatory stage that precedes:
   * 1. The calculation QGIS project (`calculos_geojornalismo.qgz`)
   * 2. The calculation GeoPackage (`dados_calculos.gpkg`)
   * 3. The calculation spatial databases
   */
  public executeReprojectionTo10857(
    rawGeoJson: any,
    layerName = 'camada_vetorial_reprojetada',
    sourceFileName?: string
  ): ReprojectionResult {
    const cloned = JSON.parse(JSON.stringify(rawGeoJson));
    const features = cloned.features || [];

    let totalAreaM2 = 0;
    let sampleOrig: [number, number] = [0, 0];
    let sampleProj: [number, number] = [0, 0];
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    const reprojectedFeatures = features.map((feature: any, index: number) => {
      const origGeom = feature.geometry;
      if (!origGeom || !origGeom.coordinates) return feature;

      // Extract sample from first feature
      if (index === 0) {
        const getFirstCoord = (c: any): [number, number] => {
          if (typeof c[0] === 'number') return [c[0], c[1]];
          return getFirstCoord(c[0]);
        };
        sampleOrig = getFirstCoord(origGeom.coordinates);
        sampleProj = transform4674To10857(sampleOrig);
      }

      const reprojectedGeometry = {
        type: origGeom.type,
        coordinates: reprojectCoordsNode(origGeom.coordinates)
      };

      // Calculate area for polygons
      let featAreaM2 = 0;
      if (reprojectedGeometry.type === 'Polygon') {
        const outerRing = reprojectedGeometry.coordinates[0];
        featAreaM2 = calculatePlanarPolygonAreaM2(outerRing);
        // subtract interior rings / holes if any
        for (let r = 1; r < reprojectedGeometry.coordinates.length; r++) {
          featAreaM2 -= calculatePlanarPolygonAreaM2(reprojectedGeometry.coordinates[r]);
        }
      } else if (reprojectedGeometry.type === 'MultiPolygon') {
        for (const poly of reprojectedGeometry.coordinates) {
          let polyArea = calculatePlanarPolygonAreaM2(poly[0]);
          for (let r = 1; r < poly.length; r++) {
            polyArea -= calculatePlanarPolygonAreaM2(poly[r]);
          }
          featAreaM2 += polyArea;
        }
      }

      totalAreaM2 += Math.max(0, featAreaM2);
      const featAreaHa = Number((featAreaM2 / 10000).toFixed(4));

      // Update bounding box
      const updateBbox = (coords: any) => {
        if (typeof coords[0] === 'number') {
          const x = coords[0];
          const y = coords[1];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        } else {
          coords.forEach(updateBbox);
        }
      };
      updateBbox(reprojectedGeometry.coordinates);

      return {
        ...feature,
        geometry: reprojectedGeometry,
        properties: {
          ...(feature.properties || {}),
          formato_entrada_custodia: 'Shapefile (.shp, .shx, .dbf, .prj)',
          crs_nativo_origem: 'EPSG:4674 (SIRGAS 2000 Brasil Geográficas)',
          crs_reprojetado_calculo: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
          area_calculada_m2: Number(featAreaM2.toFixed(2)),
          area_calculada_ha: featAreaHa,
          metodologia_calculo: 'Cálculo de Área Planar Albers Equivalente (Luna 2026c)',
          status_reprojecao: 'Concluído com Sucesso — Pronto para Projeto QGIS de Cálculo',
          data_reprojecao: new Date().toISOString()
        }
      };
    });

    const totalAreaHa = Number((totalAreaM2 / 10000).toFixed(4));
    const totalAreaKm2 = Number((totalAreaM2 / 1000000).toFixed(4));

    const reprojectedGeoJson = {
      type: 'FeatureCollection',
      name: `${layerName}_epsg10857`,
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::10857'
        }
      },
      metadata: {
        sistema_origem: 'SIRGAS 2000 Brasil (EPSG:4674) - Shapefile Oficial',
        sistema_calculo: 'SIRGAS 2000 / Brasil Albers (EPSG:10857) - Equivalente Oficial IBGE',
        finalidade: 'Projeto QGIS de Cálculo (calculos_geojornalismo.qgz) e GeoPackage de Cálculo (dados_calculos.gpkg)',
        regra_ouro: 'Tudo relativo a cálculos de áreas DEVE ser realizado em EPSG:10857',
        data_execucao: new Date().toISOString(),
        total_feicoes: reprojectedFeatures.length,
        area_total_ha: totalAreaHa,
        area_total_km2: totalAreaKm2
      },
      features: reprojectedFeatures
    };

    const stats: ReprojectionStats = {
      featureCount: reprojectedFeatures.length,
      originalCrs: 'EPSG:4674 (SIRGAS 2000 Brasil)',
      targetCrs: 'EPSG:10857 (SIRGAS 2000 / Brasil Albers)',
      totalAreaHa,
      totalAreaKm2,
      sampleOriginalCoordinates: sampleOrig,
      sampleProjectedCoordinates: sampleProj,
      boundingBoxMeters: {
        minX: minX === Infinity ? 0 : Number(minX.toFixed(2)),
        minY: minY === Infinity ? 0 : Number(minY.toFixed(2)),
        maxX: maxX === -Infinity ? 0 : Number(maxX.toFixed(2)),
        maxY: maxY === -Infinity ? 0 : Number(maxY.toFixed(2))
      },
      reprojectedAt: new Date().toISOString(),
      sourceFileName
    };

    return {
      success: true,
      message: `Reprojeção vetorial executada com sucesso de EPSG:4674 para EPSG:10857. Total de ${reprojectedFeatures.length} feições convertidas para unidades métricas lineares (área total: ${totalAreaHa.toLocaleString('pt-BR')} ha).`,
      reprojectedGeoJson,
      stats,
      qgisProjectReady: true,
      geopackageLayerName: `${layerName}_albers`
    };
  }

  /**
   * Parses an uploaded Shapefile ZIP package (.zip containing .shp, .shx, .dbf, .prj)
   * into a GeoJSON FeatureCollection
   */
  public async parseShapefileZip(bufferOrFile: ArrayBuffer | File): Promise<any> {
    let arrayBuffer: ArrayBuffer;
    if (bufferOrFile instanceof File) {
      arrayBuffer = await bufferOrFile.arrayBuffer();
    } else {
      arrayBuffer = bufferOrFile;
    }

    try {
      const geojson = await shp(arrayBuffer);
      return geojson;
    } catch (err: any) {
      throw new Error(`Falha ao ler o pacote Shapefile (.zip): ${err.message || 'Arquivo corrompido ou formato inválido'}. Certifique-se de enviar um arquivo .zip contendo .shp, .shx, .dbf e .prj.`);
    }
  }

  /**
   * Triggers download of the reprojected GeoJSON or descriptor in EPSG:10857
   */
  public downloadReprojectedDataset(result: ReprojectionResult, filename?: string): void {
    const defaultName = filename || `dados_calculo_${result.geopackageLayerName}_epsg10857.geojson`;
    const blob = new Blob([JSON.stringify(result.reprojectedGeoJson, null, 2)], {
      type: 'application/geo+json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const reprojectionService = new ReprojectionService();
