# Cienvia: protótipo funcional do fluxo central

Protótipo do MVP definido em `../docs/06-mvp-e-roadmap.md`. Ele cobre o fluxo **criar evento → chamada → submissão → avaliação por pares → decisão → divulgação → certificados**. O banco é PostgreSQL de verdade, embutido no protótipo, e os dados ficam salvos entre execuções.

> Protótipo para demonstração e validação. **Não use com trabalhos reais** antes dos itens da seção "O que falta para produção".

## Como rodar (Windows, macOS ou Linux)

Requisito: [Node.js 20 ou superior](https://nodejs.org).

```bash
cd app
npm install
npm start
```

Abra http://localhost:3000. Na primeira execução são criados dados de demonstração. Para recomeçar do zero, apague a pasta `app/data`.

Outros comandos:
- `npm test`: roda os 16 testes automatizados (regras de atribuição, checagem de PDF e fluxo completo pela web).
- `npm run typecheck`: checagem de tipos.
- `npm run dev`: reinicia sozinho ao editar o código.

## Roteiro de demonstração (10 minutos)

Em modo demonstração, nenhum e-mail sai do computador. Todos aparecem em **E-mails (dev)**, no menu, e **/dev/entrar** permite trocar de usuário sem link.

1. **Organizadora**: em `/dev/entrar`, entre como *Profa. Helena Duarte*. Abra a **Mostra de Iniciação Científica 2027**.
   - **Painel**: alertas acionáveis (trabalhos sem avaliador, convites pendentes) e números por eixo.
   - **Atribuição**: dois trabalhos ficaram sem avaliadores suficientes. O Dr. Rafael é da mesma instituição dos autores, então o sistema o exclui por conflito.
   - **Avaliadores**: convide um avaliador de outra instituição, marcando os eixos. O convite aparece em E-mails (dev).
2. **Avaliador**: entre como *Dr. Carlos Menezes*. Em **Avaliações**, abra um trabalho, preencha notas e comentários e envie. Teste também **Declarar conflito**.
3. **Organizadora**: em **Decisões**, a tabela mostra a nota média, a divergência e as recomendações. Abra um trabalho, registre a decisão e clique em **Divulgar resultados**.
4. **Autora**: entre como *Ana Beatriz Rocha*. Em **Minha área** estão o resultado, os pareceres sem identificar o avaliador, a carta de aceite e o certificado. Teste a validação em `/validar`.
5. **Do zero**: em **Organização → Novo evento**, crie um evento a partir de um modelo, ou clone uma edição anterior.
6. **Autor novo**: em `/entrar`, use qualquer e-mail. O link mágico aparece na própria tela. Depois submeta um trabalho em PDF na página pública do evento.

## O que o protótipo faz

| Área | Funciona |
|---|---|
| Contas | Link mágico de uso único (15 min), sem senha; perfil reutilizável com ORCID iD e link do Lattes; coautor sem conta é vinculado quando entra com o mesmo e-mail |
| Organização | Criar organização; criar evento a partir de 3 modelos; **clonar edição anterior** (eixos, modalidades, critérios, regras e avaliadores); configurar e publicar |
| Submissão | Página pública; formulário em 4 passos; até 4 autores; validações (prazo, campos, limite por autor, autor logado na lista); **checagem do PDF** (tipo real, páginas, tamanho); **remoção de metadados de autoria**; recibo por e-mail para todos os autores; linha do tempo; retirada |
| Avaliação | Convite com eixos e capacidade; aceite ou recusa; **sugestão de atribuição** (sem conflito, mesmo eixo, menor carga); conflitos por autoria, mesma instituição e declaração do avaliador; simples-cega e duplo-cega; parecer com critérios configuráveis; lembretes em um clique |
| Decisão | Tabela ordenada por divergência entre avaliadores; decisão registrada sem comunicar o autor; **divulgação em lote** com e-mails e pareceres anonimizados; rodada de correção com reenvio e confirmação |
| Resultado | Lista pública de aprovados; carta de aceite; certificados de autoria e de avaliação com código verificável e página de validação |
| Dados | Exportação CSV (abre no Excel); trilha de auditoria de ações sensíveis |
| Segurança | Isolamento por organização em todas as rotas de gestão; arquivo só para autor, organizador ou avaliador atribuído; duplo-cego testado automaticamente; cookie httpOnly; proteção básica de origem em formulários |

## Decisões técnicas do protótipo

- **TypeScript + Hono**: o mesmo código roda em Node e em Cloudflare Workers (ADR 0001).
- **PGlite**, PostgreSQL embutido: o esquema em `src/schema.sql` é PostgreSQL padrão. Para produção basta trocar `src/db.ts` por um driver de PostgreSQL gerenciado (ADR 0002). Sem Docker e sem instalar banco.
- **Arquivos em disco local** (`data/files`) atrás de uma interface `Storage`. Em produção: R2/S3 com URL assinada (ADR 0003).
- **E-mail**: caixa de saída na tabela `email_message`. Em produção: provedor transacional.
- Telas renderizadas no servidor, com HTML acessível e quase sem JavaScript. Funcionam no celular e com conexão fraca.

Estrutura: `src/services.ts` (regras de negócio), `src/assignment.ts` (algoritmo de atribuição), `src/pdf.ts` (checagem formal), `src/routes/*` (telas), `tests/*`.

## O que falta para produção (MVP)

Estes itens são conhecidos e não foram feitos de propósito:
1. **Infraestrutura**: PostgreSQL gerenciado com Row Level Security, R2 com URL assinada, provedor de e-mail com SPF/DKIM/DMARC, backup com restauração testada, logs e alertas.
2. **Segurança**: tokens CSRF por formulário, limite de tentativas no login, varredura antivírus de upload, revisão OWASP ASVS nível 1, remoção das rotas `/dev/*` (já desligadas com `DEV=0`).
3. **Produto**: e-mails com modelos editáveis; e-mail em massa por segmento; lembretes automáticos agendados (hoje são manuais); exportação completa por evento (JSON + arquivos); certificado em PDF com QR code (hoje é página imprimível); mais de 4 autores; papel de coordenador por eixo; LGPD (termos, exportação e exclusão de dados pessoais, retenção).
4. **Qualidade**: teste de carga, auditoria de acessibilidade com axe, testes no navegador (Playwright) no CI.
5. **Limite conhecido**: a checagem de duplo-cego remove os metadados do PDF, mas **não lê o texto do arquivo**. Nomes escritos no corpo do PDF não são detectados, e o autor recebe um aviso para conferir.
