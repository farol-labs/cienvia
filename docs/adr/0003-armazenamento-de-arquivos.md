# ADR 0003: Arquivos em Cloudflare R2 com acesso por URL assinada

- Status: Proposto
- Data: 2026-11-02

## Contexto
Trabalhos inéditos são confidenciais até a publicação; anais públicos geram muitos downloads.

## Decisão
R2 (API compatível com S3), dois prefixos: privado (submissões) e público (anais). Upload direto do navegador com URL pré-assinada; download privado só após checagem de permissão, URL de até 10 minutos, registrado em auditoria. Chaves de objeto aleatórias, sem dados pessoais. Cópia semanal para provedor externo.

## Consequências
- Sem custo de saída para downloads de anais.
- Portável para qualquer storage S3.
- Exige disciplina para nunca expor o prefixo privado via CDN.
