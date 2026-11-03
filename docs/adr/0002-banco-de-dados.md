# ADR 0002: PostgreSQL gerenciado como fonte da verdade (não Cloudflare D1)

- Status: Proposto
- Data: 2026-11-02

## Contexto
O núcleo envolve atribuições, conflitos de interesse, decisões e auditoria com integridade transacional e isolamento estrito entre organizações. Os anais exigem busca textual em português. O briefing pediu avaliar Cloudflare D1.

## Decisão
PostgreSQL gerenciado em região São Paulo, acessado a partir dos Workers via Hyperdrive. Isolamento por `org_id` com Row Level Security. D1 não será usado para dados de negócio.

## Justificativa
- RLS nativo como segunda camada de isolamento multi-tenant.
- Busca textual com configuração `portuguese` e extensões (`unaccent`, `pg_trgm`) para anais.
- Portabilidade total (`pg_dump`, qualquer provedor) e ecossistema maduro de migrações e ferramentas.
- D1: SQLite, limite de tamanho por banco (10 GB no plano pago, conferir), sem RLS, ferramental de migração e backup mais restrito e API proprietária. Bom para dados de borda, não para o núcleo.

## Consequências
- Custo fixo pequeno de banco (US$ 0 a 25/mês no início).
- Latência Worker → banco mitigada pelo Hyperdrive e pela região.
- Se Workers impuserem limites, a aplicação migra para container sem mudar o banco.

## Revisão
Reavaliar se o custo do banco passar de 20% do custo de infraestrutura ou se surgir requisito de dados por região.
