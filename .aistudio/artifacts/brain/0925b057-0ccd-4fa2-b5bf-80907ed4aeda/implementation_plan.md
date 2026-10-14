# Plano de Implementação: Arquitetura Geojornalística Chapada Desmatada no MapeIA

Integração integral do modelo do webmap interativo [Chapada Desmatada](https://jornalistadiogenesluna.github.io/chapadadesmatada/) (Luna, 2026) na plataforma **MapeIA**, tanto no **visualizador interativo operacional interno** quanto no **motor de publicação e exportação standalone de webmaps**.

---

## 1. Visão Geral da Arquitetura e Decisões de Design

Com base nas preferências do usuário:
1. **Âmbito de Aplicação Duplo**: O modelo da Chapada Desmatada será o padrão para o **Visualizador Interativo interno** (substituindo visualizações genéricas por narrativa em camadas reais) e para o **Publicador / Exportador Webmap HTML5** (geração de webmaps autônomos prontos para hospedagem com Leaflet/OpenLayers e UI flutuante).
2. **Basemap Satelital Sentinel-2 (EOX Cloudless 2025)**: Utilização dos tiles WMTS/XYZ de alta resolução Sentinel-2 Cloudless da EOX (`https://tiles.maps.eox.at/wmts` e tiles XYZ equivalentes com fallback Esri World Imagery), proporcionando o mesmo contexto visual do modelo de referência.
3. **Dados Cartográficos Reais da Chapada do Araripe**: Integração da base georreferenciada completa extraída do projeto cartográfico:
   - Limite territorial e contextual dos estados (Ceará, Pernambuco, Piauí);
   - Polígono oficial da APA Chapada do Araripe (ICMBio/MMA);
   - Malha dos 18 municípios que compõem o território da APA;
   - Camadas de alertas de supressão vegetal MapBiomas (alertas internos à APA e alertas na zona circundante/fora da APA);
   - Séries temporais (2019–2025), métricas de área (ha / km²) e rankings municipais.
4. **Narrativa em Três Níveis de Interatividade (Story Levels)**:
   - **Nível 1 (Abertura Regional da APA)**: Enquadramento macro, painel editorial introdutório com termos em destaque, ranking dos municípios com barras proporcionais de desmatamento acumulado e totais.
   - **Nível 2 (Município Selecionado)**: Acionado por clique no polígono ou seleção no ranking; zoom focado no município, exibição da série histórica anual de alertas (2019–2025), vetores de pressão e densidade de alertas.
   - **Nível 3 (Alerta Individual MapBiomas)**: Acionado por clique em qualquer polígono de alerta; enquadramento de precisão, exibição do código oficial, área em hectares, ano, fotos de satélite comparativas antes/depois da plataforma MapBiomas (`before_deforestation.png` e `after_deforestation.png`), dados de CAR (se existentes) e link direto para a plataforma oficial.
5. **Painéis Flutuantes Translúcidos com Backdrop Blur**:
   - Painel Editorial com títulos jornalísticos e destaques de texto;
   - Painel de Ranking Municipal interativo com animação de barras e seleção rápida;
   - Painel de Detalhamento / Alerta dinâmico com botão de retorno ("← Voltar à visão regional" ou "← Voltar ao município");
   - Legenda cartográfica fixa (APA, municípios pontilhados, alertas intra-APA rubros e alertas extra-APA azuis);
   - Conexão e metadados prontos para o **QGIS MCP Server** (`projetoDesignChapadaAgosto.qgz`).

---

## 2. Etapas de Execução

### Fase 1: Camada de Dados Espaciais Reais da Chapada do Araripe (`src/data/chapadaStoryData.ts`)
- Criar módulo dedicado de dados espaciais e tabulares espelhando o payload da Chapada Desmatada:
  - GeoJSON consolidado e otimizado da APA Chapada do Araripe, dos 18 municípios do território e da amostra representativa e consistente de alertas MapBiomas intra e extra-APA;
  - Séries temporais anuais por município (2019 a 2025) com hectares e contagem de alertas;
  - Dicionário de pressões antrópicas (agropecuária, expansão urbana, mineração/garimpo, estradas, causas naturais);
  - Conteúdo editorial pré-configurado com títulos, subtítulos, parágrafos e termos em destaque jornalísticos.

### Fase 2: Visualizador Interativo Interno (`src/components/InteractiveMapPreview.tsx` e `ChapadaWebmapViewer.tsx`)
- Atualizar o visualizador interativo principal da plataforma para incorporar a interface completa em tela cheia / container operacional:
  - Basemap Sentinel-2 Cloudless EOX com controle de opacidade e satélite;
  - Pilha de painéis flutuantes (UI stack) com efeito *glassmorphism* sobre o satélite:
    - Painel Editorial de Abertura;
    - Painel de Ranking Municipal com barras dinâmicas;
    - Painel de Detalhes de Nível 2 e Nível 3;
    - Legenda temática oficial;
  - Controles de alternância de nível com animações de câmera e filtro por camadas;
  - Interação direta com os alertas: visualização das imagens antes/depois do MapBiomas ao inspecionar alertas individuais;
  - Alternância entre modo satélite puro, modo satélite com limites e visualização temática com auditoria.

### Fase 3: Motor de Geração e Exportação Webmap HTML5 (`src/services/webmapPublicationService.ts`)
- Modernizar o gerador de arquivos HTML standalone de publicação:
  - Gerar o código HTML5 completo, responsivo e autônomo com a mesma arquitetura do `chapadadesmatada`;
  - Inclusão dos scripts de narrativa em 3 níveis, renderizador de imagens comparativas de satélite antes/depois, ranking dinâmico e integração com o projeto QGIS de referência (`projetoDesignChapadaAgosto.qgz`);
  - Funcionalidade de download com 1 clique do HTML autônomo e botão de pré-visualização ao vivo em nova aba.

### Fase 4: Integração com o Painel de Controle e QGIS MCP
- Garantir que o painel de controle operacional do MapeIA permita ao usuário:
  - Carregar o projeto da Chapada do Araripe como projeto ativo padrão ou modelo-base;
  - Visualizar o status de conexão com o QGIS MCP (`projetoDesignChapadaAgosto.qgz` e GeoPackage `gdbChapaAnalitica.gpkg`);
  - Publicar e exportar o webmap em 1 clique com as diretrizes do protocolo Luna (2026).

### Fase 5: Validação e Testes
- Compilar e validar a aplicação com `compile_applet`;
- Garantir ausência de erros de renderização cartográfica, links e scripts de CDN;
- Validar a responsividade e o comportamento móvel e desktop dos painéis flutuantes.

---

## 3. Arquivos Envolvidos
- `src/data/chapadaStoryData.ts` (Novo: payload cartográfico, geojson da APA/municípios/alertas, estatísticas temporais e textos editoriais);
- `src/components/ChapadaWebmapViewer.tsx` (Novo: componente dedicado do webmap com navegação em 3 níveis, satélite Sentinel-2 e painéis flutuantes);
- `src/components/InteractiveMapPreview.tsx` (Atualização: integração com o visualizador Chapada Desmatada e chave seletora de visualização);
- `src/services/webmapPublicationService.ts` (Atualização: template HTML gerado reproduzindo fielmente o modelo chapadadesmatada);
- `src/components/PublishedWebmapModal.tsx` (Atualização: pré-visualização aprimorada e exportação do webmap temático);
- `src/components/AgentWorkflowDiagram.tsx` / `AgentsView.tsx` (Preservação e refinamento dos agentes e do QGIS MCP).
