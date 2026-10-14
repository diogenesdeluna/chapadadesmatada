import { AuditRecord, ProjectMetadata } from '../types/workflow';
import {
  CHAPADA_METADATA,
  CHAPADA_RANKING,
  CHAPADA_SERIES,
  APA_POLYGON_GEOJSON,
  MUNICIPIOS_GEOJSON,
  CURATED_ALERTS_GEOJSON,
  SENTINEL2_CLOUDLESS_XYZ,
  SENTINEL2_ATTRIBUTION
} from '../data/chapadaStoryData';

/**
 * Service to generate, preview, and download the publication-ready standalone HTML webmap.
 * Strictly adheres to the geojournalistic architecture of "Chapada Desmatada" (Luna, 2026),
 * featuring Sentinel-2 Cloudless satellite imagery, floating glassmorphism panels,
 * 3-level narrative zoom, MapBiomas before/after satellite imagery, and municipal ranking.
 */

export function generatePublishedWebmapHtml(project: ProjectMetadata, records: AuditRecord[]): string {
  const validatedCount = records.filter((r) => r.evaluation === 'Sim').length;
  const isCertified = validatedCount > 0;
  const publicationDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const payloadJson = JSON.stringify({
    meta: {
      ...CHAPADA_METADATA,
      project_title: project.title || CHAPADA_METADATA.title,
      researcher: project.researcher || 'Diógenes Luna',
      institution: project.institution || 'UFCA / MapeIA',
      publication_date: publicationDate,
      validation_status: isCertified ? `${validatedCount}/64 atividades validadas` : 'Auditado'
    },
    ranking_municipios: CHAPADA_RANKING,
    series_municipios: CHAPADA_SERIES,
    geojson: {
      chapada: APA_POLYGON_GEOJSON,
      municipios: MUNICIPIOS_GEOJSON,
      alertas: CURATED_ALERTS_GEOJSON
    }
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#1f2618">
  <title>${project.title || 'Web Story Chapada do Araripe'} · Webmap Geojornalístico</title>
  <meta name="description" content="Webmap narrativo em três níveis sobre a supressão vegetal na APA Chapada do Araripe (2019-2025). Modelo geojornalístico Luna (2026).">
  
  <!-- Leaflet 1.9.4 CSS -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>
  
  <style>
    :root {
      --apa: #ebb46b;
      --inside: #e7352a;
      --outside: #1976d2;
      --panel-bg: rgba(31, 38, 24, 0.82);
      --panel-border: rgba(255, 255, 255, 0.22);
      --text: #ffffff;
      --accent: #ebb46b;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      overflow: hidden;
      background: #192015;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--text);
    }

    /* Top Certification Bar */
    .top-meta-badge {
      position: absolute;
      top: 14px;
      left: 14px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: rgba(20, 24, 17, 0.88);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
      font-size: 11px;
      font-family: monospace;
    }

    .top-meta-badge .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
    }

    /* Floating UI Stack (Glassmorphism over Sentinel-2) */
    .ui-stack {
      position: absolute;
      z-index: 1000;
      top: 14px;
      right: 14px;
      width: min(420px, calc(100vw - 28px));
      max-height: calc(100vh - 40px);
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      overflow-y: auto;
      padding-right: 2px;
    }

    .ui-stack::-webkit-scrollbar {
      width: 4px;
    }
    .ui-stack::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.25);
      border-radius: 4px;
    }

    .panel {
      overflow: hidden;
      padding: 14px 16px;
      color: #fff;
      background: var(--panel-bg);
      border: 1px solid var(--panel-border);
      border-radius: 12px;
      box-shadow: 0 18px 46px rgba(0,0,0,0.45);
      backdrop-filter: blur(14px) saturate(130%);
      -webkit-backdrop-filter: blur(14px) saturate(130%);
      pointer-events: auto;
      transition: all 0.2s ease;
    }

    .hidden { display: none !important; }

    .level-badge {
      display: inline-block;
      padding: 2px 8px;
      background: rgba(235, 180, 107, 0.2);
      border: 1px solid rgba(235, 180, 107, 0.4);
      border-radius: 4px;
      font-family: monospace;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .level-badge.level-2 {
      background: rgba(59, 130, 246, 0.2);
      border-color: rgba(59, 130, 246, 0.4);
      color: #93c5fd;
    }

    .level-badge.level-3 {
      background: rgba(231, 53, 42, 0.25);
      border-color: rgba(231, 53, 42, 0.4);
      color: #fca5a5;
    }

    .panel-title {
      margin: 0 0 6px;
      font-size: 18px;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.01em;
    }

    .panel-subtitle {
      margin: 0 0 12px;
      font-size: 13px;
      line-height: 1.45;
      color: #fef08a;
      font-style: italic;
    }

    .panel-body {
      color: #f1f5f9;
      font-size: 12.5px;
      line-height: 1.55;
    }

    .panel-body p {
      margin: 0 0 10px;
    }

    .text-highlight {
      font-weight: 700;
      color: #ffffff;
      text-shadow: 0 0 6px rgba(255,255,255,0.25);
    }

    /* Ranking List */
    .ranking-container {
      max-height: 320px;
      overflow-y: auto;
      padding-right: 4px;
      margin-top: 8px;
    }

    .ranking-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.15s ease;
    }

    .ranking-row:hover {
      background: rgba(255, 255, 255, 0.12);
    }

    .rank-num {
      width: 20px;
      font-family: monospace;
      font-weight: 700;
      color: var(--accent);
      text-align: right;
      font-size: 11px;
    }

    .rank-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 500;
    }

    .bar-track {
      width: 80px;
      height: 6px;
      background: rgba(0,0,0,0.4);
      border-radius: 999px;
      overflow: hidden;
    }

    .bar {
      height: 100%;
      background: linear-gradient(90deg, #ebb46b, #e7352a);
      border-radius: 999px;
    }

    .rank-val {
      font-family: monospace;
      font-weight: 700;
      color: #fef08a;
      font-size: 11px;
      width: 70px;
      text-align: right;
    }

    /* Mini Charts in Level 2 */
    .chart-card {
      margin: 10px 0;
      padding: 10px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
    }

    .chart-title {
      font-family: monospace;
      font-size: 10.5px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #cbd5e1;
      margin-bottom: 6px;
    }

    .time-row {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      margin: 4px 0;
    }

    .time-row span {
      width: 32px;
      font-family: monospace;
      color: #94a3b8;
    }

    .mini-track {
      flex: 1;
      height: 8px;
      background: rgba(0,0,0,0.4);
      border-radius: 4px;
      overflow: hidden;
    }

    .mini-bar {
      height: 100%;
      background: #e7352a;
      border-radius: 4px;
    }

    .mini-bar.current {
      background: #ebb46b;
    }

    .time-row b {
      font-family: monospace;
      font-size: 11px;
      width: 65px;
      text-align: right;
    }

    /* Level 3 Alert Details & Photos */
    .kpi-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin: 10px 0;
    }

    .kpi-box {
      background: rgba(0,0,0,0.3);
      padding: 8px;
      border-radius: 6px;
      border: 1px solid rgba(255,255,255,0.08);
      font-size: 11px;
    }

    .kpi-box span {
      display: block;
      font-family: monospace;
      color: #94a3b8;
      text-transform: uppercase;
      font-size: 9.5px;
      margin-bottom: 2px;
    }

    .kpi-box b {
      font-family: monospace;
      color: #fef08a;
      font-size: 13px;
    }

    .alert-images {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 10px 0;
    }

    .alert-figure {
      background: rgba(0,0,0,0.4);
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.15);
    }

    .alert-figure figcaption {
      padding: 4px 6px;
      background: rgba(0,0,0,0.6);
      font-family: monospace;
      font-size: 9.5px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      display: flex;
      justify-content: space-between;
    }

    .alert-figure img {
      width: 100%;
      height: 100px;
      object-fit: cover;
      display: block;
    }

    .btn-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .btn {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 11.5px;
      font-family: monospace;
      font-weight: 700;
      border: none;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s ease;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn.primary {
      background: #e7352a;
      color: #fff;
    }
    .btn.primary:hover { background: #cf271d; }

    .btn.secondary {
      background: rgba(255,255,255,0.15);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.25);
    }
    .btn.secondary:hover { background: rgba(255,255,255,0.25); }

    /* Source Footer */
    .source-footer {
      padding: 8px 12px;
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      background: rgba(20,24,17,0.85);
      color: rgba(255,255,255,0.85);
      font-size: 10.5px;
      line-height: 1.4;
      pointer-events: auto;
    }

    /* Legend (Bottom Left) */
    .legend {
      position: absolute;
      left: 14px;
      bottom: 14px;
      z-index: 1000;
      padding: 10px 14px;
      border: 1px solid rgba(255,255,255,0.24);
      border-radius: 8px;
      background: rgba(20,24,17,0.88);
      color: #fff;
      font-size: 11.5px;
      backdrop-filter: blur(10px);
      box-shadow: 0 4px 14px rgba(0,0,0,0.4);
    }

    .legend-title {
      font-family: monospace;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: var(--accent);
      margin-bottom: 6px;
    }

    .legend-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 4px 0;
    }

    .sw { width: 24px; height: 10px; display: inline-block; }
    .sw.apa { height: 0; border-top: 3px solid var(--apa); }
    .sw.dash { height: 0; border-top: 2px dashed #fff; }
    .sw.inside { background: rgba(231,53,42,0.65); border: 1.5px solid #e7352a; }
    .sw.outside { background: rgba(25,118,210,0.6); border: 1.5px solid #1976d2; }

    /* Mobile toggle */
    .mobile-toggle {
      position: absolute;
      top: 14px;
      right: 14px;
      z-index: 1010;
      display: none;
      padding: 6px 12px;
      background: rgba(20,24,17,0.9);
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      color: #fff;
      font-size: 11px;
      font-family: monospace;
      cursor: pointer;
    }

    @media (max-width: 640px) {
      .mobile-toggle { display: block; }
      .ui-stack.collapsed { display: none; }
      .ui-stack { top: 50px; }
      .legend { display: none; }
    }
  </style>
</head>
<body>
  <!-- Map Canvas -->
  <div id="map"></div>

  <!-- Certification / Project Badge -->
  <div class="top-meta-badge">
    <div class="status-dot"></div>
    <span><strong>${project.title || 'MapeIA · Chapada Desmatada'}</strong> · Modelo Luna (2026)</span>
  </div>

  <button id="mobileToggle" class="mobile-toggle">Ocultar Painéis</button>

  <!-- Floating UI Narrative Stack -->
  <div class="ui-stack" id="uiStack">
    <!-- Panel 1: Editorial Opening (Level 1) -->
    <section id="editorialPanel" class="panel">
      <div class="level-badge">Nível 1 · Abertura Regional</div>
      <h1 class="panel-title">Web Story Chapada do Araripe: Pressão Antrópica na APA</h1>
      <div class="panel-subtitle">Monitoramento de supressão vegetal na Unidade de Conservação Federal (2019–2025)</div>
      <div class="panel-body">
        <p>A <span class="text-highlight">Área de Preservação Ambiental Chapada do Araripe</span> abrange 18 municípios nos estados do Ceará, Pernambuco e Piauí.</p>
        <p>Dados do <span class="text-highlight">MapBiomas Alerta</span> auditados no SIG apontam <span class="text-highlight">Araripe</span>, <span class="text-highlight">Santana do Cariri</span> e <span class="text-highlight">Salitre</span> na liderança das maiores extensões de supressão vegetal nativa na porção coincidente com a Unidade de Conservação.</p>
        <p style="font-size: 11px; color: #cbd5e1;">💡 <em>Interatividade:</em> Clique em um município no mapa ou na lista para inspecionar a série histórica anual e os alertas individuais.</p>
      </div>
    </section>

    <!-- Panel 2: Municipal Ranking (Level 1) -->
    <section id="rankingPanel" class="panel">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2 class="panel-title" style="font-size: 14px;">Ranking do Desmatamento</h2>
        <span style="font-family: monospace; font-size: 10px; color: #cbd5e1;">18 municípios</span>
      </div>
      <div class="panel-subtitle" style="font-size: 11px; margin-bottom: 6px;">Área acumulada na interseção com a APA, 2019–2025</div>
      <div class="ranking-container" id="rankingList"></div>
    </section>

    <!-- Panel 3: Dynamic Detail Panel (Level 2 & Level 3) -->
    <section id="detailPanel" class="panel hidden"></section>

    <!-- Source Footer -->
    <footer class="source-footer">
      Fontes: <strong>MapBiomas Alerta</strong>, <strong>IBGE</strong> e <strong>ICMBio</strong>.<br>
      Raster: <strong>Sentinel-2 cloudless (2025 by EOX)</strong>.<br>
      Projeto QGIS: <code style="color: #fef08a;">projetoDesignChapadaAgosto.qgz</code>.
    </footer>
  </div>

  <!-- Cartographic Legend -->
  <div class="legend">
    <div class="legend-title">Convenções Cartográficas</div>
    <div class="legend-row"><span class="sw apa"></span><span>APA Chapada do Araripe</span></div>
    <div class="legend-row"><span class="sw dash"></span><span>18 Municípios Selecionáveis</span></div>
    <div class="legend-row"><span class="sw inside"></span><span>Alertas com Interseção na APA</span></div>
    <div class="legend-row"><span class="sw outside"></span><span>Alertas fora da APA</span></div>
  </div>

  <!-- Leaflet 1.9.4 Script -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <!-- Embedded Authentic Data Payload -->
  <script>
    window.CHAPADA_PAYLOAD = ${payloadJson};
  </script>

  <!-- Application Logic -->
  <script>
    (function() {
      const P = window.CHAPADA_PAYLOAD;
      let map;
      let layers = {};
      let state = {
        level: 1,
        municipio: null,
        alert: null
      };

      const INITIAL_VIEW = {
        center: [-7.35, -39.65],
        zoom: 9
      };

      // Formatter
      function fmt(val, dec = 1) {
        return Number(val || 0).toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      }

      function initMap() {
        map = L.map('map', {
          center: INITIAL_VIEW.center,
          zoom: INITIAL_VIEW.zoom,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // 1. Sentinel-2 Cloudless 2025 by EOX WMTS/XYZ Tile Layer
        const sentinelLayer = L.tileLayer('${SENTINEL2_CLOUDLESS_XYZ}', {
          attribution: '${SENTINEL2_ATTRIBUTION.replace(/"/g, '\\"')}',
          maxZoom: 18
        }).addTo(map);

        // 2. APA Boundary Polygon
        layers.chapada = L.geoJSON(P.geojson.chapada, {
          style: {
            color: '#ebb46b',
            weight: 2.5,
            opacity: 0.95,
            fillColor: '#ebb46b',
            fillOpacity: 0.08
          },
          interactive: false
        }).addTo(map);

        // 3. 18 Municipalities Layer
        layers.municipios = L.geoJSON(P.geojson.municipios, {
          style: function(feat) {
            return {
              color: 'rgba(255,255,255,0.75)',
              weight: 1.2,
              dashArray: '5, 5',
              fillColor: '#000',
              fillOpacity: 0.03
            };
          },
          onEachFeature: function(feat, layer) {
            const munName = feat.properties.NM_MUN;
            layer.bindTooltip('<b>' + munName + '</b><br><span style=\"color:#94a3b8\">Clique para inspecionar</span>', { sticky: true });
            layer.on({
              click: function() {
                level2(munName);
              },
              mouseover: function(e) {
                if (state.level === 1) {
                  layer.setStyle({ weight: 2.5, color: '#fef08a', fillOpacity: 0.15 });
                }
              },
              mouseout: function(e) {
                if (state.level === 1) {
                  layers.municipios.resetStyle(layer);
                }
              }
            });
          }
        }).addTo(map);

        // 4. Alerts Layer
        layers.alertas = L.geoJSON(P.geojson.alertas, {
          style: function(feat) {
            const isInside = Boolean(feat.properties.INSIDE_APA);
            return {
              color: isInside ? '#e7352a' : '#1976d2',
              weight: 1.5,
              fillColor: isInside ? '#e7352a' : '#1976d2',
              fillOpacity: isInside ? 0.6 : 0.45
            };
          },
          onEachFeature: function(feat, layer) {
            const props = feat.properties;
            const ha = props.AREA_NA_APA_HA || props.AREAHA;
            layer.bindTooltip('<b>Alerta #' + props.CODEALERTA + '</b> (' + props.MUNICIPIO + ')<br><span style=\"color:#ef4444; font-weight:bold;\">' + fmt(ha) + ' ha na APA</span> · Ano ' + props.ANODETEC, { sticky: true });
            layer.on('click', function() {
              level3(feat);
            });
          }
        }).addTo(map);

        // Initially hide alerts until user zooms or enters level 2
        map.removeLayer(layers.alertas);

        renderRanking();
      }

      function renderRanking() {
        const rows = P.ranking_municipios || [];
        const max = Math.max(1, ...rows.map(r => Number(r.total_area_ha || 0)));
        const container = document.getElementById('rankingList');
        
        container.innerHTML = rows.map((row, idx) => {
          const pct = Math.max(2, (Number(row.total_area_ha || 0) / max) * 100);
          return '<div class=\"ranking-row\" onclick=\"window.appLevel2(\\'' + row.municipio + '\\')\">' +
            '<span class=\"rank-num\">' + (idx + 1) + '.</span>' +
            '<span class=\"rank-name\">' + row.municipio + '</span>' +
            '<div class=\"bar-track\"><div class=\"bar\" style=\"width:' + pct + '%\"></div></div>' +
            '<span class=\"rank-val\">' + fmt(row.total_area_ha) + ' ha</span>' +
            '</div>';
        }).join('');
      }

      function level1() {
        state.level = 1;
        state.municipio = null;
        state.alert = null;

        document.getElementById('editorialPanel').classList.remove('hidden');
        document.getElementById('rankingPanel').classList.remove('hidden');
        document.getElementById('detailPanel').classList.add('hidden');

        if (map.hasLayer(layers.alertas)) {
          map.removeLayer(layers.alertas);
        }

        layers.municipios.eachLayer(function(l) {
          layers.municipios.resetStyle(l);
        });

        map.flyTo(INITIAL_VIEW.center, INITIAL_VIEW.zoom, { duration: 0.8 });
      }

      function level2(munName) {
        state.level = 2;
        state.municipio = munName;
        state.alert = null;

        document.getElementById('editorialPanel').classList.add('hidden');
        document.getElementById('rankingPanel').classList.add('hidden');
        const detail = document.getElementById('detailPanel');
        detail.classList.remove('hidden');

        if (!map.hasLayer(layers.alertas)) {
          map.addLayer(layers.alertas);
        }

        // Highlight selected municipality and zoom to it
        let targetLayer;
        layers.municipios.eachLayer(function(l) {
          if (l.feature.properties.NM_MUN === munName) {
            targetLayer = l;
            l.setStyle({ color: '#fff', weight: 3, fillColor: '#ebb46b', fillOpacity: 0.25 });
          } else {
            layers.municipios.resetStyle(l);
          }
        });

        if (targetLayer) {
          map.flyToBounds(targetLayer.getBounds(), { padding: [40, 40], maxZoom: 13, duration: 0.8 });
        }

        // Render level 2 statistics
        const rankItem = (P.ranking_municipios || []).find(r => r.municipio === munName) || {};
        const seriesData = (P.series_municipios[munName] && P.series_municipios[munName].years) || [];
        const maxSeries = Math.max(1, ...seriesData.map(y => y.area_ha || 0));

        let html = '<div class=\"level-badge level-2\">Nível 2 · Município Selecionado</div>' +
          '<div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;\">' +
          '<h2 class=\"panel-title\" style=\"margin:0;\">' + munName + '</h2>' +
          '<button class=\"btn secondary\" onclick=\"window.appLevel1()\" style=\"padding:4px 10px; font-size:11px;\">← Voltar</button>' +
          '</div>' +
          '<div class=\"panel-subtitle\">' + munName + ' ocupa a ' + (rankItem.rank || '—') + 'ª posição no ranking regional.</div>' +
          '<div class=\"panel-body\">' +
          '<p>Desmatamento acumulado (2019–2025): <strong style=\"color:#fef08a\">' + fmt(rankItem.total_area_ha) + ' hectares</strong> em <strong>' + (rankItem.total_alertas || '—') + ' alertas</strong>.</p>' +
          '</div>';

        // Time series chart
        if (seriesData.length > 0) {
          html += '<div class=\"chart-card\">' +
            '<div class=\"chart-title\">Série Temporal Anual (Área na APA)</div>' +
            seriesData.map(y => {
              const pct = Math.max(2, (y.area_ha / maxSeries) * 100);
              return '<div class=\"time-row\">' +
                '<span>' + y.ano + '</span>' +
                '<div class=\"mini-track\"><div class=\"mini-bar ' + (y.ano === 2025 ? 'current' : '') + '\" style=\"width:' + pct + '%\"></div></div>' +
                '<b>' + fmt(y.area_ha) + ' ha</b>' +
                '</div>';
            }).join('') +
            '</div>';
        }

        html += '<p style=\"font-size:11px; color:#cbd5e1; margin-top:8px;\">💡 Clique em qualquer polígono de alerta rubro para abrir o laudo com fotos de satélite antes/depois.</p>';

        detail.innerHTML = html;
      }

      function level3(feat) {
        state.level = 3;
        const props = feat.properties;
        const code = props.CODEALERTA;
        state.alert = code;

        const detail = document.getElementById('detailPanel');
        detail.classList.remove('hidden');

        const insideHa = props.AREA_NA_APA_HA || props.AREAHA;
        const beforeImg = 'https://image.alerta.mapbiomas.org/image/alert/' + code + '/before_deforestation.png';
        const afterImg = 'https://image.alerta.mapbiomas.org/image/alert/' + code + '/after_deforestation.png';
        const mapbiomasUrl = 'https://plataforma.alerta.mapbiomas.org/alerta/' + code;

        let html = '<div class=\"level-badge level-3\">Nível 3 · Alerta MapBiomas</div>' +
          '<div style=\"display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;\">' +
          '<h2 class=\"panel-title\" style=\"margin:0;\">Alerta #' + code + '</h2>' +
          '<button class=\"btn secondary\" onclick=\"window.appLevel2(\\'' + props.MUNICIPIO + '\\')\" style=\"padding:4px 10px; font-size:11px;\">← ' + props.MUNICIPIO + '</button>' +
          '</div>' +
          '<div class=\"panel-subtitle\">' + props.MUNICIPIO + ' · ' + fmt(insideHa) + ' ha na APA</div>' +
          '<div class=\"kpi-grid\">' +
          '<div class=\"kpi-box\"><span>Área na APA</span><b>' + fmt(insideHa) + ' ha</b></div>' +
          '<div class=\"kpi-box\"><span>Ano Detecção</span><b>' + props.ANODETEC + '</b></div>' +
          '<div class=\"kpi-box\"><span>Data Detecção</span><b>' + (props.DATADETEC || '—') + '</b></div>' +
          '<div class=\"kpi-box\"><span>Fonte</span><b>' + (props.FONTE ? props.FONTE.replace(/[{}]/g, '') : 'GLAD') + '</b></div>' +
          '</div>' +
          '<div class=\"alert-images\">' +
          '<div class=\"alert-figure\">' +
          '<figcaption><b>Antes</b><span>Satélite</span></figcaption>' +
          '<img src=\"' + beforeImg + '\" alt=\"Antes ' + code + '\" onerror=\"this.style.display=\\'none\\'\"/>' +
          '</div>' +
          '<div class=\"alert-figure\">' +
          '<figcaption><b>Depois</b><span>Satélite</span></figcaption>' +
          '<img src=\"' + afterImg + '\" alt=\"Depois ' + code + '\" onerror=\"this.style.display=\\'none\\'\"/>' +
          '</div>' +
          '</div>' +
          '<div class=\"btn-row\">' +
          '<a href=\"' + mapbiomasUrl + '\" target=\"_blank\" class=\"btn primary\">Abrir Laudo MapBiomas ↗</a>' +
          '<button class=\"btn secondary\" onclick=\"window.appLevel1()\">Visão Geral</button>' +
          '</div>';

        detail.innerHTML = html;

        // Zoom to alert geometry
        const tempLayer = L.geoJSON(feat);
        map.flyToBounds(tempLayer.getBounds(), { padding: [50, 50], maxZoom: 15, duration: 0.8 });
      }

      // Expose navigation to global window for HTML inline clicks
      window.appLevel1 = level1;
      window.appLevel2 = level2;
      window.appLevel3 = level3;

      // Mobile toggle listener
      document.getElementById('mobileToggle').addEventListener('click', function() {
        const stack = document.getElementById('uiStack');
        stack.classList.toggle('collapsed');
        this.textContent = stack.classList.contains('collapsed') ? 'Exibir Painéis' : 'Ocultar Painéis';
      });

      // Start map when DOM ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMap);
      } else {
        initMap();
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Initiates the download of the standalone published HTML webmap file in the browser
 */
export function downloadPublishedWebmapHtml(
  project: ProjectMetadata,
  records: AuditRecord[],
  filename?: string
): string {
  const htmlContent = generatePublishedWebmapHtml(project, records);
  const targetFilename =
    filename ||
    `webmap_chapada_desmatada_${project.id || 'export'}_${Date.now()}.html`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = targetFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return targetFilename;
}

/**
 * Generates an iframe embed code snippet for publication in editorial CMSs
 */
export function getEmbedIframeSnippet(project: ProjectMetadata, publishedUrl?: string): string {
  const src = publishedUrl || '/api/webmap/published';
  return `<iframe
  src="${src}"
  title="${project.title || 'Chapada Desmatada'} - Webmap Narrativo"
  width="100%"
  height="700"
  frameborder="0"
  style="border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; overflow: hidden; background: #192015;"
  allowfullscreen
  loading="lazy"
></iframe>`;
}
