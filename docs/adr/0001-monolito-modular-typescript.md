# ADR 0001: Monólito modular em TypeScript

- Status: Proposto
- Data: 2026-11-02

## Contexto
Equipe inicial de 1 desenvolvedor, volume baixo (centenas a dezenas de milhares de submissões por ano), domínio transacional com muitos fluxos de estado.

## Decisão
Uma única aplicação TypeScript (front e back no mesmo repositório), organizada em módulos de domínio (`identity`, `tenancy`, `events`, `calls`, `submissions`, `review`, `decisions`, `certificates`, `comms`, `audit`, `exports`, `admin`). Framework que rode em Cloudflare Workers e em Node (ex.: Hono para API + SvelteKit ou React Router com adaptador), a definir em spike de 2 dias.

## Consequências
- Menos infraestrutura e deploy único; refatorações simples.
- Módulos com fronteiras explícitas permitem extrair serviços no futuro, se necessário.
- Risco: acoplamento se fronteiras não forem respeitadas; mitigado com regras de import e revisão.

## Alternativas rejeitadas
- Microsserviços: custo operacional sem benefício no volume previsto.
- Linguagens diferentes no front e no back: dobra o contexto para 1 dev.
