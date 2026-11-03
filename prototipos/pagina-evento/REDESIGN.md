# Redesign da página pública de evento no Cienvia

Caso de referência: **Encontro Intermediário dos GTs da ABEP 2025** ([página original no SIGEventos](https://sigeventos.ufrn.br/evento/GTsABEP2025/principal/view)).
Data da análise: 02/11/2026. Protótipo nesta pasta: abra `index.html` no navegador (funciona sem servidor e sem instalação).

Legenda, a mesma dos documentos de produto em `docs/`:
**[FATO]** verificado na fonte citada · **[HIPÓTESE]** precisa de validação · **[RECOMENDAÇÃO]** posição de design, sujeita à sua aprovação.

---

## 0. Leia antes: limites desta análise

1. **Não houve inspeção visual do site original.** O proxy deste ambiente bloqueou o acesso direto a `sigeventos.ufrn.br` (curl na nuvem e no seu computador retornaram 403). As 8 páginas públicas foram lidas por um leitor automatizado que converte o HTML em texto. Consequência: os problemas de conteúdo, estrutura e marcação são **[FATO]**; tudo o que depende de ver a página renderizada (layout em celular e tablet, contraste real, tamanho de toque) é **[HIPÓTESE]** até alguém abrir o site em um navegador. Isso afeta diretamente o item "avaliar desktop, tablet e mobile" do pedido: ele está avaliado só no protótipo novo, não no original.
2. **Nomes e títulos foram transcritos pelo mesmo leitor automatizado.** Há risco de erro de grafia em nomes próprios. Antes de mostrar o protótipo fora da equipe, confira `data.js` contra a página original.
3. **O evento já aconteceu (1 a 4/12/2025).** A página real hoje deveria estar no estado "encerrado". O protótipo abre nesse estado e tem um seletor "Simular fase" para mostrar os outros cinco estados.
4. **Logotipos:** os 13 logotipos de apoio e patrocínio foram recortados de uma captura da página oficial (enviada pelo usuário em 03/11/2026), em resolução de tela. Uso demonstrativo; uso público exige autorização de cada instituição. O logotipo da ABEP não aparece na fonte e ficou como texto.
5. **Fotos de palestrantes:** não incluídas. Não há fotos com licença livre desses nomes, e o ambiente não consegue baixar imagens. `data.js` tem um registro `FOTOS` para adicioná-las; no produto, cada palestrante envia a própria foto com consentimento (direito de imagem e LGPD).
6. **Conflito com a proposta de MVP (doc 06).** O doc 06 deixa **programação científica, inscrição e anais fora do MVP**. Este protótipo mostra a visão completa porque o pedido foi "como ficaria a página de um evento". A seção 7 separa o que entra no MVP do que é Fase 2. Não use o protótipo como escopo de MVP sem essa leitura.

---

## 1. Diagnóstico crítico do site atual

### 1.1 Problemas com evidência

| # | Problema | Evidência | Tipo | Impacto | Esforço | Prioridade |
|---|---|---|---|---|---|---|
| D1 | Página inicial não diz o que fazer agora: não há prazo, valor, estado do evento nem chamada para ação | `principal/view`: título, texto corrido, lista de GTs e tabela de minicursos; prazos só em `inscricao-submissoes` | FATO | Alto | Baixo | P1 |
| D2 | Programação é texto corrido: horário, título, sala e nomes em linhas separadas; sessões paralelas não são comparáveis; sem busca, filtro ou exportação | `pagina/programacao` | FATO | Alto | Médio | P1 |
| D3 | Regras de submissão inacessíveis: a página manda consultar a aba "Chamada de Trabalhos", que não existe no menu; extensão e número de autores não aparecem em nenhuma página | `inscricao-submissoes` | FATO | Alto | Baixo | P1 |
| D4 | Evento encerrado continua com o mesmo conteúdo de antes: não há destaque para trabalhos, certificados ou acervo | Todas as páginas, consulta em 02/11/2026 | FATO | Alto | Médio | P1 |
| D5 | Variável de template não processada na meta-descrição (`${dadosPaginaPublica.evento.titulo}`) em todas as páginas; título da aba com mais de 150 caracteres | `<head>` das 8 páginas | FATO | Médio (SEO e compartilhamento) | Baixo | P1 |
| D6 | Link quebrado: "como chegar" da UERJ com protocolo duplicado `http://https://` | `informacoes-uerj` | FATO | Médio | Baixo | P1 |
| D7 | Informação contraditória sobre o local: a página do local fala em 6º, 7º e 8º andares; a programação usa salas no 4º e no 8º andar (Bloco F) e uma sala 6023 | `informacoes-uerj` × `programacao` | FATO | Médio | Baixo | P1 |
| D8 | Nome do evento inconsistente: "Encontro Intermediário" no título, "Encontro Nacional dos GTs" no corpo da página do local; GT chamado ora "Projeções e Estimativas", ora "Estimativas e Projeções" | `principal/view`, `informacoes-uerj` | FATO | Baixo | Baixo | P2 |
| D9 | Documentos sem formato, tamanho ou data; numeração decrescente (8 a 1); lista de restaurantes misturada com templates; um item hospedado no Google Drive fora da numeração | `documentos/view` | FATO | Médio | Baixo | P2 |
| D10 | Apoiadores e patrocinador aparecem só como imagem, sem nome em texto alternativo legível; seletor de idioma só com bandeiras. Nomes identificados a partir de captura de tela enviada pelo usuário: 12 apoiadores e CAPES como patrocinadora | `principal/view` | FATO | Médio (acessibilidade, WCAG 1.1.1) | Baixo | P2 |
| D11 | Texto de interface vazado ("Menu comprimido", ">" solto na trilha) | Todas as páginas | FATO | Baixo | Baixo | P3 |
| D12 | Contato com "Organização do Evento" em branco | `contato/view` | FATO | Baixo | Baixo | P3 |
| D13 | Minicurso cancelado aparece na página inicial com a mesma hierarquia dos ativos | `principal/view` | FATO | Baixo | Baixo | P3 |
| D14 | Coordenações dos GTs não aparecem, embora os GTs sejam o eixo do evento | `organizadores` | FATO | Baixo | Baixo | P3 |
| D15 | Ausências que geram dúvida: acessibilidade do local, hospedagem, link do grupo de WhatsApp, resumos dos trabalhos | `informacoes-uerj`, `programacao` | FATO (ausência) | Médio | Depende da organização | P2 |
| D16 | Um mesmo trabalho (Moçambique e Malawi) aparece em duas sessões (01/12 e 04/12) | `programacao` | FATO, causa não verificada | Baixo | Baixo | P3 |

### 1.2 Hipóteses que precisam de validação

| # | Hipótese | Como validar |
|---|---|---|
| H1 | O layout do SIGEventos não é responsivo de forma adequada no celular (menu lateral, tabelas largas) | Abrir as 8 páginas em 390 px e 768 px; registrar captura |
| H2 | Contraste e tamanho de alvos de toque não atendem WCAG 2.2 AA | Lighthouse e axe nas páginas originais |
| H3 | O principal motivo de visita durante o evento é "o que está acontecendo agora e em qual sala" | Analytics do evento ou 5 entrevistas com participantes |
| H4 | Autores consultam a página pública para saber o status do trabalho, mesmo existindo área logada no SIGEventos | Perguntar à comissão quantos e-mails de "meu trabalho foi aceito?" recebeu |
| H5 | A seleção de idioma (pt, en, es) não traduz o conteúdo do evento | Trocar o idioma no site e comparar |

### 1.3 Onde o original acerta

Conteúdo da programação é completo (moderação, autoria e sala por sessão), prazos estão corretos e consistentes entre si, e existe passo a passo separado para quem tem e quem não tem vínculo com a UFRN. O redesign aproveita todo esse conteúdo; o problema é apresentação e arquitetura, não falta de informação.

---

## 2. Benchmarking de padrões

Baseado em conhecimento prévio da equipe sobre os produtos, **não reverificado em 02/11/2026**. A comparação comercial está no doc 02; aqui o foco é o padrão de interface.

| Padrão | Onde aparece | Adotado no protótipo |
|---|---|---|
| Agenda pessoal com favoritos e exportação para calendário | Sched, Whova, apps de grandes congressos | Sim: ☆ por atividade, aba "Minha agenda", exportação .ics |
| Grade por sala e horário | Indico (timetable), Sched | Sim: modo "Grade" |
| Filtro por trilha e tipo, busca por autor | Indico, pretalx, programas da ACM | Sim |
| Página inicial que muda com a fase do evento | Sites de conferências maiores, feito à mão a cada edição | Sim, automatizado por datas (seção 5) |
| Página por trabalho com metadados citáveis | Anais da ACL Anthology, Galoá | Não no protótipo; proposto na Fase 2 (acervo) |
| Validação pública de certificado por código | Even3, Doity, Galoá | Proposto, não prototipado |

O que nenhum desses faz bem, e é oportunidade para o Cienvia **[HIPÓTESE]**: tratar o evento encerrado como produto (acervo navegável e citável por padrão), e mostrar com honestidade o que a organização não informou, em vez de esconder a lacuna.

---

## 3. Arquitetura de informação

### 3.1 Mapa do site

```
Início ............ estado do evento, chamadas da fase, GTs, datas, destaques, local
Programação ....... lista | grade | minha agenda; filtros e exportação
Participar ........ etapas, inscrição, submissão, normas, documentos, área do autor, certificados
Trabalhos ......... acervo pesquisável (anais quando houver)
Local ............. como chegar, campus, alimentação, acessibilidade
Organização ....... realização, comissões, coordenações
Contato
```

Mudanças em relação ao original e por quê:
- **"Inscrição/Submissões", "Normas apresentação" e "Documentos" viram uma página, "Participar".** O participante pensa em tarefa ("quero apresentar"), não em tipo de conteúdo. Três abas obrigavam a ir e voltar.
- **"Informações UERJ" vira "Local".** O nome do evento não deve depender de qual universidade sedia a edição; a próxima edição pode ser em outro lugar.
- **Nova seção "Trabalhos".** É o que sobra de valor depois que o evento acaba (D4).
- **Navegação com 7 itens**, rótulos de uma palavra, CTA da fase no cabeçalho.

### 3.2 Preservação de URLs

| URL atual (SIGEventos) | Destino no Cienvia | No protótipo |
|---|---|---|
| `/evento/GTsABEP2025/principal/view` | `/<org>/<evento>` | `#principal` → `#inicio` |
| `/pagina/programacao` | `/<org>/<evento>/programacao` | `#programacao` |
| `/pagina/inscricao-submissoes` | `/<org>/<evento>/participar` | `#inscricao-submissoes` → `#participar` |
| `/pagina/normas-apresentacao` | `/<org>/<evento>/participar#normas` | `#normas-apresentacao` → `#participar` |
| `/documentos/view` | `/<org>/<evento>/participar#documentos` | `#documentos` → `#participar` |
| `/pagina/informacoes-uerj` | `/<org>/<evento>/local` | `#informacoes-uerj` → `#local` |
| `/pagina/organizadores` | `/<org>/<evento>/organizacao` | `#organizadores` → `#organizacao` |
| `/contato/view` | `/<org>/<evento>/contato` | `#contato` |

O SIGEventos é da UFRN; o Cienvia não controla esse domínio. Redirecionamento 301 só existe se o evento migrar e a UFRN aceitar redirecionar. **[RECOMENDAÇÃO]** Para eventos que migrarem, o importador do Cienvia aceita a URL antiga e cria as rotas equivalentes acima, para que links em e-mails e currículos Lattes possam ser atualizados por simples troca de domínio.

---

## 4. Design system

### 4.1 Camadas de marca
- **Plataforma (Cienvia):** faixa superior e rodapé em azul-petróleo escuro com verde-água. Discreta, sempre presente, nunca compete com o evento.
- **Evento:** cor de ação (verde institucional), tipografia e conteúdo. No produto, a cor do evento é configurável; o sistema valida contraste antes de aceitar.

O doc 10 aponta que a marca Cienvia ainda não tem manual. **Os tokens abaixo são provisórios** e devem ser revistos quando o manual existir.

### 4.2 Cor (tema claro; tema escuro definido em `styles.css`)

| Token | Valor | Uso | Contraste medido |
|---|---|---|---|
| `--petroleo` | #0E3B47 | Faixa da plataforma, rodapé | texto `--on-band-2` sobre ela: 7,6:1 |
| `--agua` | #4DBFB1 | Verde-água, só decorativo ou sobre petróleo | 5,4:1 sobre petróleo |
| `--verde` | #1B6A4F | Ação primária, estado ativo | 6,5:1 sobre branco |
| `--link` | #0F6470 | Links | 6,8:1 |
| `--destaque` | #A8641C | Marcações pontuais ("em curso", favoritos) | 4,7:1 |
| `--ink-2` | #485A62 | Texto secundário | 7,2:1 |
| `--line-strong` | #7A8F8F | Borda de campos e botões secundários | 3,4:1 (WCAG 1.4.11) |
| Estados | aberto, avaliação, ao vivo, encerrado | Pílula de estado com texto, nunca só cor | 5,1 a 6,1:1 |
| GTs | azul, verde, ocre, ameixa | Marcador de 10 px + nome do GT por extenso | 5,8 a 7,0:1 |

Contrastes calculados com a fórmula WCAG 2.x sobre os valores do arquivo. Não houve medição em tela real.

### 4.3 Tipografia
- **Source Serif 4** (títulos): serifa de texto com eixo óptico, tom editorial e acadêmico sem cair no clichê de jornal.
- **IBM Plex Sans** (interface e corpo): desenhada para contexto técnico e científico, ótima em tamanhos pequenos, boa cobertura de acentos.
- **IBM Plex Mono** (horários, códigos de sala, coordenadas): números tabulares que alinham na grade.
- Escala 1,25: 13 · 15 · 17 · 21 · 26 · 34 · até 56 px. Corpo de 17 px, linha de 1,6, largura máxima de 66 caracteres.
- No produto, auto-hospedar as fontes (sem Google Fonts) para LCP e LGPD.

### 4.4 Componentes do protótipo
Pílula de estado · botão (primário, secundário, fantasma) · chip de filtro com contagem · abas de dia com navegação por setas · cartão de atividade expansível com favorito · bloco de grade · linha do tempo de prazos · etapas da jornada · cartão de pessoa com iniciais · lista de documentos · campo com dica e erro · formulário em passos · tabela que vira lista no celular · espaço de logotipo pendente · nota de lacuna da fonte.

### 4.5 Padrões de interação
- **Estado sempre em texto e forma**, nunca só em cor (pílula, ícone de etapa concluída, borda).
- **Lacuna visível:** quando a organização não informou algo, a interface diz "Não informado" no lugar, em itálico. Esconder a ausência gera e-mail para a comissão.
- **Busca sem acento** ("baeninger" encontra "Baeninger"; "migracao" encontra "Migração") com destaque do termo e expansão automática da sessão que contém o trabalho.
- **Filtros mostram contagem** antes do clique, para evitar resultado vazio.
- **Resultado vazio oferece saída:** "Há N resultados em outros dias".
- **Movimento mínimo:** só a pílula "ao vivo" pulsa; tudo respeita `prefers-reduced-motion`.

### 4.6 Logotipos
Parede com placa branca nos dois temas. Cada marca é dimensionada para a **mesma área visual** (largura = √(área × proporção), altura = √(área ÷ proporção), com teto de altura e largura), em vez de mesma altura ou mesma largura: assim uma marca horizontal longa (ICS UERJ) não domina e um selo quadrado (UERJ) não some. Instituições sem logotipo disponível usam a sigla em placa do mesmo tamanho.

### 4.7 Ilustração
Isolinhas e densidade de pontos geradas por código, com coordenadas da UERJ (22°54′S 43°14′W). Remete a demografia e clima sem fingir ser um dado. A legenda diz isso. No produto, a organização pode trocar por foto própria.

---

## 5. Decisão central: a página muda com a fase do evento

| Fase (calculada pelas datas) | Pílula | Chamadas principais | Painel do hero |
|---|---|---|---|
| Antes das inscrições | Inscrições abrem em… | Conhecer a chamada, Datas | Próximo prazo |
| Submissões abertas | Inscrições e submissões abertas | Inscrever-se, Submeter, Normas | Próximo prazo com contagem |
| Em avaliação | Trabalhos em avaliação | Inscrever-se, Acompanhar meu trabalho | Data do resultado |
| Resultados e versão final | Inscrições abertas | Inscrever-se até 30/11, Enviar versão final | Próximo prazo |
| Em andamento | Evento em andamento (ao vivo) | Programação de hoje, Como chegar, Minha agenda | "Agora" e "A seguir" com sala |
| Encerrado | Evento encerrado | Trabalhos apresentados, Programação, Certificados | Números do encontro |

Por quê: o pedido proíbe chamadas expiradas em evento encerrado, e o organizador não vai lembrar de editar a página em cada fase. Com as datas da chamada já cadastradas, a troca é automática. Custo de implementação baixo; é uma função pura sobre datas que já existem no modelo (doc 05).

---

## 6. Stack

**Protótipo:** HTML, CSS e JavaScript sem dependências, dados em `data.js`. Escolha deliberada: o repositório está vazio, o doc 06 proíbe começar o produto antes da aprovação do MVP, e um protótipo sem build abre com duplo clique, é publicável como página estática e não cria dívida de framework. Não é a arquitetura do produto.

**Produto [RECOMENDAÇÃO], alinhado ao doc 05 (Workers + PostgreSQL):**
- Página pública **renderizada no servidor ou pré-gerada** a cada publicação (SvelteKit com adaptador para Workers, opção já citada no doc 05). O protótipo renderiza no navegador; isso é aceitável para demonstração e ruim para SEO.
- **JSON-LD** `Event` e `ScholarlyArticle`, meta-descrição gerada a partir do resumo (corrige D5), `<title>` curto, sitemap por evento.
- **Core Web Vitals:** sem imagem pesada no hero (ilustração é canvas ou SVG leve; foto opcional em AVIF/WebP com `srcset`), fontes auto-hospedadas com `font-display: swap`, JavaScript da programação carregado só na rota de programação.
- **Componentes** do protótipo viram componentes do design system; os mesmos tokens servem à área logada.
- **Programação como dado**, não como texto livre: sessão, sala, horário, papéis e trabalhos vinculados à submissão. É o que permite busca, grade, .ics, acervo e certificados de moderação sem retrabalho.

---

## 7. Roadmap

Separação pedida: melhorias visuais imediatas × evoluções funcionais. Coluna "Doc 06" mostra onde cada item cai no plano de MVP já proposto.

### 7.1 Imediato (só apresentação, sem novo modelo de dados)

| Item | Esforço | Impacto | Doc 06 | Critério de aceitação |
|---|---|---|---|---|
| Página inicial com estado do evento e chamadas por fase | M | Alto | MVP (página pública) | Para cada uma das 6 fases, a página mostra a pílula e as chamadas da tabela 5; nenhuma chamada aponta para prazo vencido |
| Datas importantes em linha do tempo | P | Alto | MVP | Marcos com estado concluído, em curso, próximo, calculados pela data atual |
| "Participar" unificado com regras completas da chamada | P | Alto | MVP (configuração da chamada) | Nenhuma regra de submissão exige sair da página; campos não preenchidos pelo organizador aparecem como "Não informado" |
| Documentos com formato, tamanho e data | P | Médio | MVP | Cada arquivo mostra extensão, tamanho e data de envio, agrupado por finalidade |
| Meta-tags, título curto, JSON-LD | P | Médio | MVP | Nenhuma página com variável não processada; título até 60 caracteres; validação sem erro no Rich Results Test |
| Acessibilidade AA na página pública | M | Alto | MVP (RNF) | axe sem violações sérias; navegação completa por teclado; leitor de tela anuncia estado, filtros e resultados |

### 7.2 Evolução funcional

| Item | Esforço | Impacto | Doc 06 | Critério de aceitação |
|---|---|---|---|---|
| Área do autor com linha do tempo do trabalho, parecer e versão final | M | Alto | MVP (já previsto) | Autor vê situação, prazo e ação pendente sem contatar a comissão |
| Programação estruturada: lista, grade, filtros, busca | G | Alto | **Fase 2** | Busca sem acento por título, autor e palestrante em menos de 100 ms com 1.000 trabalhos; grade sem rolagem horizontal da página |
| Minha agenda e exportação .ics | P (após programação) | Médio | Fase 2 | Arquivo importa sem erro no Google Agenda, Outlook e Apple Calendário, com fuso de Brasília correto |
| Modo "ao vivo" (agora e a seguir) | P (após programação) | Médio | Fase 2 | Atividades em curso destacadas conforme o horário de Brasília |
| Inscrição em 3 passos com validação | G | Alto | **Fase 2** | Erros por campo, foco no primeiro erro, revisão antes de confirmar, confirmação por e-mail |
| Certificados com código de validação | M | Alto | MVP (autor e avaliador); Fase 2 (presença) | Página pública valida o código sem login |
| Acervo: página por trabalho, busca, filtros, BibTeX/RIS, metadados para Google Scholar | G | Alto pós-evento | **Fase 2** | Cada trabalho com URL estável e metadados `citation_*`; busca por autor, título, ano e GT |
| Página por GT com coordenação e sessões | P | Médio | Fase 2 | GT lista coordenação, sessões e trabalhos |

**Leitura crítica:** se o MVP seguir o doc 06, a página pública do piloto terá início com fases, participar, documentos, área do autor e certificados de autor e avaliador. A programação interativa, que é a parte mais vistosa deste protótipo, fica para a Fase 2. Se a demonstração for para vender o Cienvia a sociedades científicas como a ABEP, essa ordem pode estar errada: para eventos com 90 trabalhos em sessões paralelas, a programação é o que o participante mais usa. Vale reconsiderar a prioridade com dados do piloto, não com o protótipo.

---

## 8. Validação executada

Feita com Chromium (Playwright) sobre o protótipo local, em 02 e 03/11/2026:

| Verificação | Resultado |
|---|---|
| 7 visões em 1366 px e 390 px sem rolagem horizontal da página | Passou |
| Erros de JavaScript no console | Nenhum |
| Busca "baeninger" em todos os dias | 5 atividades, 10 trabalhos, termo destacado |
| Grade de 02/12 com 6 salas | Colunas legíveis, rolagem só dentro da grade |
| Clique em bloco da grade abre o cartão na lista | Passou |
| Favoritar e exportar .ics | 10h30 de Brasília gravado como 13h30 UTC, campos escapados e dobrados conforme RFC 5545 |
| Formulário de inscrição: avançar com campos vazios | Mensagens por campo, foco no primeiro campo inválido |
| Troca de fase (6 estados) | Pílula, chamadas, painel e etapas atualizados |
| Tema escuro | Renderiza com tokens próprios |
| Contraste dos tokens (fórmula WCAG) | Texto ≥ 4,5:1; bordas de controle ≥ 3:1 após ajuste |

**Não validado:** leitor de tela real (NVDA, VoiceOver), Lighthouse e Core Web Vitals, tablet físico, teste com usuários. Recomendo os três primeiros antes de qualquer apresentação externa e um teste rápido com 5 participantes do último encontro (H3, H4).

---

## 9. Arquivos

| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura, cabeçalho, rodapé, diálogo de exportação |
| `styles.css` | Tokens (claro e escuro), componentes, responsivo, impressão |
| `app.js` | Fases, roteamento, renderização das visões, busca, grade, .ics, formulário |
| `data.js` | Conteúdo do evento extraído da fonte pública, com data de coleta; apoio, patrocínio e registro de fotos |
| `campus3d.js` | Esquema 3D do Campus Maracanã em SVG, desenhado sobre o mapa oficial enviado pelo usuário; Bloco F (salas das sessões) destacado |
| `img/logos/` | 13 logotipos recortados da página oficial |
| `REDESIGN.md` | Este documento |
