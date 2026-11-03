# 1. Resumo executivo e proposta de valor

## A verdade em uma página

**O mercado existe e já está ocupado.** No Brasil, Even3, Doity e Galoá atendem eventos científicos há mais de uma década, com submissão, avaliação, certificados e anais. **[FATO]** Even3 cobra 10% por inscrição vendida e uma taxa por trabalho submetido ([Even3](https://platform.even3.com/?p=9253)); Doity dá 10 submissões grátis e cobra plano acima disso ([Doity](https://doity.com.br/blog/plataforma-para-eventos-cientificos/)); Galoá atende sociedades grandes (SBPC, ANPED, ABEP) e atribui DOI via Crossref desde 2015 ([Galoá](https://com-galoascience-www.pages.dev/scientific-conference-platform/)). Internacionalmente há EasyChair, Microsoft CMT (gratuito), OpenConf, ConfTool, Oxford Abstracts, Fourwaves, Ex Ordo e outros.

**Consequência:** uma "plataforma completa de gestão de eventos científicos" não é proposta de valor. É a lista de requisitos mínimos para entrar no mercado. Construir tudo o que o briefing lista levaria mais de um ano para um time pequeno e terminaria em paridade com concorrentes que já têm base instalada, marca e suporte.

**Onde há espaço real (hipóteses a validar, não fatos):**
1. **[HIPÓTESE]** Eventos recorrentes de instituições (mostras de iniciação científica, semanas acadêmicas, seminários de programas de pós-graduação) são organizados por professores sem equipe, com orçamento zero ou empenho público, e sofrem mais com a configuração e com a coordenação de avaliadores do que com falta de funcionalidades.
2. **[HIPÓTESE]** O gargalo operacional de quem organiza não é a submissão, é a avaliação: convidar, distribuir, cobrar pareceres atrasados, lidar com conflitos e consolidar decisões. Ferramentas existentes resolvem isso, mas com UX datada (crítica recorrente ao EasyChair, por exemplo).
3. **[HIPÓTESE]** Preço por evento transparente e previsível, sem percentual sobre inscrição, é atraente para instituições públicas que pagam por empenho.

## Proposta de valor recomendada (para validar no piloto)

> **Cienvia: o evento científico da sua instituição configurado em uma tarde e avaliado sem planilha paralela.**

Para **coordenadores de eventos acadêmicos recorrentes** que hoje dependem de formulários, e-mail e planilhas ou de plataformas genéricas, a Cienvia entrega **chamada de trabalhos, avaliação por pares e divulgação de resultados** com:
- criação do evento a partir de modelo (ou clonando a edição anterior);
- distribuição de avaliadores assistida, com conflito de interesse verificado;
- painel único de pendências e cobrança automática de pareceres;
- preço fixo por evento, pagável por empenho/nota fiscal.

O que **não** é proposta de valor no início: IA, app nativo, DOI, pagamentos, domínio próprio. Ver doc 06.

## Recomendação executiva

1. **[RECOMENDAÇÃO]** Antes de escrever código, faça 8 a 12 entrevistas com organizadores (roteiro no doc 08) e consiga **um evento piloto real com data** entre 4 e 8 meses à frente.
2. **[RECOMENDAÇÃO]** MVP restrito a: evento + chamada + submissão + avaliação + decisão + resultado público + certificado simples de autor/avaliador. Prazo estimado: cerca de 20 semanas de trabalho mais 25% de contingência, ou seja, uns 6 meses com 1 dev sênior (doc 07). O roadmap de 16 semanas do doc 06 só fecha sem imprevistos.
3. **[RECOMENDAÇÃO]** Stack enxuta e portátil: TypeScript, PostgreSQL gerenciado, armazenamento de objetos compatível com S3 (R2), e-mail transacional. Custo de infraestrutura no piloto abaixo de US$ 60/mês (doc 07).
4. **[RECOMENDAÇÃO]** Critério de continuidade após o piloto: organizador usaria de novo e pagaria pelo menos R$ 1.500 pela próxima edição, e o tempo de operação da avaliação caiu de forma mensurável (doc 08). Se não, pare ou mude de segmento antes de investir na Fase 2.

## Questionamentos às premissas do briefing

| Premissa do briefing | Problema | Posição |
|---|---|---|
| "Gestão completa" no produto | Escopo de 12+ meses; paridade sem diferencial | Começar estreito e profundo na avaliação |
| Mobile-first para todos | Organizador configura e avaliador lê PDF de 10 páginas em desktop | Responsivo; mobile-first só para autor (status), participante e visitante |
| Integração Lattes | **[FATO]** Não há API pública do Lattes; o Extrator Lattes do CNPq exige convênio institucional | Guardar apenas o link do currículo; ORCID via API pública |
| Certificados só na Fase 2 | **[HIPÓTESE]** No Brasil, certificado é o que o participante mais cobra; sem ele o piloto usa outra ferramenta em paralelo | Certificado simples de autor e avaliador entra no MVP |
| IA como diferencial | Concorrentes podem adicionar a mesma IA em semanas; não é defensável sozinha | IA na Fase 3, como apoio, depois de existir dado e confiança |
| Cloudflare D1 | Limite de tamanho por banco e modelo SQLite pouco adequado ao núcleo transacional multi-tenant | PostgreSQL (ADR 0002) |
