# Cienvia: análise e proposta de MVP

Plataforma SaaS de gestão de eventos científicos. Este diretório contém a análise de produto, mercado e arquitetura **anterior a qualquer implementação**. Nenhum código deve ser escrito antes da aprovação da proposta de MVP (doc 06).

Data da análise: 02/11/2026. Estado anterior: repositório `farol-labs/cienvia` e pasta local vazios; não havia documentos, arquitetura ou roadmap a revisar.

## Legenda usada em todos os documentos

| Marca | Significado |
|---|---|
| **[FATO]** | Verificado em fonte pública citada (link no texto). Pode estar desatualizado; data da consulta: 02/11/2026. |
| **[HIPÓTESE]** | Plausível, mas não verificada. Precisa de validação (entrevista, piloto, teste técnico). |
| **[RECOMENDAÇÃO]** | Posição da equipe, com justificativa. Sujeita à sua aprovação. |

## Índice (13 entregáveis)

| # | Entregável | Arquivo |
|---|---|---|
| 1 | Resumo executivo e proposta de valor | [docs/01-resumo-executivo.md](docs/01-resumo-executivo.md) |
| 2 | Benchmarking das soluções concorrentes | [docs/02-mercado-e-viabilidade.md](docs/02-mercado-e-viabilidade.md) |
| 3 | Análise crítica de viabilidade técnica e comercial | [docs/02-mercado-e-viabilidade.md](docs/02-mercado-e-viabilidade.md) |
| 4 | Público-alvo, problemas e diferenciação | [docs/02-mercado-e-viabilidade.md](docs/02-mercado-e-viabilidade.md) |
| 5 | Requisitos funcionais e não funcionais | [docs/03-requisitos.md](docs/03-requisitos.md) |
| 6 | Fluxogramas das jornadas | [docs/04-jornadas-e-telas.md](docs/04-jornadas-e-telas.md) |
| 7 | Arquitetura técnica e modelo de dados | [docs/05-arquitetura-e-dados.md](docs/05-arquitetura-e-dados.md) |
| 8 | Telas e dashboards | [docs/04-jornadas-e-telas.md](docs/04-jornadas-e-telas.md) |
| 9 | Definição do MVP | [docs/06-mvp-e-roadmap.md](docs/06-mvp-e-roadmap.md) |
| 10 | Roadmap com marcos e dependências | [docs/06-mvp-e-roadmap.md](docs/06-mvp-e-roadmap.md) |
| 11 | Estimativas de infraestrutura, desenvolvimento e operação | [docs/07-estimativas.md](docs/07-estimativas.md) |
| 12 | Estratégia de validação com evento piloto | [docs/08-piloto.md](docs/08-piloto.md) |
| 13 | Riscos, premissas e questões abertas | [docs/09-riscos-e-questoes.md](docs/09-riscos-e-questoes.md) |

Complementos:
- Decisões arquiteturais (ADRs): [0001 monólito](docs/adr/0001-monolito-modular-typescript.md), [0002 banco](docs/adr/0002-banco-de-dados.md), [0003 arquivos](docs/adr/0003-armazenamento-de-arquivos.md), [0004 IA](docs/adr/0004-ia-apenas-como-apoio.md)
- Marca: [docs/10-marca.md](docs/10-marca.md)

## Protótipo funcional

O fluxo central do MVP (evento → submissão → avaliação → decisão → resultado → certificado) está em [app/](app/README.md). Para rodar: `cd app`, `npm install`, `npm start` e abrir http://localhost:3000. Use o roteiro de demonstração do README do app.

## As cinco decisões que dependem de você

1. **Segmento inicial (wedge).** Recomendamos começar por eventos recorrentes de instituições de ensino (mostras de iniciação científica, semanas acadêmicas, seminários de pós-graduação), não por grandes congressos de sociedades. Ver doc 02, seção 4.
2. **Evento piloto concreto.** Sem um evento real com data, o MVP não tem critério de pronto. Ver doc 08.
3. **Equipe e orçamento.** Todas as estimativas assumem 1 desenvolvedor full-stack sênior em tempo integral + design parcial. Se for diferente, os prazos mudam. Ver doc 07.
4. **Pagamentos e inscrições fora do MVP.** Recomendamos excluir; o piloto usa ferramenta externa para inscrições. Ver doc 06.
5. **Banco de dados.** Recomendamos PostgreSQL gerenciado em vez de Cloudflare D1 para o núcleo transacional. Ver ADR 0002.
