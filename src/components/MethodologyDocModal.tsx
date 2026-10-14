import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ShieldCheck,
  Database,
  Layers,
  MapPin,
  Terminal,
  Cpu,
  Download,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Workflow,
  Search,
  FileCheck2,
  Lock,
  Compass,
  FileText,
  Activity,
  CheckCircle2,
  XCircle,
  Crosshair
} from 'lucide-react';

export const MethodologyDocModal: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tutorial' | 'mcp_guide' | 'theory'>('tutorial');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 font-semibold mb-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>MANUAL OPERACIONAL & REFERENCIAL CIENTÍFICO</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Guia Completo para Jornalistas Investigativos
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Protocolo sistematizado para produção de mapas jornalísticos com rigor científico,
              auditoria criptográfica em banco de dados, integração via QGIS MCP e assistência generativa (Luna, 2026c).
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-3 rounded-lg text-xs font-mono shrink-0">
            <Lock className="w-4 h-4 text-slate-500" />
            <div>
              <div className="text-slate-400 uppercase text-[10px]">Administrador & Auditor</div>
              <div className="font-bold text-slate-800">Diógenes Luna · UFCA</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSubTab('tutorial')}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'tutorial'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <Workflow className="w-4 h-4" />
            <span>Passo a Passo: Publicação do Mapa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mcp_guide')}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'mcp_guide'
                ? 'bg-indigo-900 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Guia do QGIS MCP & Acesso aos Dados</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('theory')}
            className={`px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors ${
              activeSubTab === 'theory'
                ? 'bg-emerald-900 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Fundamentos Científicos & Regras</span>
          </button>
        </div>

        {/* SUBTAB 1: TUTORIAL COMPLETO PASSO A PASSO */}
        {activeSubTab === 'tutorial' && (
          <div className="space-y-8 text-slate-800">
            {/* Introdução / Resumo das Funcionalidades */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-600" />
                O que você pode fazer nesta plataforma
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Esta plataforma foi desenhada para eliminar o empirismo e as imprecisões no jornalismo guiado por dados espaciais.
                Ela não é apenas um visualizador, mas uma <strong>estação de trabalho com esteira de auditoria científica</strong>:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    1. Validação Binária Estrita
                  </div>
                  <p className="text-slate-600">
                    64 atividades distribuídas em 6 fases cronológicas. Cada atividade exige validação binária ("Sim" ou "Não"). Erros bloqueiam o avanço imediatamente.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Cpu className="w-4 h-4 text-indigo-600" />
                    2. Automação SIG via QGIS MCP
                  </div>
                  <p className="text-slate-600">
                    Comunicação direta com o software QGIS. O protocolo aciona algoritmos nativos (correção de topologia, reprojeção e interseções) sem intervenção manual propensa a erros.
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                    <Database className="w-4 h-4 text-blue-600" />
                    3. Trilha Imutável & GeoJSON
                  </div>
                  <p className="text-slate-600">
                    Registro forense inviolável com hash SHA-256 no banco de dados e exportação direta dos arquivos GeoJSON higienizados e validados para publicação.
                  </p>
                </div>
              </div>
            </div>

            {/* Roteiro Passo a Passo em 6 Fases */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Percurso de Produção</span>
                  <h3 className="text-lg font-bold text-slate-900">Passo a Passo para a Publicação do Mapa</h3>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                  6 Fases Metodológicas (Luna, 2026c)
                </span>
              </div>

              <div className="space-y-4">
                {/* Passo 1: Conceber */}
                <div className="p-4 bg-white border-l-4 border-l-emerald-600 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-emerald-800">
                      FASE 1 · CONCEBER (Atividades P1.A1 a P1.A6)
                    </span>
                    <span className="text-[11px] font-mono bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">
                      Iniciação & Pauta
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Definição Editorial da Hipótese Territorial
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    O repórter define o recorte geográfico da investigação (ex: supressão de vegetação nativa no perímetro da APA Chapada do Araripe).
                    Estruturam-se os três níveis obrigatórios de visualização (Regional, Local e Detalhe).
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Ação do Jornalista:</strong> Clicar em "INICIAR PRODUÇÃO DO WEBMAP" no Cockpit.</div>
                    <div><strong>Ponto de Checagem:</strong> Validar o checklist preliminar com "✓ Sim" para registrar a agenda e pauta no banco.</div>
                  </div>
                </div>

                {/* Passo 2: Compilar */}
                <div className="p-4 bg-white border-l-4 border-l-blue-600 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-blue-800">
                      FASE 2 · COMPILAR (Atividades P2.A7 a P2.A18)
                    </span>
                    <span className="text-[11px] font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                      Aquisição de Dados Oficiais
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Coleta das Bases Oficiais do Território
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Reunir as três camadas vetoriais fundamentais: Poligonal da APA Chapada do Araripe (ICMBio),
                    Malha Municipal do Cariri (IBGE 2024 - Crato, Barbalha, Santana do Cariri) e Polígonos de Alertas de Desmatamento (MapBiomas/Deter).
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Ação do Jornalista:</strong> Inserir fontes, links de órgãos oficiais e licenças de dados no checklist.</div>
                    <div><strong>Verificação MCP:</strong> O protocolo executa <code>qgis_get_layers</code> para catalogar se as camadas estão no projeto QGIS.</div>
                  </div>
                </div>

                {/* Passo 3: Limpar */}
                <div className="p-4 bg-white border-l-4 border-l-amber-500 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-amber-800">
                      FASE 3 · LIMPAR & REPARAR (Atividades P3.A19 a P3.A30)
                    </span>
                    <span className="text-[11px] font-mono bg-amber-50 text-amber-700 px-2 py-0.5 rounded">
                      Auditoria Topológica & Reprojeção
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Higienização Topológica e Conversão para SIRGAS 2000 Albers
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Identificar auto-interseções de polígonos (kinks), vértices duplicados e nós não fechados. Reprojetar para
                    <strong> SIRGAS 2000 Brasil Albers (EPSG:10857)</strong>, garantindo que o cálculo de área não sofra distorção do Web Mercator.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Ação do Jornalista:</strong> Clicar em "Diagnóstico SIG & Ponto de Checagem".</div>
                    <div><strong>Momento Crítico do MCP:</strong> Se houver erro, o sistema abre o <strong>Verificador de Geometria do QGIS</strong> e centraliza no vértice defeituoso. Clique em "Reparar Geometria via MCP" para acionar <code>native:fixgeometries</code>.</div>
                  </div>
                </div>

                {/* Passo 4: Contextualizar */}
                <div className="p-4 bg-white border-l-4 border-l-purple-600 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-purple-800">
                      FASE 4 · CONTEXTUALIZAR (Atividades P4.A31 a P4.A42)
                    </span>
                    <span className="text-[11px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                      Interseção & Relações Espaciais
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Cruzamento Espacial entre Alertas e Territórios
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Executar a operação <code>native:intersection</code> entre os polígonos de alerta e a poligonal da APA Araripe.
                    Cruzar com as zonas municipais para quantificar a incidência exata em cada jurisdição.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Uso da IA Gemini:</strong> Usar a aba "IAG Gemini" para fundamentar a narrativa com o Google Maps Grounding oficial da região do Cariri.</div>
                    <div><strong>Ponto de Checagem:</strong> Validar se 100% dos polígonos de alerta têm atributos espaciais consistentes.</div>
                  </div>
                </div>

                {/* Passo 5: Analisar */}
                <div className="p-4 bg-white border-l-4 border-l-indigo-600 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-indigo-800">
                      FASE 5 · ANALISAR (Atividades P5.A43 a P5.A54)
                    </span>
                    <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      Cálculo Preciso de Área (ha)
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Quantificação Geodésica e Auditoria Matemática
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Calcular a área total afetada em hectares utilizando projeção equivalente (Albers).
                    Auditar se os números batem com a tabela de atributos e emitir o fechamento das estatísticas da reportagem.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Resultado Chave:</strong> 48,72 hectares de alertas confirmados dentro da poligonal da APA Chapada do Araripe.</div>
                    <div><strong>Verificação:</strong> O Auditor de Precisão confirma o rastro do erro sem nenhuma pendência.</div>
                  </div>
                </div>

                {/* Passo 6: Comunicar */}
                <div className="p-4 bg-white border-l-4 border-l-emerald-700 border border-slate-200 rounded-r shadow-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono font-bold text-emerald-900">
                      FASE 6 · COMUNICAR & PUBLICAR (Atividades P6.A55 a P6.A64)
                    </span>
                    <span className="text-[11px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Cartografia Web & Exportação
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">
                    Publicação do Webmap e Exportação de GeoJSON & Laudo
                  </h4>
                  <p className="text-xs text-slate-600 mb-3">
                    Configurar a cartografia interativa em EPSG:3857 (Web Mercator) com visualização em 3 níveis no mapa Leaflet.
                    Exportar os dados auditados e o laudo de verificação científica.
                  </p>
                  <div className="bg-slate-50 p-2.5 rounded text-xs font-mono text-slate-700 space-y-1">
                    <div><strong>Como Exportar o GeoJSON:</strong> Acesse a aba <strong>Banco de Dados & Auditoria</strong> e clique em <strong>"Exportar GeoJSON das Camadas Validadas"</strong>.</div>
                    <div><strong>Como Emitir o Laudo:</strong> Clique em <strong>"Exportar Laudo"</strong> para gerar o dossiê formal de auditoria assinado por Diógenes Luna.</div>
                    <div><strong>Visualização Final:</strong> O mapa web interativo está pronto para incorporar na matéria jornalística.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 2: GUIA TÉCNICO DO MCP QGIS */}
        {activeSubTab === 'mcp_guide' && (
          <div className="space-y-8 text-slate-800">
            {/* O que é o MCP */}
            <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-5">
              <div className="flex items-center gap-2 text-indigo-900 font-bold mb-2">
                <Cpu className="w-5 h-5 text-indigo-600" />
                <h3>O que é o Model Context Protocol (MCP) no QGIS?</h3>
              </div>
              <p className="text-xs text-indigo-950 leading-relaxed mb-3">
                O <strong>Model Context Protocol (MCP)</strong> é um padrão aberto que estabelece uma ponte de comunicação
                segura e bidirecional entre o aplicativo web (e os agentes de inteligência artificial) e o software SIG desktop <strong>QGIS</strong>.
                Em vez de o repórter alternar manualmente entre telas ou rodar scripts avulsos no console Python,
                a plataforma interage com o projeto QGIS por meio de chamadas estruturadas de ferramentas (JSON-RPC na porta padrão <code>9559</code>).
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded border border-indigo-150">
                  <span className="font-bold text-indigo-900 block mb-1">Conexão Automática</span>
                  <p className="text-slate-600">
                    O sistema detecta se o processo <code>qgis</code> está rodando no computador. Caso não esteja, ativa o emulador de ponte para manter o pipeline 100% funcional.
                  </p>
                </div>
                <div className="bg-white p-3 rounded border border-indigo-150">
                  <span className="font-bold text-indigo-900 block mb-1">Rastreabilidade Inviolável</span>
                  <p className="text-slate-600">
                    Cada comando enviado ao QGIS e cada resposta retornada é gravada no <strong>Flight Recorder (Caixa-Preta)</strong> com timestamp, agente e payload.
                  </p>
                </div>
              </div>
            </div>

            {/* Momentos em que o MCP é ativado */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-bold text-slate-900">Em que momentos o MCP QGIS é ativado?</h3>
              </div>
              <p className="text-xs text-slate-600 mb-4">
                O MCP opera de forma reativa e automatizada em pontos nevrálgicos do fluxo:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-white border border-slate-200 rounded flex gap-3 items-start">
                  <div className="w-6 h-6 rounded bg-indigo-100 text-indigo-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Na Inicialização do Protocolo / Verificação de Ambiente</h4>
                    <p className="text-slate-600 mt-0.5">
                      Ao carregar a aplicação ou clicar em "Verificar QGIS", a rota <code>/api/qgis/check</code> e <code>/api/qgis/mcp/connect</code> verifica
                      o processo local, obtém a versão (ex: QGIS 3.34 LTR) e estabelece a sessão MCP.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded flex gap-3 items-start">
                  <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Ao Executar o "Diagnóstico SIG & Ponto de Checagem"</h4>
                    <p className="text-slate-600 mt-0.5">
                      Presente em cada card de atividade, o botão dispara <code>qgis_check_topology</code> via MCP para auditar em tempo real
                      se a camada ativa possui auto-interseções, vértices duplicados ou anéis abertos.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded flex gap-3 items-start">
                  <div className="w-6 h-6 rounded bg-red-100 text-red-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Detecção de Erro de Validação ou Paralisação (Auto-Focus)</h4>
                    <p className="text-slate-600 mt-0.5">
                      Quando o repórter clica em "✕ Não" ou uma geometria inválida é identificada, o hook <code>useQgisGeometryErrorFocus</code> dispara
                      automaticamente o comando <code>qgis_open_geometry_checker</code>. O QGIS abre a janela do "Verificador de Validade de Geometria" e centraliza o cursor exatamente nas coordenadas do vértice corrompido (ex: <code>[-39.412, -7.234]</code>).
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded flex gap-3 items-start">
                  <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Execução de Ação Corretiva Automatizada</h4>
                    <p className="text-slate-600 mt-0.5">
                      No modal de erro ou painel de orquestração, o botão "Reparar Geometria via MCP" chama o algoritmo <code>native:fixgeometries</code> do QGIS.
                      A contagem de erros retorna a zero e gera a evidência técnica gravada no banco.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-white border border-slate-200 rounded flex gap-3 items-start">
                  <div className="w-6 h-6 rounded bg-purple-100 text-purple-800 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    5
                  </div>
                  <div className="text-xs">
                    <h4 className="font-bold text-slate-900">Reprojeção e Interseção Espacial de Alta Precisão</h4>
                    <p className="text-slate-600 mt-0.5">
                      Na Fase 3 e Fase 4, aciona as ferramentas <code>qgis_reproject_albers</code> (SIRGAS 2000 Brasil Albers) e <code>qgis_calculate_intersection_ha</code>
                      para calcular a área exata em hectares sobreposta à Unidade de Conservação.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Como o MCP acessa os dados do projeto QGIS */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Como o MCP acessa os dados do projeto QGIS?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                O acesso aos dados do QGIS é realizado por meio de uma interface estrita com princípios de integridade:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" />
                    Árvore de Camadas e Metadados
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Via <code>qgis_get_layers</code>, o MCP lê <code>QgsProject.instance().mapLayers()</code>, extraindo:
                    nomes das camadas, tipo primitivo (Polygon, MultiPolygon), número de feições, sistema de referência espacial (CRS) e extensão delimitadora (Bounding Box).
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Crosshair className="w-4 h-4 text-red-600" />
                    Localização Espacial dos Vértices
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    Em feições com erro topológico, o MCP lê a geometria WKT/WKB, identifica o nó defeituoso e envia as coordenadas geográficas <code>[longitude, latitude]</code> para o frontend, permitindo que a aplicação plote o alerta e instrua o SIG a focar naquele ponto.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Princípio da Não-Destrutividade
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    O MCP nunca sobrescreve os dados brutos originais do jornalista. Todas as operações de correção geram novas camadas derivadas (ex: <code>Alertas_Desmatamento_Araripe_Corrigido.gpkg</code>), preservando o rastro forense do dado antes e depois da intervenção.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-purple-600" />
                    Catálogo de Ferramentas Ativas
                  </h4>
                  <ul className="text-slate-600 font-mono text-[11px] space-y-1">
                    <li>• <code>qgis_get_layers</code></li>
                    <li>• <code>qgis_check_topology</code></li>
                    <li>• <code>qgis_fix_geometries</code></li>
                    <li>• <code>qgis_reproject_albers</code></li>
                    <li>• <code>qgis_calculate_intersection_ha</code></li>
                    <li>• <code>qgis_open_geometry_checker</code></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 3: REFERENCIAL TEÓRICO E METODOLÓGICO */}
        {activeSubTab === 'theory' && (
          <div className="space-y-6 text-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded border border-slate-200">
                <div className="font-mono text-xs font-bold text-slate-700 uppercase mb-1">
                  Luna (2026c)
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  "O Rastro do Erro"
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  "Um jornalismo baseado em método científico deixa um rastro por onde o erro pode ser
                  detectado e a verdade verificada." A transparência metodológica é o próprio produto.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200">
                <div className="font-mono text-xs font-bold text-slate-700 uppercase mb-1">
                  Luna (2026c)
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  6 Etapas Sistematizadas
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  O pipeline progride rigidamente por: <strong>1. Conceber</strong>, <strong>2. Compilar</strong>,{' '}
                  <strong>3. Limpar</strong>, <strong>4. Contextualizar</strong>, <strong>5. Analisar</strong> e{' '}
                  <strong>6. Comunicar</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded border border-slate-200">
                <div className="font-mono text-xs font-bold text-slate-700 uppercase mb-1">
                  Luna (2026c)
                </div>
                <h4 className="text-sm font-semibold text-slate-900 mb-1">
                  Métrica Binária Estrita
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Avaliação restrita aos valores "Sim" ou "Não" em pontos de checagem ao final de cada
                  atividade crítica. Não há tolerância a erros no avanço de fases.
                </p>
              </div>
            </div>

            {/* Regra de Parada */}
            <div className="p-5 bg-amber-50/70 border border-amber-300 rounded-lg text-xs text-amber-950 space-y-2">
              <h4 className="font-bold font-mono text-sm uppercase text-amber-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                Regra Fundamental: Parada Obrigatória por Erro
              </h4>
              <p className="leading-relaxed">
                Por regra científica, <strong>não há margem para erros</strong>, uma vez que a métrica
                de precisão é um valor binário. Qualquer atividade invalidada paralisa imediatamente o
                fluxo de trabalho até que seja sanada. O fluxo só avança quando não restam evidências de
                imprecisão. O erro e a ação corretiva ficam gravados indelevelmente no banco de dados.
              </p>
            </div>

            {/* 3 Níveis */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">
                Os Três Níveis de Visualização do Território
              </h3>
              <p className="text-xs text-slate-600">
                O experimento testa o cálculo e comparação de geometrias e áreas de polígonos em 3 camadas
                vetoriais sobrepostas:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="font-mono text-[11px] font-bold text-emerald-700 block mb-1">
                    NÍVEL 1: REGIONAL
                  </span>
                  <p className="text-slate-700">
                    Contextualiza o território amplo e a narrativa macro (ex: Unidade de Conservação
                    Federal / APA Chapada do Araripe).
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="font-mono text-[11px] font-bold text-blue-700 block mb-1">
                    NÍVEL 2: LOCAL
                  </span>
                  <p className="text-slate-700">
                    Aproxima ao território do município e sua jurisdição político-administrativa local
                    (Crato, Barbalha, Santana do Cariri).
                  </p>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded">
                  <span className="font-mono text-[11px] font-bold text-amber-700 block mb-1">
                    NÍVEL 3: DETALHE
                  </span>
                  <p className="text-slate-700">
                    Permite a visualização com detalhes da ocorrência específica do objeto analisado
                    (alertas de supressão MapBiomas/Deter, estradas, nascentes).
                  </p>
                </div>
              </div>
            </div>

            {/* Bibliografia */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-500 mb-3">
                Referências Bibliográficas & Técnicas
              </h4>
              <ul className="text-xs text-slate-600 space-y-2 font-mono">
                <li>
                  • <strong>LUNA, D.</strong> (2026c). <em>Fluxo de trabalho e protocolo para produção de mapas jornalísticos com dados espaciais, SIG e agente de Inteligência Artificial Generativa</em>.
                </li>
                <li>
                  • <strong>IBGE</strong> (2024). <em>Especificações Técnicas para a Estruturação de Dados Geoespaciais Vetoriais (ET-EDGV)</em>.
                </li>
                <li>
                  • <strong>GOOGLE DEEPMIND</strong> (2026). <em>Gemini Model Architecture & Journalistic Prompt System for Generative AI (gemini-3.8-flash)</em>.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
