# 5. Requisitos funcionais e não funcionais

Prioridade: **M** = MVP (Fase 1), **E** = Expansão (Fase 2), **D** = Diferenciação (Fase 3), **X** = fora de escopo até haver demanda comprovada.

## 5.1 Requisitos funcionais

### Plataforma e contas
| ID | Requisito | Fase |
|---|---|---|
| RF-01 | Cadastro e login por e-mail com link mágico (sem senha) e opção de senha | M |
| RF-02 | Login com ORCID (OAuth público) e vínculo do ORCID iD autenticado ao perfil | E |
| RF-03 | Perfil único da pessoa reutilizado entre eventos (nome, e-mail, instituição, ORCID, link Lattes, áreas de interesse) | M |
| RF-04 | Organização (tenant) com membros e papéis | M |
| RF-05 | Administrador da plataforma: criar organizações, suspender, ver uso, personificar com registro em auditoria | M |
| RF-06 | Importação de dados do Lattes | X (sem API pública) |

### Gestão do evento
| ID | Requisito | Fase |
|---|---|---|
| RF-10 | Criar evento a partir de modelo (mostra de IC, seminário, congresso) | M |
| RF-11 | Clonar edição anterior (eixos, formulários, comissões, modelos de e-mail) | M |
| RF-12 | Identidade visual básica: logo, cor primária, banner | M |
| RF-13 | Página pública em subcaminho/subdomínio da plataforma (`cienvia.app/<org>/<evento>`) | M |
| RF-14 | Domínio próprio do cliente | D |
| RF-15 | Chamada de trabalhos: modalidades (resumo, resumo expandido, artigo, pôster), eixos temáticos, prazos, limites por autor | M |
| RF-16 | Comissões organizadora e científica com papéis por eixo | M |
| RF-17 | Formato presencial/online/híbrido como informação do evento | M |
| RF-18 | Transmissão online, salas virtuais | X |
| RF-19 | Inscrição de participantes (gratuita) | E |
| RF-20 | Pagamento de inscrições (Pix, cartão, boleto, empenho) | E |

### Submissão
| ID | Requisito | Fase |
|---|---|---|
| RF-30 | Formulário de submissão configurável (campos padrão + até N campos extras de tipos simples) | M |
| RF-31 | Autores e coautores com ordem, afiliação e autor correspondente; coautor não precisa ter conta | M |
| RF-32 | Upload de PDF (e DOCX opcional) com limite de tamanho e páginas | M |
| RF-33 | Validação de obrigatórios, formato, tamanho, prazo e limite de submissões por autor | M |
| RF-34 | Checagem formal automática: número de páginas, metadados de autoria no PDF em duplo-cego, presença de nomes dos autores no texto (alerta, não bloqueio) | M (regras simples) / D (IA) |
| RF-35 | Rascunho salvo, edição até o prazo, histórico de versões | M |
| RF-36 | Status visível ao autor com linha do tempo | M |
| RF-37 | Retirada da submissão pelo autor | M |

### Avaliação por pares
| ID | Requisito | Fase |
|---|---|---|
| RF-40 | Convite a avaliadores por e-mail, aceite/recusa, áreas de especialidade e capacidade máxima | M |
| RF-41 | Atribuição manual e sugestão automática por eixo + balanceamento de carga | M |
| RF-42 | Conflito de interesse: declaração do avaliador + regras automáticas (mesma pessoa, coautor, mesma instituição configurável) | M |
| RF-43 | Modos simples-cego e duplo-cego | M |
| RF-44 | Avaliação aberta (identidades visíveis) | E |
| RF-45 | Formulário de avaliação configurável (critérios com nota, recomendação, comentário ao autor, comentário confidencial à comissão) | M |
| RF-46 | Lembretes automáticos antes e depois do prazo do parecer | M |
| RF-47 | Rodada de correção: solicitação de ajustes, reenvio pelo autor, reavaliação | M (1 rodada) / E (N rodadas) |
| RF-48 | Decisão: aprovado, aprovado com correções, rejeitado; decisão individual e em lote | M |
| RF-49 | Pareceres consolidados enviados ao autor (anonimizados conforme modo) | M |
| RF-50 | Carta de aceite em PDF | M |
| RF-51 | Rebuttal (réplica do autor) | X |

### Resultado e programação
| ID | Requisito | Fase |
|---|---|---|
| RF-60 | Lista pública de trabalhos aprovados (título, autores, eixo) | M |
| RF-61 | Programação: sessões orais/pôster, salas, horários, moderadores | E |
| RF-62 | Agenda pública e agenda pessoal | E |
| RF-63 | Registro de presença por QR code | E |

### Certificados
| ID | Requisito | Fase |
|---|---|---|
| RF-70 | Certificado de autoria/aprovação e de avaliador, gerado de um modelo com logo do evento | M |
| RF-71 | Código verificável + QR code + página pública de validação | M |
| RF-72 | Certificados de participação, apresentação, organização e regras de elegibilidade por presença | E |
| RF-73 | Editor visual de modelos de certificado | E |

### Anais e repositório
| ID | Requisito | Fase |
|---|---|---|
| RF-80 | Anais: página por trabalho, PDF, busca textual, filtros por eixo/autor/instituição | E |
| RF-81 | Exportação de referências (BibTeX, RIS) e metadados (Dublin Core, Highwire tags para Google Scholar) | E |
| RF-82 | ISSN/ISBN informado pelo organizador; PDF compilado dos anais | E |
| RF-83 | DOI via Crossref (como membro ou via sponsor) | D |
| RF-84 | Preservação: cópia de anais em repositório externo (Zenodo ou similar) | D |

### Comunicação e painéis
| ID | Requisito | Fase |
|---|---|---|
| RF-90 | E-mails transacionais com modelos editáveis por evento | M |
| RF-91 | E-mail em massa para segmentos (autores aprovados, avaliadores com pendência) | M |
| RF-92 | Painel do organizador: submissões por eixo/status, pareceres pendentes, prazos | M |
| RF-93 | Exportação CSV/XLSX de submissões, avaliações e decisões | M |
| RF-94 | Exportação completa dos dados do evento (JSON + arquivos) | M |

### IA (apoio, sempre com decisão humana)
| ID | Requisito | Fase |
|---|---|---|
| RF-100 | Sugestão de eixo temático na submissão | D |
| RF-101 | Sugestão de avaliadores por similaridade, com justificativa | D |
| RF-102 | Detecção de possíveis conflitos por coautoria pública (ORCID/OpenAlex) | D |
| RF-103 | Assistente de requisitos formais antes do envio | D |
| RF-104 | Geração automática de parecer ou decisão | **Proibido** |

## 5.2 Requisitos não funcionais

| ID | Categoria | Requisito | Critério mensurável |
|---|---|---|---|
| RNF-01 | Segurança | Isolamento entre organizações | Toda consulta filtrada por `org_id`; RLS no banco; teste automatizado de acesso cruzado em toda rota |
| RNF-02 | Segurança | Arquivos inéditos privados | Bucket privado; acesso só por URL assinada de curta duração (≤ 10 min) após checagem de permissão |
| RNF-03 | Segurança | Anonimato em duplo-cego | Nenhuma resposta de API para avaliador contém dado de autor; teste automatizado |
| RNF-04 | Segurança | Autenticação | Sessão com cookie httpOnly; links mágicos de uso único e expiração ≤ 15 min; MFA opcional para organizadores (E) |
| RNF-05 | Auditoria | Trilha de ações sensíveis | Decisões, mudanças de atribuição, downloads de arquivos, personificação: registrados e imutáveis |
| RNF-06 | LGPD | Base legal, consentimento, direitos do titular | Termos e política; exportação e exclusão de dados pessoais em ≤ 15 dias; registro de operações de tratamento |
| RNF-07 | LGPD | Retenção | Submissões rejeitadas e arquivos privados apagados após prazo configurável (padrão 24 meses após o evento); aprovados e publicados mantidos |
| RNF-08 | Disponibilidade | Uptime | 99,5% mensal no MVP; janela de manutenção fora de prazos de submissão |
| RNF-09 | Desempenho | Pico de submissão | 50 submissões/minuto com upload de 10 MB sem erro; p95 de páginas < 800 ms |
| RNF-10 | Backup | Recuperação | Backup diário + PITR; RPO ≤ 24 h (MVP), RTO ≤ 4 h; restauração testada antes do piloto |
| RNF-11 | Portabilidade | Sem aprisionamento | Banco PostgreSQL padrão; arquivos em API S3; exportação completa por evento |
| RNF-12 | Acessibilidade | WCAG 2.2 AA | Auditoria com axe sem violações críticas; navegação por teclado nos fluxos de submissão e avaliação |
| RNF-13 | Responsividade | Fluxos de autor, participante e visitante utilizáveis em 360 px | Teste manual em Android de entrada |
| RNF-14 | Observabilidade | Logs estruturados, métricas, alertas | Alerta em erro 5xx > 1% em 5 min, falha de envio de e-mail, fila parada |
| RNF-15 | E-mail | Entregabilidade | SPF, DKIM, DMARC; taxa de bounce monitorada; domínio de envio separado |
| RNF-16 | Idioma | PT-BR no MVP; estrutura pronta para EN/ES | Textos externalizados desde o início |
| RNF-17 | Manutenibilidade | Testes | Cobertura de testes nos fluxos de estado (submissão, avaliação, decisão) e de autorização; CI obrigatório |
