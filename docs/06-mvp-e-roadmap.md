# 9 e 10. Definição do MVP e roadmap

## 9.1 Objetivo do MVP

Operar **um evento científico real** do início da chamada até a divulgação dos resultados, sem planilha paralela para a avaliação, com segurança suficiente para trabalhos inéditos.

Pergunta que o MVP responde: **um organizador de evento institucional usa a Cienvia de novo e paga por ela?**

## 9.2 Escopo do MVP (Fase 1)

### Incluído (MoSCoW: Must)
| Bloco | Funcionalidades | Req. |
|---|---|---|
| Contas | Link mágico, perfil reutilizável, organizações e papéis, admin com auditoria | RF-01, 03, 04, 05 |
| Evento | Criar a partir de modelo, clonar edição, identidade básica, página pública em subcaminho | RF-10 a 13, 15 a 17 |
| Submissão | Formulário configurável, coautores, upload PDF, validações, checagem formal simples, rascunho, versões, status, retirada | RF-30 a 37 |
| Avaliação | Convite, especialidades, atribuição manual + sugerida por eixo e carga, conflitos por regra e declaração, simples e duplo-cego, formulário configurável, lembretes, 1 rodada de correção | RF-40 a 43, 45 a 47 |
| Decisão | Decisão individual e em lote, liberação de resultados, pareceres ao autor, carta de aceite | RF-48 a 50 |
| Resultado | Lista pública de aprovados | RF-60 |
| Certificados | Autor e avaliador, um modelo com logo, código + QR + página de validação | RF-70, 71 |
| Comunicação | E-mails transacionais editáveis, e-mail em massa por segmento | RF-90, 91 |
| Painéis e dados | Painel do organizador, exportação CSV/XLSX, exportação completa | RF-92 a 94 |
| Não funcionais | Isolamento, arquivos privados, anonimato, auditoria, LGPD básica, backup testado, acessibilidade AA nos fluxos principais | RNF-01 a 13, 15 |

### Excluído do MVP, com justificativa
| Excluído | Motivo | Como o piloto contorna |
|---|---|---|
| Inscrição de participantes e pagamentos | Módulo grande (financeiro, estorno, nota fiscal); concorrentes e Sympla já resolvem; não testa a hipótese central | Ferramenta externa de inscrição ou evento gratuito |
| Programação científica | Necessária só depois dos resultados; pode ser publicada como página/PDF manual | Organizador publica PDF |
| Certificados de participação e presença | Dependem de inscrição e check-in | Ferramenta externa ou fase 2 |
| Anais com busca, PDF compilado, DOI | Valor após o evento; não bloqueia o piloto | Lista pública de aprovados + exportação |
| Domínio próprio | Custo e suporte (TLS por cliente) | Subcaminho `cienvia.app/<org>/<evento>` |
| ORCID login | Útil, não essencial | Campo de ORCID iD informado manualmente |
| Rodadas múltiplas, rebuttal, avaliação aberta | Raro em eventos institucionais | 1 rodada de correção |
| IA | Sem dados, sem confiança e sem necessidade comprovada | Regras simples de sugestão |
| Inglês/espanhol | Público inicial é brasileiro | Textos externalizados |
| Transmissão online, app nativo | Fora do núcleo | Ferramentas de videoconferência |

## 9.3 Critérios de aceite do MVP

| # | Critério | Como verificar |
|---|---|---|
| CA-01 | Organizador sem treinamento cria e publica a chamada em até 60 minutos usando modelo | Teste moderado com 3 organizadores |
| CA-02 | Autor submete trabalho com 3 coautores em até 10 minutos, em celular ou desktop | Teste com 5 autores; tempo medido |
| CA-03 | Coordenador atribui 200 submissões a 40 avaliadores, com conflitos verificados, em até 30 minutos | Dados sintéticos + teste |
| CA-04 | Avaliador conclui um parecer sem criar senha, a partir do link do e-mail | Teste com 5 avaliadores |
| CA-05 | Nenhum endpoint vaza dados de outro tenant | Suíte automatizada de acesso cruzado em 100% das rotas |
| CA-06 | Em duplo-cego, nenhuma resposta ao avaliador contém nome, e-mail ou afiliação de autor | Teste automatizado + revisão manual |
| CA-07 | Arquivo privado inacessível sem permissão e URL expira em ≤ 10 min | Teste automatizado |
| CA-08 | Sistema suporta 50 submissões/min com upload de 10 MB, p95 < 800 ms nas páginas | Teste de carga |
| CA-09 | Backup restaurado com sucesso em ambiente separado em ≤ 4 h | Exercício documentado |
| CA-10 | Certificado validado publicamente pelo código e QR | Teste manual |
| CA-11 | Exportação completa do evento gera JSON + arquivos legíveis | Teste automatizado |
| CA-12 | Fluxos de submissão e avaliação sem violação crítica de acessibilidade (axe) e operáveis por teclado | Auditoria |
| CA-13 | E-mails com SPF/DKIM/DMARC válidos; taxa de entrega > 98% no piloto | Painel do provedor |

## 9.4 Estratégia de testes

- **Unitários:** regras de estado, sugestão de atribuição, regras de conflito, validações.
- **Integração:** API + banco real (Postgres em container) com RLS ativo.
- **Autorização:** matriz papel × rota gerada automaticamente; teste falha se rota nova não estiver na matriz.
- **E2E (Playwright):** criar evento → submeter → atribuir → avaliar → decidir → liberar → baixar certificado.
- **Carga:** script k6 simulando a última hora antes do prazo.
- **Segurança:** revisão OWASP ASVS nível 1, varredura de dependências no CI, teste de upload malicioso.
- **Usabilidade:** testes moderados com organizadores, autores e avaliadores antes do piloto.

## 10. Roadmap evolutivo

Premissa: 1 dev full-stack sênior em tempo integral + designer parcial (doc 07). Datas relativas ao início do desenvolvimento (S = semana). **Atenção:** este é o cenário sem imprevistos; com a contingência de 25% do doc 07, o go-live realista é por volta de S22 a S26.

### Marco 0: Descoberta (S-6 a S0, antes de codar)
- 8 a 12 entrevistas com organizadores e coordenadores científicos.
- Piloto confirmado com data, contato e volume estimado.
- Protótipo navegável (Figma) das jornadas de submissão e avaliação testado com 5 usuários.
- **Saída:** ir/não ir, segmento confirmado, MVP ajustado.

### Fase 1: MVP (S1 a S16)
| Marco | Semanas | Entrega | Dependência |
|---|---|---|---|
| M1 Fundação | S1 a S3 | Repositório, CI, ambientes, auth, tenancy, RLS, auditoria, design system básico | Decisões de stack (ADRs) |
| M2 Evento e chamada | S4 a S6 | Modelos, clonagem, página pública, configuração da chamada | M1 |
| M3 Submissão | S6 a S8 | Wizard, arquivos, checagem formal, status, e-mails | M2, provedor de e-mail |
| M4 Avaliação | S9 a S12 | Avaliadores, atribuição, conflitos, parecer, lembretes, correção | M3 |
| M5 Decisão e certificados | S12 a S14 | Decisão, liberação, cartas, lista pública, certificados | M4 |
| M6 Endurecimento | S14 a S16 | Carga, segurança, acessibilidade, backup, documentação de suporte | M5 |
| **Go-live do piloto** | S16 | Chamada aberta | Todos os CA aprovados |

Margem: chamadas costumam ficar abertas 4 a 8 semanas e a avaliação ocorre depois. Então M4 e M5 podem terminar enquanto a chamada do piloto está aberta, **desde que** M1 a M3 estejam estáveis. Isso é um risco aceito, não um plano ideal.

### Fase 2: Expansão (aprox. S17 a S36), só o que o piloto validar
Ordem sugerida, a confirmar com dados do piloto:
1. Inscrição de participantes gratuita + certificados de participação e presença por QR.
2. Programação científica (sessões, salas, horários) e agenda pública/pessoal.
3. Anais: página por trabalho, busca, filtros, BibTeX/RIS, metadados para Google Scholar, PDF compilado, ISSN.
4. Pagamentos (Pix, cartão, boleto) e emissão de recibo; pagamento por empenho.
5. ORCID login, rodadas múltiplas, avaliação aberta, editor de certificados.
6. Cobrança da própria Cienvia (planos por evento) dentro do produto.

**Dependências:** pagamentos dependem de inscrição; certificados de presença dependem de programação e check-in; anais dependem de consentimento de publicação e versão final.

### Fase 3: Diferenciação (a partir de ~S37)
1. IA de apoio: sugestão de eixo, sugestão de avaliadores com justificativa, detecção de conflito por coautoria (OpenAlex), assistente de requisitos formais. Sempre opt-in, explicável e com decisão humana.
2. DOI via Crossref (tornar-se membro ou parceria com sponsor) e preservação em repositório externo.
3. Assinatura institucional: portal da instituição com todos os eventos, avaliadores e histórico compartilhados.
4. Domínio próprio, PWA aprimorado, inglês e espanhol.
5. Sociedades científicas: carteirinha de sócio, desconto de inscrição por associação.

### Critérios de passagem entre fases
| De → Para | Critério objetivo |
|---|---|
| Descoberta → MVP | ≥ 1 piloto confirmado por escrito; ≥ 6 de 10 entrevistados relatam a dor de avaliação como top 3 |
| MVP → Expansão | Piloto concluído; NPS do organizador ≥ 30; organizador declara intenção de pagar ≥ R$ 1.500 na próxima edição; 0 incidentes de vazamento |
| Expansão → Diferenciação | ≥ 10 eventos pagos; ≥ 3 organizações recorrentes; receita cobre infraestrutura e ferramentas |

### Métricas de sucesso
| Métrica | Meta piloto | Meta fim Fase 2 |
|---|---|---|
| Tempo para publicar a chamada | ≤ 60 min | ≤ 30 min |
| Taxa de conclusão da submissão (iniciadas → enviadas) | ≥ 85% | ≥ 90% |
| Pareceres no prazo | ≥ 80% | ≥ 85% |
| Tickets de suporte por 100 submissões | ≤ 5 | ≤ 2 |
| Horas do organizador na fase de avaliação (vs. edição anterior) | −30% | −50% |
| Organizadores que repetem | 1 de 1 | ≥ 60% |
| Incidentes de segurança | 0 | 0 |
