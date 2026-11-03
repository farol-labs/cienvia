# 13. Riscos, premissas e questões em aberto

## 13.1 Riscos

| # | Risco | Prob. | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | Sem diferencial percebido frente a Even3/Doity (produto "mais um") | Alta | Alto | Descoberta antes de codar; foco estreito em avaliação e configuração; medir no piloto |
| R2 | Disposição a pagar baixa no segmento institucional | Alta | Alto | Testar preço no piloto; contratos institucionais; não depender de evento avulso |
| R3 | Prazo do MVP estoura e o piloto passa da data | Média | Alto | Contingência de 25%; piloto 6 a 7 meses à frente; cortar escopo, não qualidade |
| R4 | Vazamento de trabalho inédito ou quebra do duplo-cego | Baixa | Crítico | RLS, URLs assinadas, testes automatizados de anonimato, auditoria, revisão de segurança antes do go-live |
| R5 | E-mails em spam (convites e resultados não chegam) | Média | Alto | Provedor dedicado, SPF/DKIM/DMARC, aquecimento de domínio, painel de entregas, aviso dentro do app |
| R6 | Pico na última hora derruba o sistema | Baixa | Alto | Teste de carga; uploads direto para R2 com URL pré-assinada; fila para e-mails |
| R7 | Suporte consome o time nos picos sazonais | Alta | Médio | Base de ajuda, mensagens de estado claras, limitar número de eventos simultâneos no início |
| R8 | Ciclo de compra público lento | Alta | Médio | Aceitar empenho; documentação pronta (CNPJ, NF, declarações); piloto gratuito para entrar |
| R9 | Dependência de fornecedor de nuvem | Média | Médio | Postgres padrão, API S3, framework portátil, backup em outro provedor |
| R10 | IA gera viés ou desconfiança de pesquisadores | Média | Alto | Fase 3 apenas, opt-in, explicável, sem decisão automática, auditoria de sugestões |
| R11 | Problema jurídico com a marca "Cienvia" | Desconhecida | Alto | Busca no INPI e em domínios antes de investir em identidade (doc 10) |
| R12 | Equipe de uma pessoa: risco de indisponibilidade | Alta | Alto | Documentação, infraestrutura como código, runbooks, contato de apoio técnico para emergências |

## 13.2 Premissas (a confirmar)

| # | Premissa | Como confirmar |
|---|---|---|
| P1 | Equipe: 1 dev sênior em tempo integral + design parcial | Você confirma |
| P2 | Segmento inicial: eventos institucionais recorrentes | Entrevistas |
| P3 | Dor principal: configuração e avaliação, não inscrição/pagamento | Entrevistas |
| P4 | Organizadores aceitam inscrição externa no piloto | Piloto |
| P5 | Preço de R$ 1.500 a 3.500 por evento é aceitável | Entrevistas e piloto |
| P6 | Pagamento por empenho/NF é necessário para vender a IES públicas | Entrevistas |
| P7 | Hospedar dados no Brasil ajuda em vendas públicas | Entrevistas e editais |
| P8 | Volume de um evento piloto: 80 a 400 submissões | Piloto escolhido |

## 13.3 Questões em aberto para você

1. **Quem desenvolve?** Você, um contratado, uma equipe? Tempo integral ou parcial?
2. **Orçamento e prazo-limite** para chegar ao piloto?
3. **Já existe um evento piloto** em vista (instituição, data, volume)?
4. **Qual é sua relação com o mercado acadêmico** (professor, organizador, sociedade)? Isso define o canal de vendas inicial.
5. **Por que a ABEP 2026 como referência?** É um cliente-alvo, uma inspiração de UX ou um evento de que você participou?
6. **Pagamentos são essenciais para seus primeiros clientes?** Se sim, o MVP muda.
7. **A Cienvia é só eventos ou deve evoluir para gestão de pesquisa e publicações?** A marca sugere expansão; o plano recomenda não dispersar antes de validar eventos.
8. **Preferência ou experiência prévia com Cloudflare?** Influencia a escolha entre opções B e C (doc 05).
9. **Repositório:** os documentos devem ir também para `github.com/farol-labs/cienvia` (hoje vazio)?

## 13.4 Questões técnicas a investigar

- Limites atuais de Workers (CPU, tamanho de bundle) para geração de PDF de certificados; alternativa: gerar em job em container.
- Região São Paulo disponível no provedor de Postgres escolhido e preço real.
- Biblioteca para remoção confiável de metadados de PDF e contagem de páginas no runtime escolhido.
- Requisitos de validade de certificados para horas complementares em IES (há exigência de assinatura digital ICP-Brasil em algumas? **[HIPÓTESE]** a verificar).
