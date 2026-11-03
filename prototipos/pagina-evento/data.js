/*
 * Dados do evento usados no protótipo.
 * Fonte: páginas públicas do SIGEventos (https://sigeventos.ufrn.br/evento/GTsABEP2025/...)
 * Coleta: 02/11/2026, por leitura automatizada do HTML (sem captura visual).
 * Grafia de nomes e títulos mantida como na fonte; antes de qualquer uso público,
 * revisar contra a página original. Nada aqui foi inventado: campos ausentes na
 * fonte ficam como null e a interface mostra "não informado".
 */
window.EVENTO = {
  slug: "GTsABEP2025",
  fonte: "https://sigeventos.ufrn.br/evento/GTsABEP2025/principal/view",
  coleta: "2026-11-02",
  nome: "Encontro Intermediário dos Grupos de Trabalho da ABEP",
  nomeCurto: "Encontro dos GTs ABEP 2025",
  realizacao: "Associação Brasileira de Estudos Populacionais (ABEP)",
  tema: "População, desenvolvimento e emergência climática",
  resumo:
    "Os quatro Grupos de Trabalho da ABEP reúnem pesquisadoras e pesquisadores para discutir como a demografia contribui para o debate sobre desenvolvimento sustentável: pobreza, padrões de produção e consumo e impactos ambientais. O encontro acontece no contexto da divulgação dos resultados do Censo 2022, dos 30 anos da Conferência do Cairo e da COP30, realizada no Brasil em 2025.",
  inicio: "2025-12-01",
  fim: "2025-12-04",
  cidade: "Rio de Janeiro, RJ",
  local: {
    nome: "Universidade do Estado do Rio de Janeiro (UERJ), Campus Maracanã",
    endereco: "R. São Francisco Xavier, 524, Maracanã, Rio de Janeiro, RJ",
    mapa: "https://www.openstreetmap.org/search?query=R.%20S%C3%A3o%20Francisco%20Xavier%2C%20524%2C%20Rio%20de%20Janeiro",
    comoChegar: "https://www.uerj.br/como-chegar/",
    transporte: [
      { modo: "Metrô", texto: "Linha 2, estação Maracanã. Da Linha 1 ou da Linha 4, faça a transferência na Estação Central." },
      { modo: "Trem", texto: "Ramais Deodoro, Japeri, Santa Cruz, Belford Roxo ou Gramacho, estação Maracanã." },
      { modo: "Ônibus", texto: "Linhas que passam pela Rua São Francisco Xavier, pelo Boulevard 28 de Setembro ou pela Rua Professor Manoel de Abreu." }
    ],
    alimentacao: "Lanchonetes no 5º e no 7º andar, abertas de 1 a 4 de dezembro. Lista de restaurantes do entorno nos documentos do evento.",
    acessibilidade: null,
    hospedagem: null
  },
  gts: [
    { id: "mig", nome: "Migração", edicao: "XIV Encontro Nacional sobre Migrações" },
    { id: "amb", nome: "População, Espaço e Ambiente", edicao: "VIII Encontro do GT População, Espaço e Ambiente" },
    { id: "trab", nome: "População, Trabalho e Proteção Social", edicao: "V Encontro do GT População, Trabalho e Proteção Social" },
    { id: "proj", nome: "Estimativas e Projeções Demográficas", edicao: "IV Encontro do GT Projeções e Estimativas Demográficas" }
  ],
  // Datas importantes (página Inscrição/Submissões)
  marcos: [
    { id: "insc", titulo: "Inscrições no evento", inicio: "2025-06-04", fim: "2025-11-30", nota: "Gratuitas" },
    { id: "sub", titulo: "Envio do resumo expandido", inicio: "2025-06-09", fim: "2025-08-03" },
    { id: "res", titulo: "Divulgação dos resultados", inicio: "2025-09-15", fim: "2025-09-15" },
    { id: "final", titulo: "Envio da versão final", inicio: "2025-10-13", fim: "2025-11-28" },
    { id: "mini", titulo: "Inscrições nos minicursos", inicio: "2025-10-13", fim: "2025-11-24", nota: "Gratuitas, vagas limitadas" },
    { id: "evento", titulo: "Realização do encontro", inicio: "2025-12-01", fim: "2025-12-04" }
  ],
  categorias: ["Espectador", "Apresentador de trabalho", "Palestrante convidado", "Atendimento ao público", "Organização"],
  normas: {
    oral: ["Até 15 minutos por apresentação.", "Sugestão de até 15 slides.", "Modelo de slides disponível nos documentos."],
    poster: [
      "Confecção e impressão por conta das autoras e dos autores.",
      "Dimensão recomendada: 0,90 m × 1,20 m.",
      "Visual limpo, sem excesso de detalhes, com fonte legível.",
      "Exposição em porta-banner tipo pedestal tripé: prever bastão e cordinha para pendurar.",
      "Modelo de pôster disponível nos documentos."
    ]
  },
  // Página Documentos. Tipo e tamanho de arquivo não são informados na fonte.
  documentos: [
    { grupo: "Submissão", titulo: "Template para submissão dos trabalhos", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16848247&key=0e7c1b6c8650353d29ae00e7aa0b620f" },
    { grupo: "Submissão", titulo: "Passo a passo para submissão de trabalhos", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16848404&key=0d563527d9589b7e8560f67a1abbf317" },
    { grupo: "Apresentação", titulo: "Template para apresentação oral", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16700727&key=f790244c0d7a1ab44cdd9719827383a0" },
    { grupo: "Apresentação", titulo: "Template para pôster", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16712502&key=83f461c217f01f666d0334250eb10911" },
    { grupo: "Inscrição", titulo: "Passo a passo da inscrição com vínculo UFRN", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16848428&key=adfc19635ce494fd5e089dd014819dda" },
    { grupo: "Inscrição", titulo: "Passo a passo da inscrição sem vínculo UFRN", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16848429&key=902f047c20ed29ef7604452010a35d7d" },
    { grupo: "Inscrição", titulo: "Passo a passo para inscrição nos minicursos", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=16848427&key=5fb5d03dacfd0ad5d986c305f14933e3" },
    { grupo: "Minicursos", titulo: "Material do Minicurso 1", url: "https://drive.google.com/file/d/1IGOp2L_anV1Ugc0Rrie1VQwE8R_EDcz_/view?usp=sharing" },
    { grupo: "Local", titulo: "Restaurantes no entorno da UERJ", url: "https://sigeventos.ufrn.br/sigeventos/verArquivo?idArquivo=17649712&key=926b66c1b010d130ba17ad79968c63c9" }
  ],
  contato: {
    email: "encontrointermediarioabep2025@gmail.com",
    instagram: "https://www.instagram.com/encontro.inter.abep.2025/",
    instagramHandle: "@encontro.inter.abep.2025"
  },
  comissaoOrganizadora: [
    ["Barbara Cobo Soares", "ENCE/IBGE"],
    ["Danielle Fernandes de Luna", "UFRN"],
    ["Felipe Ferraz Vazquez", "UNEMAT"],
    ["Fredna Marta C. M. Carvalho", "UFRN"],
    ["Gisela P. Zapata", "UFMG"],
    ["Izabel Guimarães Marri", "IBGE"],
    ["Marcos Roberto Gonzaga", "UFRN"],
    ["Mariana Andreotti Dias", "UFRN"],
    ["Mariana Eugenio Almeida", "MTE / UFMG"],
    ["Natália Belmonte Demétrio", "UFRR"],
    ["Raphael Villela Almeida", "IPEA"],
    ["Victor Hugo Dias Diogenes", "UFRN"]
  ],
  comiteCientifico: [
    ["Ana Maria Nogales Vasconcelos", "UnB"],
    ["Bernardo Lanza Queiroz", "Cedeplar/UFMG"],
    ["Carla Craice da Silva", "UNILAB"],
    ["Douglas Sathler dos Reis", "UFVJM"],
    ["Járvis Campos", "UFRN"],
    ["Luana Junqueira Dias Myrrha", "UFRN"],
    ["Maria de Fátima Lage Guerra", "Dieese"],
    ["Reinaldo Onofre dos Santos", "Cedeplar/UFMG"],
    ["Ricardo de Sampaio Dagnino", "UFRGS"],
    ["Roberta Peres", "UFABC"],
    ["Wilson Fusco", "FUNDAJ"]
  ],
  minicursos: [
    { titulo: "Modelos de variáveis sintomáticas com covariáveis espaciais para estimativas populacionais em pequenas áreas", data: "2025-12-01", status: "ativo", ref: "mc1" },
    { titulo: "Geotecnologias aplicadas ao Censo Demográfico de 2022", data: "2025-12-04", status: "ativo", ref: "mc2" },
    { titulo: "Uso de dados da amostra do Censo Demográfico 2022", data: "2025-12-01", status: "cancelado" }
  ]
};

/*
 * Programação. tipo: abertura | mesa | sessao | minicurso | poster | intervalo
 * gt: lista de ids de GT (vazia = atividade geral)
 * pessoas: [papel, nome, instituição|null]
 * trabalhos: [título, autores] ou, no pôster, [título, autores, grupo]
 */
const FAF8 = "FAF, 8º andar, Bloco F";
const GEO4 = "GEO, 4º andar, Bloco F";
window.PROGRAMACAO = [
  // ---------- 01/12 ----------
  { id: "mc1", dia: "2025-12-01", ini: "09:30", fim: "12:00", tipo: "minicurso", gt: ["proj"],
    titulo: "Minicurso 1: Modelos de variáveis sintomáticas com covariáveis espaciais para estimativas populacionais em pequenas áreas",
    sala: "Sala 6023", predio: "2F",
    pessoas: [["Ministrante", "Flávio Henrique Miranda de A. Freire", null], ["Ministrante", "Marcos Roberto Gonzaga", null], ["Ministrante", "Leonardo Henrique Costa", null]] },
  { id: "d1-alm", dia: "2025-12-01", ini: "12:00", fim: "14:00", tipo: "intervalo", gt: [], titulo: "Almoço" },
  { id: "d1-boas", dia: "2025-12-01", ini: "14:00", fim: "14:30", tipo: "abertura", gt: [], titulo: "Boas-vindas", sala: "Auditório 91",
    pessoas: [["Participação", "Presidenta da ABEP, Comissão Organizadora e representante da UERJ", null]] },
  { id: "d1-mesa", dia: "2025-12-01", ini: "14:30", fim: "16:00", tipo: "mesa", gt: [], sala: "Auditório 91",
    titulo: "Mesa de abertura: Construindo consensos sobre as relações entre população e desenvolvimento no contexto da emergência climática",
    pessoas: [["Moderação", "Barbara Cobo", "ENCE/IBGE"], ["Palestrante", "Laura Wong", "Cedeplar/UFMG; presidenta da IUSSP"], ["Palestrante", "Roberto Luiz do Carmo", "Unicamp"], ["Palestrante", "Amilton Moretto", "UNILA"], ["Palestrante", "César Augusto Marques da Silva", "ENCE/IBGE"], ["Palestrante", "Carlos Vainer", "UFRJ"]] },
  { id: "st-amb1", dia: "2025-12-01", ini: "16:00", fim: "17:30", tipo: "sessao", gt: ["amb"], sala: "Sala 8009", predio: FAF8,
    titulo: "ST Ambiente 1: População e Ambiente em Contextos Urbanos",
    pessoas: [["Moderação", "Igor Cavallini Johansen", "NEPO/Unicamp"]],
    trabalhos: [
      ["Distribuição da população e vulnerabilidade socioambiental em Salvador", "Ingrid Maria Lacerda Bacelar"],
      ["Crescimento Demográfico e Expansão da Mancha Urbana de Extremoz: Análise da Distribuição e Ocupação", "Danielle Fernandes de Luna; Maria Eduarda Venceslau de Souza; Christian Matheus Bertoldo Ribeiro de Amorim"],
      ["Mobilidade populacional involuntária e desastres: desabrigamento e desalojamento nas enchentes do Rio Grande do Sul (2024)", "Sophia Damiano Rôvere; Tathiane Mayumi Anazawa; Roberto Luiz do Carmo"],
      ["Ilhas de Calor Urbanas e Vulnerabilidade Social em Natal, Nordeste do Brasil", "Francisco Jablinski Castelhano; Max Wendell Batista dos Anjos; Iago Jose Cabral Maciel; Antônio Campos Neto; Dayvid Carlos de Medeiros"],
      ["Dinâmicas migratórias Sul-Sul entre Moçambique e Malawi: o impacto das mudanças climáticas e fatores socioeconômicos (1980-2023)", "Tomás Pita Cebola; Roberto Luiz do Carmo"]
    ] },
  { id: "st-proj1", dia: "2025-12-01", ini: "16:00", fim: "17:30", tipo: "sessao", gt: ["proj"], sala: "Sala 8010", predio: FAF8,
    titulo: "ST Projeções 1: Projeções e Estimativas",
    pessoas: [["Moderação", "Reinaldo Onofre dos Santos", "Cedeplar/UFMG"]],
    trabalhos: [
      ["Validação do Método de Projeção Populacional da ONU", "Felipe Henrique de Souza; Flavio Henrique Miranda de Araujo Freire; Everton Emanuel Campos de Lima"],
      ["Avaliação espacial das estimativas populacionais do WorldPop frente ao Censo Demográfico 2022 na Amazônia Legal", "Pedro Henrique Oliveira de Freitas; Járvis Campos"],
      ["Estimativas de taxas de crescimento populacional para pequenas áreas no estado do Rio de Janeiro entre 2010-2022: análise das técnicas de compatibilização de malhas de setores censitários", "Luiz Antonio Chaves de Farias"],
      ["Abertura etária por idade simples: limites da aplicação de multiplicadores nas estimativas populacionais para crianças de 0 a 4 anos", "Denise Helena França Marques; Denise Lopes Porto; Eduardo Santiago Rosseti; Antônio Tadeu Ribeiro de Oliveira"]
    ] },
  { id: "st-trab1", dia: "2025-12-01", ini: "16:00", fim: "17:30", tipo: "sessao", gt: ["trab"], sala: "Sala 8016", predio: FAF8,
    titulo: "ST Trabalho 1: Trabalho, Gênero e Desigualdades Sociais",
    pessoas: [["Moderação", "Paula Alves de Almeida", "ENCE/IBGE"]],
    trabalhos: [
      ["Entre a Casa e a Lavoura: Sobrecarga e Invisibilidade do Trabalho de Mulheres na Agricultura Familiar do Sul de Minas Gerais", "Glaucia dos Santos Marcondes; Marina Barbosa e Silva; Juliana Boldrin"],
      ["População em Situação de Rua: Motivações x Domicílio", "Vanessa Lima Caldeira Franceschini; Alisson Flavio Barbieri; Helena Teixeira Magalhães Soares"],
      ["O Impacto do Envelhecimento Populacional na Estrutura Produtiva de Cabedelo (PB): Reflexões sobre Dependência Etária e Proteção Social", "Williane Priscylliana de Melo Azevedo; Ewerton Weynemi Cavalcante dos Santos; Victor Hugo Dias Diogenes"]
    ] },

  // ---------- 02/12 ----------
  { id: "mr1", dia: "2025-12-02", ini: "08:30", fim: "10:00", tipo: "mesa", gt: ["trab"], sala: "Auditório 91",
    titulo: "Mesa Redonda 1: Tendências e Futuro do Trabalho: o papel das projeções ocupacionais no cenário de transformações demográficas, ambientais e tecnológicas",
    pessoas: [["Moderação", "Mariana Eugenio Almeida", "MTE"], ["Palestrante", "Daniel Bonatto Seco", "SENAI/SP"], ["Palestrante", "Paula Montagner", "MTE"], ["Palestrante", "Paulo Jannuzzi", "ENCE/IBGE"]] },
  { id: "d2-cof", dia: "2025-12-02", ini: "10:00", fim: "10:30", tipo: "intervalo", gt: [], titulo: "Coffee-break", sala: "Hall do Auditório 91" },
  { id: "st-amb2", dia: "2025-12-02", ini: "10:30", fim: "12:30", tipo: "sessao", gt: ["amb"], sala: "Sala 4054", predio: GEO4,
    titulo: "ST Ambiente 2: Efeitos dos Eventos Climáticos Extremos sobre as Populações",
    pessoas: [["Moderação", "Thais Tartalha", "UFABC"]],
    trabalhos: [
      ["Eventos climáticos extremos e dinâmica demográfica no estado do Amazonas (Brasil): um estudo nas calhas dos rios Solimões e Amazonas (2000-2022)", "William Esteban Ospina Garrido"],
      ["The Belo Monte Dam and a \"Boom-Bust\" Cycle: Work, Space, and Unsustainable Development in a Climate-Vulnerable Amazon", "Igor Cavallini Johansen; Evandro Mateus Moretto; Arthur Welle; Emilio Moran"],
      ["Internações no SUS: o impacto da poluição e a suscetibilidade de grupos e estados", "Mariana Andreotti Dias"],
      ["Enchentes do Rio Grande do Sul, 2024: o caso do povo indígena Mbyá-Guarani do Tekoha Pekurutyos", "Juliene Lemos Saback; Cesar Augusto Marques da Silva"]
    ] },
  { id: "st-mig1", dia: "2025-12-02", ini: "10:30", fim: "12:30", tipo: "sessao", gt: ["mig"], sala: "Sala 4058", predio: GEO4,
    titulo: "ST Migrações 1: Dinâmicas Socioespaciais das Migrações Internacionais no Brasil",
    pessoas: [["Moderação", "Gisela P. Zapata", "Cedeplar/UFMG"]],
    trabalhos: [
      ["A fronteira-tampão: panorama das migrações internacionais em Roraima, Brasil", "Natália Belmonte Demétrio; Rosana Baeninger; João Carlos Jarochinski"],
      ["Redistribuição espacial dos imigrantes internacionais de Roraima para o Nordeste em 2022: entre políticas de interiorização e as dinâmicas socioterritoriais", "Silvana Nunes de Queiroz; Ricardo Monteiro de Carvalho; Rosana Baeninger"],
      ["Interseccionalidade e Migrações Internacionais: Evidências Teóricas e Empíricas a partir da Tríplice Fronteira (2015-2024)", "Fabiane Cristina Silva Mesquita"],
      ["Entre PALOP e o Brasil: Migração Sul-Sul no Nordeste Brasileiro (2015-2022)", "César Patricio Fernandes Sebastião; Wilson Fusco"],
      ["Migração interna da migração internacional: primeiras evidências do Censo Demográfico de 2022", "Jóice de Oliveira Santos Domeniconi; Juliana Carvalho Ribeiro; Rosana Baeninger"]
    ] },
  { id: "st-trab2", dia: "2025-12-02", ini: "10:30", fim: "12:30", tipo: "sessao", gt: ["trab"], sala: "Sala 4064", predio: GEO4,
    titulo: "ST Trabalho 2: Futuro do Trabalho e Projeções Ocupacionais",
    pessoas: [["Moderação", "Fernanda Teixeira Reis", "UFRJ e ENCE/IBGE"]],
    trabalhos: [
      ["Gênero e Futuro do Trabalho no Brasil: projeções ocupacionais para as áreas STEM e de Cuidados", "Mariana Eugenio Almeida; Carlos Alexandre Soares da Silva"],
      ["Transição Demográfica e Força de Trabalho no Brasil, Peru e Uruguai: Projeções até 2050", "João Vitor de Oliveira Alves; Beatriz Brito Tavares; Carolina Gonçalves de Souza"],
      ["Estrutura etária e bônus demográfico no Semiárido brasileiro: uma análise a partir de projeções populacionais (2010-2023)", "Celi Consuelo de Lima Fernandes; Manoel Alexandre de Lucena"],
      ["Componentes demográficos da variação da população ocupada: decomposição para o estado de São Paulo, de 2002 a 2022", "Marcos Damasceno; Reinaldo Onofre dos Santos"]
    ] },
  { id: "d2-alm", dia: "2025-12-02", ini: "12:30", fim: "14:00", tipo: "intervalo", gt: [], titulo: "Almoço" },
  { id: "st-amb3", dia: "2025-12-02", ini: "14:00", fim: "16:00", tipo: "sessao", gt: ["amb"], sala: "Sala 8009", predio: FAF8,
    titulo: "ST Ambiente 3: Métodos e Técnicas aplicados aos estudos de População, Espaço e Ambiente",
    pessoas: [["Moderação", "Mariana Andreotti Dias", "UFRN"]],
    trabalhos: [
      ["Desmatamento e Violência no Campo na Amazônia Legal: Uma Análise Espacial de Clusters", "Josinaldo Felipe"],
      ["Cartografias das Cicatrizes: Distribuição Espacial da População Vulnerável aos Desastres no Município de Campinas", "Thatiane Mayumi Anazawa; Danielly Karoline Sá Alencar Nascimento"],
      ["Infâncias e planejamento territorial: análise socioespacial da vulnerabilidade socioambiental em Santo André (SP)", "Isabelle Bocatto"],
      ["Transição energética e regulação do Setor Eólico Onshore: o caso do Mato Grande (RN)", "Camila Nuta de Oliveira Araujo; Ana Clara de Medeiros Lima; Járvis Campos; João Paulo Teixeira Viana"]
    ] },
  { id: "st-proj2", dia: "2025-12-02", ini: "14:00", fim: "16:00", tipo: "sessao", gt: ["proj"], sala: "Sala 8010", predio: FAF8,
    titulo: "ST Projeções 2: Componentes Demográficas e Projeções",
    pessoas: [["Moderação", "Bernadette Waldvogel", "Fundação SEADE"]],
    trabalhos: [
      ["Projeção da Fecundidade: uso das medidas de convergência e divergência", "Luciene Aparecida Ferreira de Barros Longo; Izabel Guimarães Marri"],
      ["Quem conta mais? A cobertura dos nascimentos no Brasil: análise espaço-temporal de três fontes de dados (2010-2022)", "Everton Emanuel Campos de Lima; Gabriel Alves da Costa; Juan Pablo Montaño Díaz"],
      ["Projeções da estrutura de parentesco de mulheres de 80 anos na América Latina", "Tallyta Carolyne Martins da Silva Santos"],
      ["Transição Demográfica em Roraima: considerações preliminares", "Natália Belmonte Demétrio"]
    ] },
  { id: "st-mig2", dia: "2025-12-02", ini: "14:00", fim: "16:00", tipo: "sessao", gt: ["mig"], sala: "Sala 8016", predio: FAF8,
    titulo: "ST Migrações 2: Redes, Fluxos e Territórios: Migração Interna e Dinâmica Urbana no Brasil",
    pessoas: [["Moderação", "Luiz Antônio Chaves de Farias", "ENCE/IBGE"]],
    trabalhos: [
      ["Redistribuição espacial da população brasileira no século XXI: fluxos migratórios e reconfiguração regional (2000-2022)", "Silvana Nunes de Queiroz; Ricardo Monteiro de Carvalho; Rosana Baeninger"],
      ["A realidade demográfica dos pequenos municípios brasileiros: uma análise à luz da PEC 188/2019", "Jhonatan Telles Ribeiro"],
      ["Migração e expansão urbana na Região Metropolitana de Campinas: análise a partir dos arranjos domiciliares", "Ednelson Mariano Dota; Alberto Augusto Eichman Jakob; Rafael Malaman Pfleger"],
      ["Migração intrametropolitana, arranjos domiciliares e dinâmica urbana: diferenciais socioespaciais e demográficos entre as Regiões Metropolitanas de Campinas e da Grande Vitória", "Ednelson Mariano Dota; Alberto Augusto Eichman Jakob; Jóice de Oliveira Santos Domeniconi"]
    ] },
  { id: "mr2", dia: "2025-12-02", ini: "16:00", fim: "17:30", tipo: "mesa", gt: ["proj"], sala: "Auditório 91",
    titulo: "Mesa Redonda 2: Novas metodologias aplicadas às estimativas e projeções demográficas",
    pessoas: [["Moderação", "Flávio Henrique Miranda de Araújo Freire", "UFRN"], ["Palestrante", "Járvis Campos", "UFRN"], ["Palestrante", "Everton Emanuel Campos de Lima", "Unicamp"], ["Palestrante", "Eduardo Santiago Rosseti", "Consultor Ministério da Saúde/IBGE"], ["Palestrante", "Ana Maria Nogales Vasconcelos", "UnB"]] },

  // ---------- 03/12 ----------
  { id: "st-mig3", dia: "2025-12-03", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["mig"], sala: "Sala 4054", predio: GEO4,
    titulo: "ST Migrações 3: Migração Internacional e Políticas Públicas: Evidências Demográficas e Sociais",
    pessoas: [["Moderação", "Silvana Nunes de Queiroz", "URCA"]],
    trabalhos: [
      ["Crianças na migração internacional no Brasil: o que revela o Censo Demográfico de 2022", "Amanda Nascimento Balestrini; Rosana Baeninger"],
      ["Imigrantes Internacionais Beneficiários do Bolsa Família na RMSP: um estudo com dados do CadÚnico", "Marcela Correia da Rocha Funtelas; Rosana Baeninger"],
      ["Estado, mobilidade e políticas públicas: a construção da governança migratória no estado do Paraná", "Fabiane Cristina Silva Mesquita"],
      ["Dois retratos sobre a migração no Brasil: a partir dos resultados do Censo Demográfico 2022 e de uma perspectiva cinematográfica", "Paula Alves de Almeida"]
    ] },
  { id: "st-trab3", dia: "2025-12-03", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["trab"], sala: "Sala 4058", predio: GEO4,
    titulo: "ST Trabalho 3: Estrutura e Dinâmica do Mercado de Trabalho",
    pessoas: [["Moderação", "Marcos Damasceno", "Cedeplar/UFMG"]],
    trabalhos: [
      ["Evolução populacional e da demanda de trabalho formal regional fluminense entre 2010 e 2022", "Helcio de Medeiros Junior"],
      ["Distribuição funcional da renda no setor agropecuário: uma análise comparativa entre Brasil, EUA e China", "Luiz R C Jacintho; Flavia Caheté Lopes"],
      ["Envelhecimento do mercado de trabalho: uma proposta de decomposição", "Eduardo Santos Araújo"],
      ["A Desigualdade da Evolução da Duração da Aposentadoria no Brasil", "Bernardo Lanza Queiroz; Júlia Moreira Hastenreiter"],
      ["Análise das Diferenças Sociais e Trabalhistas Entre os Gêneros na Ascensão Profissional das Mulheres no Município de Toledo/PR", "Lucir Reinaldo Alves; Ariani do Amaral Antonini Capinos; Crislaine Colla"]
    ] },
  { id: "st-migamb1", dia: "2025-12-03", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["mig", "amb"], sala: "Sala 4064", predio: GEO4,
    titulo: "ST Migrações e Ambiente 1: Migração, Território e Vulnerabilidades Socioambientais",
    pessoas: [["Moderação", "Tathiane Anazawa", "NEPO/Unicamp"]],
    trabalhos: [
      ["Expropriações de terra no Paraguai, desenvolvimento urbano da fronteira leste e mobilidades femininas transfronteiriças para Foz do Iguaçu", "Lina Paula Machado Magalhaes"],
      ["Dinâmicas de Deslocamento Populacional frente ao afundamento do solo em Maceió/AL", "José Anderson Farias da Silva Bomfim; Melchior Carlos do Nascimento; Silvana Nunes de Queiroz"],
      ["Infraestrutura Urbana, Migração e Desigualdade Socioambiental na Região Metropolitana de Belo Horizonte (RMBH)", "Bárbara Marques Sales; Blanca Valadares Ferreira"],
      ["Caminhos (Não-)metropolitanos: Reflexões sobre o Papel das Migrações na Dinâmica Regional da Bacia de Campos (RJ)", "Thais Tartalha Lombardi; Daniel de Andrade Fontoura"]
    ] },
  { id: "d3-cof", dia: "2025-12-03", ini: "10:00", fim: "10:30", tipo: "intervalo", gt: [], titulo: "Coffee-break", sala: "Hall do Auditório 71" },
  { id: "mr3", dia: "2025-12-03", ini: "10:30", fim: "12:00", tipo: "mesa", gt: ["amb"], sala: "Auditório 71",
    titulo: "Mesa Redonda 3: Emergência climática e justiça socioambiental no Brasil: contribuições da demografia para o debate",
    pessoas: [["Moderação", "Igor Cavallini Johansen", "Unicamp"], ["Palestrante", "Eduardo Ribeiro", "UERJ"], ["Palestrante", "Mônica Aparecida Tomé Pereira", "UNIVASF"], ["Palestrante", "Thais Tartalha do Nascimento Lombardi", "UFABC"]] },
  { id: "d3-alm", dia: "2025-12-03", ini: "12:00", fim: "14:00", tipo: "intervalo", gt: [], titulo: "Almoço" },
  { id: "poster", dia: "2025-12-03", ini: "14:00", fim: "15:30", tipo: "poster", gt: ["mig", "amb", "trab", "proj"], sala: "Hall do Auditório 71",
    titulo: "Sessão de Pôsteres",
    trabalhos: [
      ["Política Migratória e Participação Social de Imigrantes no Brasil: um balanço da II COMIGRAR", "Luís Felipe Aires Magalhães; Camila Rodrigues da Silva; Rosana Baeninger", "Estimativas e Projeções"],
      ["Projeção da mortalidade no Distrito Federal: aplicação dos modelos de Lee-Carter", "Phillippi Willian Fonseca Alkmin; Ana Maria Nogales Vasconcelos", "Estimativas e Projeções"],
      ["Uso de microdados do CadÚnico e análise fatorial para estimativa da vulnerabilidade social intramunicipal: proposta de índice sintético aplicado a Campinas-SP", "Paulo Victor de Figueredo Nogueira; João Pedro T. T. de Lucas; Paulo Ricardo da Silva Oliveira", "Estimativas e Projeções"],
      ["Entre Palanca Negra e Onça-Pintada: Dinâmicas da Migração Angolana para o Brasil (1991-2010)", "César Patrício; Wilson Fusco", "Migrações"],
      ["Fluxo migratório venezuelano: uma comparação entre as políticas migratórias do Brasil e da Colômbia no acolhimento e inclusão", "Larissa Cristina Pereira Portes", "Migrações"],
      ["Espaços de vida de imigrantes: uma tipologia das afeições", "Nícolas Vieira da Costa", "Migrações"],
      ["Migração e fecundidade: imigrantes haitianas residentes na República Dominicana", "Nicole Estefany Aponte Cueto; Adriana Miranda-Ribeiro", "Migrações"],
      ["Diplomacia migratória brasileira no contexto da migração venezuelana", "Theo Seligman; Rosana Baeninger", "Migrações"],
      ["Imigração haitiana no Brasil: panorama através de Campinas/SP", "Rosana Baeninger; Sophia Damiano Rôvere", "Migrações"],
      ["Novas tecnologias da informação e controle populacional: a criação do Sistema de Registro Migratório no Brasil", "Roberta Guimarães Peres; Luciana Elena Vazquez", "Migrações"],
      ["Para onde leva o corredor de Guarulhos? Política migratória brasileira e a construção midiática das categorias retidos, ilegais e indesejados", "Larissa Cristina Pereira Portes", "Migrações, Espaço e Ambiente"],
      ["A lei, a ordem e o ambiente na distribuição da população em Boa Vista/RR", "Felipe Ibiapina do Monte Ruben Siqueira; Natália Belmonte Demétrio", "Migrações, Espaço e Ambiente"],
      ["Expansão urbana desordenada e degradação do Cerrado no Distrito Federal", "Ingrid Maria Lacerda Bacelar; Gabriela Rodrigues Silva; Pedro Lucas Marsal Nogueira", "Migrações, Espaço e Ambiente"],
      ["Redistribuição Populacional e Espraiamento Urbano: o caso da Região Metropolitana de Natal (RMN) 2010-2022", "Maria Eduarda Venceslau de Souza", "Migrações, Espaço e Ambiente"],
      ["Desastres ambientais e migrações forçadas no Brasil: proposta de modelo para planejamento e aplicação na resposta emergencial com enfoque em proteção social adaptativa", "Diana Verônica Suárez Naranjo", "Migrações, Espaço e Ambiente"],
      ["A Expansão da Educação Superior no Brasil e seus efeitos demográficos: uma análise da fixação de egressos, mobilidade territorial e adequação da oferta educacional", "Herisson de Oliveira Bezerra", "Migrações e Trabalho"],
      ["Cérebros em disputa: O Brasil na corrida pelos trabalhadores do conhecimento ameaçados pela política migratória de Trump", "Cecília Fantini; Camila Furlan Patricio; Rayssa Dias Silva; Julia Heloisa Giacomini Faria; Ariel Elliot Salles dos Santos", "Migrações e Trabalho"],
      ["Mulheres venezuelanas no mercado de trabalho brasileiro: primeiros olhares sobre suas trajetórias laborais em São Paulo e Campinas", "Joselin M. Utrera A.; Glaucia dos Santos Marcondes", "Migrações e Trabalho"],
      ["Brasil, país acolhedor? Migrações internacionais no Brasil são marcadas por violências e exploração", "Isadora Sales Pereira Asiakevicius; Cecília Fantini; Camila Furlan Patricio; Ariel Elliot Salles dos Santos", "Migrações e Trabalho"],
      ["Transição Energética e Bem-Estar Social: uma análise espacial dos parques eólicos em operação no Nordeste brasileiro", "João Paulo Teixeira Viana; Járvis Campos; Camila Nuta de Oliveira Araujo", "População, Espaço e Ambiente"],
      ["Dinâmica da População Rural em Montes Claros-MG (2010-2022)", "Kemilly Morielle Santos Silva; Vivian Mendes Hermano", "População, Espaço e Ambiente"],
      ["Desastres Naturais e Vulnerabilidade Populacional no Nordeste Brasileiro: Padrões e Desigualdades", "Danielle Fernandes de Luna", "População, Espaço e Ambiente"],
      ["Avaliação dos potenciais riscos à mobilidade urbana causados por inundações no município de Campinas/SP", "Tathiane Mayumi Anazawa; Gustavo Palma de Andrade Santos", "População, Espaço e Ambiente"],
      ["O desastre fantasma em Macacos, as medidas preventivas adotadas pela VALE e a percepção popular", "Débora Dias Piccolo; Amanda Rodrigues do Nascimento; Sharles Robert Mendes da Silveira Santos; Yasmin Avelar Alves; Letícia Costa Gontijo", "População, Espaço e Ambiente"],
      ["Uma confrontação entre as medidas de mitigação e compensação tomadas pela Vale e a percepção dos moradores de Brumadinho-MG sobre sua efetividade", "Amanda Rodrigues do Nascimento; Yasmin Avelar Alves; Paloma Gutierrez Filardi Fernandes de Souza; Letícia Costa Gontijo", "População, Espaço e Ambiente"],
      ["Desigualdade Socioespacial e Vulnerabilidade Climática: uma análise sobre a tragédia de 2023 em São Sebastião", "Lucas Reis Pereira; Pedro Lucas Marsal Nogueira", "População, Espaço e Ambiente"],
      ["Dinâmica Populacional em Foz do Iguaçu/PR: análise por meio de pirâmides etárias e indicadores demográficos (2000-2022)", "Christian Matheus Bertoldo Ribeiro de Amorim; Camila Nuta de Oliveira Araújo", "População, Trabalho e Proteção Social"]
    ] },
  { id: "mr4", dia: "2025-12-03", ini: "15:30", fim: "17:30", tipo: "mesa", gt: ["mig"], sala: "Auditório 71",
    titulo: "Mesa Redonda 4: Emergência climática e (I)mobilidades: velhas e novas questões",
    pessoas: [["Moderação", "Gisela P. Zapata", "UFMG"], ["Palestrante", "Tatiane Brasil de Freitas", "RESAMA"], ["Palestrante", "Reinaldo Onofre dos Santos", "UFMG"], ["Palestrante", "Tatiana Lobão", "Instituto Clima e Sociedade (iCS)"]] },

  // ---------- 04/12 ----------
  { id: "st-amb4", dia: "2025-12-04", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["amb"], sala: "Sala 4054", predio: GEO4,
    titulo: "ST Ambiente 4: Vulnerabilidades Socioambientais",
    pessoas: [["Moderação", "Felipe Vazquez", "UNEMAT"]],
    trabalhos: [
      ["Meio Ambiente e Gênero no Seridó Potiguar: Percepção Ambiental em Perspectiva Comparativa entre 2017 e 2019", "Kaline Stephania Costa Lopes; Ricardo Monteiro de Carvalho; Silvana Nunes de Queiroz"],
      ["Identificação de variáveis de caracterização da gentrificação rural a partir do caso de estudo de Extrema/MG", "Renata Pereira Sarti; Thais Tartalha Lombardi; Vanessa Lucena Empinotti"],
      ["Indicadores do trabalho e vulnerabilidade às mudanças climáticas: uma proposta para o nível municipal", "Paula Vivacqua de Souza Galvão Boarin"],
      ["Entre o Centro e a Periferia: Condições Domiciliares no Espaço Urbano de Natal/RN", "Maria Eduarda Venceslau de Souza; José Anderson Farias da Silva Bomfim; Pedro Henrique Santos Barros de Araújo"],
      ["Impactos da saúde da população afetada pela ruptura da barragem em Brumadinho, Minas Gerais", "Yeda Endrigo Rabelo de Carvalho"]
    ] },
  { id: "st-migamb2", dia: "2025-12-04", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["mig", "amb"], sala: "Sala 4058", predio: GEO4,
    titulo: "ST Migrações e Ambiente 2: Migrações e mobilidades associadas às mudanças climáticas",
    pessoas: [["Moderação", "Raphael Villela Almeida", "IPEA"]],
    trabalhos: [
      ["Dinâmicas Migratórias Sul-Sul entre Moçambique e Malawi: o impacto das mudanças climáticas e fatores socioeconômicos (1980-2023)", "Tomás Pita Cebola; Roberto Luiz do Carmo"],
      ["Migração interna no Brasil em contextos de vulnerabilidade social e estressores climáticos: identificação de migrantes na Coorte de 100 Milhões de Brasileiros (2001-2021)", "Neda Firouraghi; Alisson Flavio Barbieri; Maurício Lima Barreto; Júlia Moreira Pescarini; Denise Marques Sales; Samuel Araujo Gomes da Silva; Paulo Victor Maciel da Costa"],
      ["Mobilidade, mudanças climáticas e malária na Amazônia: diálogos entre realidades locais e o estado da arte", "Pedro Henrique Dias Marques"],
      ["Uma Ferramenta para Analisar a Mobilidade Espacial da População no Contexto das Mudanças Climáticas: resultados do Índice de Vulnerabilidade Sociodemográfico (IVSd) do município de Serra-ES", "Rennan M. Rodrigues"]
    ] },
  { id: "st-migtrab", dia: "2025-12-04", ini: "08:30", fim: "10:00", tipo: "sessao", gt: ["mig", "trab"], sala: "Sala 4064", predio: GEO4,
    titulo: "ST Migrações e Trabalho: Dinâmicas Migratórias, Mobilidade e Inserção Laboral",
    pessoas: [["Moderação", "Danielle Carusi Machado", "UFF"]],
    trabalhos: [
      ["Santa Catarina como Destino Migratório Internacional no século XXI: Distribuição Espacial, Escolarização e Inserção Laboral", "Michelle Maria Stakonski Cechinel; Tafarel Cassaniga; Lucas Matias da Silveira; Lina Paula Machado Magalhaes"],
      ["Qualidade Institucional como Fator de Atração: análise da relação entre avaliação CAPES e distribuição de estudantes internacionais na pós-graduação brasileira (2017-2021)", "Jairo Mariano da Costa Júnior"],
      ["Determinantes da Pendularidade nas Regiões Metropolitanas Cearenses no Ano de 2010", "Silvana Nunes de Queiroz; Aline Alves de Oliveira; Danielle Carusi Machado"],
      ["O Perfil do Trabalhador Pendular nas Regiões Metropolitanas Cearenses no ano de 2010", "Aline Alves de Oliveira; Silvana Nunes de Queiroz; Danielle Carusi Machado"],
      ["Migração e inserção laboral: um olhar para a sobrequalificação de brasileiras no mercado global do trabalho migrante", "Jóice de Oliveira Santos Domeniconi; Rosana Baeninger; Juliana Carvalho Ribeiro"]
    ] },
  { id: "d4-cof", dia: "2025-12-04", ini: "10:00", fim: "10:30", tipo: "intervalo", gt: [], titulo: "Coffee-break", sala: "Hall do Auditório 91" },
  { id: "enc", dia: "2025-12-04", ini: "10:30", fim: "12:30", tipo: "mesa", gt: [], sala: "Auditório 91",
    titulo: "Mesa de Encerramento: População, Desenvolvimento e Emergência Climática: perspectivas integradas e interseccionais para as políticas públicas",
    pessoas: [["Moderação", "Luciana Conceição de Lima", "UFRN; presidenta da ABEP"], ["Palestrante", "Richarlls Martins", "Presidente da CNPD"], ["Palestrante", "Paula de Miranda Ribeiro", "Cedeplar/UFMG"], ["Palestrante", "Glaucia dos Santos Marcondes", "NEPO/Unicamp"], ["Palestrante", "Ana Carolina Bertho", "ENCE/IBGE"], ["Palestrante", "Maira Covre", "ICS/UERJ"]] },
  { id: "d4-alm", dia: "2025-12-04", ini: "12:30", fim: "14:00", tipo: "intervalo", gt: [], titulo: "Almoço" },
  { id: "mc2", dia: "2025-12-04", ini: "14:00", fim: "16:00", tipo: "minicurso", gt: [], sala: "Sala 8037-1",
    titulo: "Minicurso 2: Geotecnologias aplicadas ao Censo Demográfico de 2022",
    pessoas: [["Ministrante", "Tathiane Anazawa", "Unicamp"], ["Ministrante", "Ana Paula Dal'Asta", "INPE"]] }
];

/*
 * Apoio e patrocínio: logotipos exibidos na página principal do SIGEventos.
 * Recortados de uma captura de tela enviada pelo usuário em 03/11/2026 (a página
 * original não traz os nomes em texto). Resolução limitada à da captura.
 * Uso demonstrativo: confirmar autorização de cada instituição antes de uso público.
 * w e h: tamanho em pixels de cada arquivo, usado para o dimensionamento óptico.
 */
window.EVENTO.apoio = [
 {
  "sigla": "NEPO",
  "nome": "Núcleo de Estudos de População Elza Berquó, Unicamp",
  "logo": "nepo-unicamp",
  "w": 83,
  "h": 90
 },
 {
  "sigla": "Demografia UFRN",
  "nome": "Demografia, Universidade Federal do Rio Grande do Norte",
  "logo": "demografia-ufrn",
  "w": 89,
  "h": 90
 },
 {
  "sigla": "Cedeplar",
  "nome": "Centro de Desenvolvimento e Planejamento Regional, UFMG",
  "logo": "cedeplar-ufmg",
  "w": 146,
  "h": 94
 },
 {
  "sigla": "PROEX UFRN",
  "nome": "Pró-Reitoria de Extensão, UFRN",
  "logo": "proex-ufrn",
  "w": 260,
  "h": 91
 },
 {
  "sigla": "PPGEO UERJ",
  "nome": "Programa de Pós-Graduação em Geografia, UERJ",
  "logo": "ppgeo-uerj",
  "w": 179,
  "h": 65
 },
 {
  "sigla": "UERJ",
  "nome": "Universidade do Estado do Rio de Janeiro",
  "logo": "uerj",
  "w": 106,
  "h": 117
 },
 {
  "sigla": "UERJ 75 anos",
  "nome": "Marca comemorativa dos 75 anos da UERJ (1950–2025)",
  "logo": "uerj-75-anos",
  "w": 167,
  "h": 76
 },
 {
  "sigla": "ICS UERJ",
  "nome": "Instituto de Ciências Sociais, UERJ",
  "logo": "ics-uerj",
  "w": 316,
  "h": 83
 },
 {
  "sigla": "IFCH Unicamp",
  "nome": "Instituto de Filosofia e Ciências Humanas, Unicamp",
  "logo": "ifch-unicamp",
  "w": 118,
  "h": 100
 },
 {
  "sigla": "ENCE",
  "nome": "Escola Nacional de Ciências Estatísticas, IBGE",
  "logo": "ence-ibge",
  "w": 109,
  "h": 118
 },
 {
  "sigla": "Unicamp",
  "nome": "Universidade Estadual de Campinas",
  "logo": "unicamp",
  "w": 101,
  "h": 109
 },
 {
  "sigla": "UNEMAT",
  "nome": "Universidade do Estado de Mato Grosso",
  "logo": "unemat",
  "w": 194,
  "h": 80
 }
];
window.EVENTO.patrocinio = [
 {
  "sigla": "CAPES",
  "nome": "Coordenação de Aperfeiçoamento de Pessoal de Nível Superior",
  "logo": "capes",
  "w": 111,
  "h": 103
 }
];
// Vínculos da lista "Instituições participantes" que têm logotipo disponível.
window.EVENTO.logoPorSigla = { "Cedeplar": "cedeplar-ufmg", "NEPO": "nepo-unicamp", "ENCE": "ence-ibge", "Unicamp": "unicamp", "UERJ": "uerj", "ICS": "ics-uerj", "UNEMAT": "unemat" };

/*
 * Fotos de palestrantes e comissões. Nenhuma foto foi incluída: não há fotos com
 * licença livre desses nomes, e o ambiente de trabalho não consegue baixar imagens.
 * Para adicionar: salve a foto em img/pessoas/ e registre aqui, com o nome exatamente
 * como aparece na programação. Sem entrada, a página mostra as iniciais.
 * Exemplo: "Laura Wong": "img/pessoas/laura-wong.jpg",
 */
window.FOTOS = {
};
