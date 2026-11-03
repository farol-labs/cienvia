# 11. Estimativas de infraestrutura, desenvolvimento e operação

Todas as cifras são **[HIPÓTESE]** com premissas explícitas. Preços de nuvem vêm de conhecimento prévio e devem ser conferidos nas páginas oficiais; câmbio de referência US$ 1 = R$ 5,50.

## 11.1 Desenvolvimento

**Premissa de equipe:** 1 desenvolvedor full-stack sênior (40 h/semana) + designer UX/UI parcial (~10 h/semana) + você como PM e contato com o piloto. Sem essa premissa, recalcule.

| Bloco | Esforço dev (semanas) | Observação |
|---|---|---|
| Fundação: repo, CI, ambientes, auth, tenancy, RLS, auditoria | 2,5 | Base de segurança; não cortar |
| Design system, layout responsivo, acessibilidade base | 1,0 | Com designer |
| Evento, modelos, clonagem, página pública | 2,0 | |
| Chamada e formulários configuráveis | 1,5 | Configurável é onde o escopo explode; limitar tipos de campo |
| Submissão, arquivos, checagem formal, versões | 2,5 | |
| Avaliadores, atribuição sugerida, conflitos | 2,5 | Núcleo do diferencial |
| Parecer, lembretes, correção | 1,5 | |
| Decisão, liberação, cartas, lista pública | 1,5 | |
| Certificados e validação | 1,0 | |
| Painel, e-mail em massa, exportações | 1,5 | |
| Admin da plataforma | 0,5 | Mínimo |
| Endurecimento: carga, segurança, backup, docs | 2,0 | |
| **Subtotal** | **20,0** | |
| Contingência (25%) | 5,0 | Incertezas de requisitos e retrabalho de UX |
| **Total** | **~25 semanas-pessoa** | |

**Leitura honesta:** com 1 dev, são ~6 meses, não 4. O roadmap do doc 06 (16 semanas até o go-live) só fecha se: (a) a contingência não for usada, ou (b) houver um segundo dev, ou (c) avaliação e certificados forem concluídos com a chamada do piloto já aberta. Recomendo planejar o piloto para **6 a 7 meses** a partir do início.

**Custo de desenvolvimento (referência de mercado, hipótese):**
| Cenário | Base | 6 meses |
|---|---|---|
| Dev sênior CLT | ~R$ 18 a 25 mil/mês com encargos | R$ 108 a 150 mil |
| Dev sênior PJ | ~R$ 15 a 22 mil/mês | R$ 90 a 132 mil |
| Designer parcial | ~R$ 3 a 5 mil/mês | R$ 18 a 30 mil |
| Você codando (fundador técnico) | custo de oportunidade | prazo provavelmente 1,5x maior se parcial |

Se você mesmo vai desenvolver em tempo parcial, diga: muda o plano inteiro (prioridade ainda maior em cortar escopo).

## 11.2 Infraestrutura (opção B do doc 05)

| Item | Piloto (1 evento, ~300 submissões, ~1.500 usuários) | Ano 1 (~50 eventos, ~15 mil submissões) |
|---|---|---|
| Cloudflare Workers (plano pago) | US$ 5 | US$ 5 a 15 |
| PostgreSQL gerenciado região SP | US$ 0 a 25 | US$ 25 a 60 |
| R2 (arquivos; ~3 GB piloto, ~50 GB ano 1, sem custo de saída) | < US$ 1 | ~US$ 1 a 3 |
| Filas/jobs | incluído ou < US$ 5 | < US$ 5 |
| E-mail transacional (~10 mil/mês piloto, ~50 mil/mês pico) | US$ 0 a 15 | US$ 15 a 50 |
| Backup externo (outro provedor) | < US$ 5 | < US$ 10 |
| Monitoramento de erros e uptime | US$ 0 (planos grátis) | US$ 0 a 30 |
| Domínio e DNS | ~US$ 2/mês | ~US$ 2/mês |
| **Total mensal** | **~US$ 10 a 60 (R$ 55 a 330)** | **~US$ 55 a 175 (R$ 300 a 960)** |

Infraestrutura **não** é o custo relevante. Pessoas e suporte são.

## 11.3 Operação e negócio (mensal, ano 1, hipótese)

| Item | Estimativa |
|---|---|
| Infraestrutura | R$ 300 a 1.000 |
| Ferramentas (repositório, design, help desk, e-mail corporativo) | R$ 300 a 800 |
| Contabilidade e emissão de NF | R$ 500 a 1.000 |
| Impostos sobre receita (Simples Nacional, faixa inicial, serviços de software) | ~6% a 15,5% da receita (confirmar enquadramento/anexo com contador) |
| Jurídico pontual (termos, DPA, política de privacidade) | R$ 3 a 8 mil uma vez |
| Suporte nos picos | Horas do time; ~1 h por evento por semana fora de pico, 5 a 10 h na semana do prazo **[HIPÓTESE]** |
| Opcional: Crossref (Fase 3) | US$ 200+/ano de anuidade + US$ 1,00 (0,95 em 2027) por DOI |
| Opcional: IA (Fase 3) | Centavos por submissão para classificação/embeddings; definir teto por evento |

## 11.4 Ponto de equilíbrio (hipotético)

- Custo mensal com 1 dev PJ + operação: ~R$ 20 a 25 mil.
- Preço médio por evento (faixas do doc 02): ~R$ 2.000; receita líquida após impostos ~R$ 1.750.
- **Equilíbrio: ~12 a 14 eventos pagos por mês** (~150/ano), considerando sazonalidade.
- Comparação: Doity afirma 300 mil eventos acumulados; a meta é uma fração mínima do mercado, mas exige canal de vendas que hoje não existe.

**Implicação:** o produto não se sustenta só com eventos avulsos pequenos. Precisa de contratos institucionais (vários eventos por IES) ou de sociedades médias na Fase 3. Validar isso cedo.
