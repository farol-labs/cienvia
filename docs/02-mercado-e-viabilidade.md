# 2, 3 e 4. Benchmarking, viabilidade e diferenciação

## 2. Benchmarking

### 2.1 Brasil

| Plataforma | Público principal | Modelo comercial | Destaques | Limitações observadas |
|---|---|---|---|---|
| **Even3** | Eventos acadêmicos pequenos e médios, IES, muito presente no Norte/Nordeste | **[FATO]** Grátis para eventos gratuitos (taxa por download de certificado); **10% por inscrição vendida** em eventos pagos; taxa por trabalho submetido (valor não publicado); plano anual Business sob cotação ([fonte](https://platform.even3.com/?p=9253)) | Ciclo completo (inscrição, programação, submissão, check-in, certificado, transmissão); Even3 Publicações; recebeu aporte de R$ 4 mi em 2020 ([fonte](https://startupi.com.br/plataforma-que-simplifica-a-organizacao-de-eventos-online-recebe-aporte-de-r-4-milhoes/)) | **[HIPÓTESE]** Percentual sobre inscrição pesa em eventos pagos maiores; custo para o participante (download de certificado) gera atrito |
| **Doity** | Eventos em geral, com linha acadêmica forte | **[FATO]** 10 submissões grátis por evento; acima disso, plano contratado (valores não publicados) ([fonte](https://doity.com.br/blog/plataforma-para-eventos-cientificos/)) | Submissão em 5 etapas, cartas de aceite, anais sem custo extra (exige ISSN do organizador), Doity Play (transmissão), app do evento; afirma 300 mil eventos e 22 mi de inscrições | Produto generalista; **[HIPÓTESE]** profundidade de avaliação menor que ferramentas especializadas |
| **Galoá** | Sociedades científicas e congressos grandes | **[FATO]** Preço sob consulta ([fonte](https://com-galoascience-www.pages.dev/scientific-conference-platform/)) | Revisão cega/duplo-cega, várias rodadas, conflito de interesse, rebuttal; ORCID e Lattes no perfil; app com agenda e QR code; **DOI Crossref em cada trabalho aceito (sponsoring member desde 2015)**; anais em proceedings.science (165 mil trabalhos indexados); afirma 200 mil trabalhos/ano e 99,9% de uptime | Venda consultiva, foco em grandes clientes; **[HIPÓTESE]** caro e pesado para eventos institucionais pequenos |
| **Sistemas próprios / OJS-OCS / formulários** | IES públicas e eventos internos | Custo "zero" aparente | Controle total | **[HIPÓTESE]** Alto custo oculto: TI interna, planilhas, e-mail manual, retrabalho a cada edição |
| **Sympla** | Eventos em geral | Taxa por ingresso | Inscrição e pagamento | Não faz submissão nem avaliação científica |

Observação: a página de referência `eventos.galoa.com.br/abep-2026` não pôde ser carregada pela ferramenta de pesquisa (erro do site). A análise da Galoá usa a página institucional da empresa. **Ação:** revisar a página da ABEP manualmente e registrar o fluxo de submissão como autor de teste.

### 2.2 Internacional

| Plataforma | Modelo | Ponto forte | Limitação |
|---|---|---|---|
| **EasyChair** | **[FATO]** Pago para a maioria das conferências desde 2022 (acima de 20 submissões) ([fonte](https://dryfta.com/easychair-alternatives-for-academic-conference-management/)) | Padrão de fato em computação | UX criticada como pouco intuitiva; personalização limitada; sem inscrição nativa |
| **Microsoft CMT** | **[FATO]** Gratuito | Mais de 12 mil conferências | Sem inscrição, sem híbrido; voltado a computação |
| **OpenConf** | Licença de baixo custo (valor não confirmado) | Leve, auto-hospedável | Revisão e inscrição básicas, UX antiga |
| **ConfTool** | Grátis até pago sob consulta | 15 idiomas, suporte elogiado | UX datada |
| **Oxford Abstracts** | Plano grátis e preço por evento | Foco acadêmico, multilíngue | Pouca presença no Brasil, sem PT-BR nativo forte (**[HIPÓTESE]**) |
| **Fourwaves** | Grátis até ~US$ 4.999 | Sessões de pôster, simplicidade | Foco estreito |
| **Dryfta, Ex Ordo, Whova, Morressier** | A partir de ~US$ 1.499/ano até enterprise | Ciclo completo, app, híbrido | Caros em reais, sem pagamento por empenho, sem integração Lattes |
| **Pretalx, Indico (CERN)** | Código aberto | Gratuito, maduro | Exige operação própria; Indico é pesado |

Fonte das cifras internacionais: artigo comparativo do próprio Dryfta, portanto parcial. Tratar valores como ordem de grandeza.

### 2.3 Funcionalidades consolidadas vs. oportunidades não comprovadas

**Consolidadas (todo concorrente sério tem; ausência desqualifica):** site do evento, chamada com prazos e eixos, submissão com upload, revisão simples/duplo-cega, formulário de avaliação, decisão e e-mail de resultado, certificados com código de validação, anais em PDF/página, exportação em planilha.

**Comuns, mas não universais:** várias rodadas, rebuttal, conflito de interesse automático, app do evento, programação com salas, pagamento integrado, DOI.

**Oportunidades não comprovadas (hipóteses):**
- Clonar edição anterior com avaliadores, eixos e formulários em um clique.
- Painel de pendências que cobra avaliadores automaticamente e mostra risco de atraso por eixo.
- Pré-verificação formal do arquivo antes do envio (páginas, formato, identificação do autor em duplo-cego, metadados do PDF).
- Sugestão de avaliadores por similaridade temática, com explicação.
- Preço fixo por evento pagável por empenho, sem percentual.
- Atendimento humano rápido em português durante a semana crítica do evento.

## 3. Análise crítica de viabilidade

### 3.1 Viabilidade técnica: **alta**

Nada no escopo é tecnicamente difícil. É CRUD transacional, fluxo de estados, arquivos, e-mail e PDF. Os riscos técnicos reais são outros:
- **Confidencialidade** de trabalhos inéditos e do anonimato em duplo-cego (vazamento destrói a reputação do produto).
- **Picos** perto do prazo de submissão (a maioria dos envios chega nas últimas 48 horas). **[HIPÓTESE]** baseada em padrão conhecido de chamadas.
- **E-mail entregue**: convites a avaliadores e resultados caindo em spam inviabilizam a operação.
- **Integrações acadêmicas** limitadas: **[FATO]** Lattes não tem API pública; Crossref exige ser membro ou ter sponsor ([taxas Crossref](https://www.crossref.org/blog/fee-update-lowering-and-removing-doi-registration-fees-in-january-2027/): US$ 1,00 por conference paper, US$ 0,95 a partir de jan/2027; anuidade mínima de US$ 200 para membros de baixo recurso).

### 3.2 Viabilidade comercial: **incerta, depende do segmento**

Fatores contra:
- Concorrentes com base instalada, marca e preço baixo ou gratuito para eventos gratuitos (Even3).
- **[HIPÓTESE]** Sazonalidade forte: eventos concentrados em alguns meses, receita irregular.
- **[HIPÓTESE]** Ciclo de compra público lento (empenho, licitação ou dispensa) e decisão descentralizada por professor.
- Ticket médio baixo: eventos institucionais pequenos pagam centenas, não milhares, de reais.

Fatores a favor:
- **[HIPÓTESE]** Eventos institucionais recorrem anualmente; quem adota tende a repetir (custo de troca alto depois que há histórico).
- **[HIPÓTESE]** Uma instituição tem dezenas de eventos por ano; um contrato institucional dilui o custo de venda.
- Custo de infraestrutura muito baixo; margem bruta alta se o suporte for controlado.

**Conta de sanidade (hipotética):** se o preço médio for R$ 2.000 por evento e o custo mensal do negócio (1 dev + infraestrutura + impostos + ferramentas) for ~R$ 20 mil, são ~10 eventos pagos por mês, ou ~120 por ano, para empatar. Com receita sazonal, é preciso caixa para 12 a 18 meses. Esse número precisa ser confrontado com a disposição real de pagar medida no piloto.

### 3.3 Modelos de cobrança avaliados

| Modelo | Prós | Contras | Recomendação |
|---|---|---|---|
| Por evento, em faixas de submissões | Previsível, simples de explicar, combina com empenho | Exige estimar volume antes | **Sim, modelo principal** |
| Assinatura institucional anual | Receita recorrente, menos venda por evento | Venda longa, exige produto maduro | **Fase 3**, depois de 3+ eventos na mesma IES |
| Por submissão | Escala com uso | Organizador repassa ao autor; atrito com estudante | Só como excedente acima da faixa |
| Percentual sobre inscrição | Grátis na entrada | Exige pagamentos (fora do MVP); é exatamente o modelo do Even3 | **Não** no início |
| Por participante | Alinha com porte | Difícil medir sem módulo de inscrição | Não no início |

Faixas sugeridas para testar no piloto (**[HIPÓTESE]**, não pesquisadas): até 50 submissões grátis (aquisição e marketing); até 300 por R$ 1.500; até 1.000 por R$ 3.500; acima, sob consulta.

## 4. Público-alvo, problemas e diferenciação

### 4.1 Segmentos

| Segmento | Dor principal (hipótese) | Disposição a pagar | Concorrência | Prioridade |
|---|---|---|---|---|
| **Eventos institucionais recorrentes** (mostras de IC, semanas acadêmicas, seminários de PPG) | Professor sem equipe, configuração demorada, avaliadores voluntários atrasam | Baixa a média, via empenho | Even3, Doity, formulários | **1º (wedge)** |
| Sociedades científicas médias (500 a 3.000 submissões) | Avaliação complexa, anais, DOI, sócios | Média a alta | Galoá | 2º, Fase 3 |
| Congressos grandes | Tudo, com SLA | Alta | Galoá, internacionais | Não alvo inicial |
| Revistas e periódicos | Fluxo editorial contínuo | Média | OJS (gratuito) | Fora do escopo |

### 4.2 Problemas por perfil (hipóteses para as entrevistas)

- **Organizador:** recria tudo a cada edição; não sabe quantos pareceres faltam; cobra avaliadores por WhatsApp; responde as mesmas dúvidas de autores; consolida notas em planilha.
- **Coordenador científico:** distribuir 300 trabalhos manualmente por eixo; detectar conflito de orientador/coautor.
- **Avaliador:** login difícil, formulário longo, PDF que não abre no celular, não sabe o prazo.
- **Autor:** não sabe se o envio foi recebido; regras de formatação ambíguas; descobre erro formal só na rejeição.
- **Participante e visitante:** certificado demora ou tem dado errado; anais difíceis de achar depois.

### 4.3 Como gerar valor onde o concorrente já tem a funcionalidade

| Funcionalidade comum | Valor adicional Cienvia |
|---|---|
| Criar evento | Assistente de configuração + clonar edição anterior + modelos por tipo de evento |
| Submissão | Checagem formal antes do envio e recibo claro com estado em linguagem simples |
| Avaliação | Distribuição sugerida com balanceamento de carga e conflito verificado; lembretes automáticos escalonados; avaliação em uma tela |
| Resultado | Decisão em lote com prévia dos e-mails; cartas geradas automaticamente |
| Certificado | Emitido no momento da decisão para autor e avaliador, validação pública |
| Atendimento | Suporte humano em português com tempo de resposta definido nos dias críticos |

**Diferenciação defensável a médio prazo:** não é uma funcionalidade isolada. É o histórico acumulado (avaliadores, eixos e edições anteriores da instituição) combinado com a UX de avaliação. Isso cria custo de troca. IA entra para aprofundar essa vantagem, não para criá-la.
