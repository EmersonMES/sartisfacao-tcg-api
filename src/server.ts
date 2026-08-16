import 'dotenv/config'; // Garante que a variável DATABASE_URL seja lida corretamente
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import cors from '@fastify/cors';
import cors from 'cors';

const app = fastify();

const prisma = new PrismaClient();

app.use(cors()); 

app.register(cors, {
    origin: true // Permite que o seu navegador acesse a API de qualquer lugar
});

// Rota de boas-vindas
app.get('/', async (request, reply) => {
  return {
    nome: 'Sartisfação API',
    status: 'Online',
    mensagem: 'Sistema inicializado. Aguardando inserção de dados...'
  };
});

// <-- 2. Registar o CORS para permitir acessos externos
app.register(cors, {
  origin: '*', 
});

// ROTA POST: Injetor Inteligente do Multiverso
// ROTA POST: Injetor Inteligente do Multiverso
app.post('/cartas', async (request: any, reply) => {
    const dados = request.body;

    try {
        // 1. Procura se a carta já existe no banco de dados
        const cartaExistente = await prisma.card.findFirst({
            where: { id_oficial: dados.id_oficial },
            include: { traducoes: true }
        });

        if (cartaExistente) {
            // VERIFICAÇÃO INTELIGENTE DE IDIOMA ('EN' e 'ENGLISH' são tratados como o mesmo)
            const idiomaJaExiste = cartaExistente.traducoes.some((t: any) => 
                t.language.toUpperCase() === dados.language.toUpperCase() ||
                (t.language === 'ENGLISH' && dados.language === 'EN')
            );

            if (idiomaJaExiste) {
                // AVISO DE DUPLICAÇÃO
                return reply.status(409).send({ erro: 'Idioma já importado para esta carta.' });
            }

            // ATUALIZAÇÃO SEGURA: Usamos o 'id' interno da carta (Primary Key do Prisma)
            const cartaAtualizada = await prisma.card.update({
                where: { id: cartaExistente.id }, 
                data: {
                    traducoes: {
                        create: {
                            language: dados.language,
                            nome: dados.nome,
                            descricao: dados.descricao,
                            url_imagem: dados.url_imagem
                        }
                    }
                }
            });
            return reply.status(200).send(cartaAtualizada);
        }

        // 2. SE A CARTA NÃO EXISTE: Criamos a base e a primeira tradução
        const novaCarta = await prisma.card.create({
            data: {
                id_oficial: dados.id_oficial,
                id_global: dados.id_global,
                numero: dados.numero,
                raridade: dados.raridade,
                colecao: dados.colecao,
                traducoes: {
                    create: {
                        language: dados.language,
                        nome: dados.nome,
                        descricao: dados.descricao,
                        url_imagem: dados.url_imagem
                    }
                }
            }
        });
        return reply.status(201).send(novaCarta);

    } catch (erro) {
        console.error("❌ Erro ao salvar/atualizar carta:", erro);
        return reply.status(500).send({ erro: 'Erro interno ao processar a carta.' });
    }
});

// Rota para BUSCAR UMA CARTA ESPECÍFICA pelo ID (GET)
app.get('/cartas/:id', async (request: any, reply) => {
  const idDaCarta = request.params.id; // Ex: par-113

  const carta = await prisma.card.findUnique({
    where: { id_oficial: idDaCarta },
    include: { traducoes: true } // O segredo para trazer todas as línguas juntas!
  });

  if (!carta) {
    return reply.status(404).send({ erro: 'Carta não encontrada na Pokédex.' });
  }

  return carta;
});

// Rota de BUSCA UNIVERSAL pelo ID Global (O Fio Invisível)
app.get('/cartas/global/:id_global', async (request: any, reply) => {
  const idGlobal = request.params.id_global; // Ex: paradox-rift-1

  // Usamos findMany para trazer TODAS as versões físicas mundiais desta carta
  const cartas = await prisma.card.findMany({
    where: { id_global: idGlobal },
    include: { traducoes: true } // Traz os 6 idiomas acoplados a cada versão!
  });

  // Se a lista voltar vazia, a carta não existe
  if (cartas.length === 0) {
    return reply.status(404).send({ erro: 'Nenhuma carta encontrada com este ID Global no multiverso.' });
  }

  return cartas;
});

// NOVA ROTA: Motor de Busca do Multiverso (Busca por Nome dentro das Traduções)
app.get('/cartas/busca/:nome_pokemon', async (request: any, reply) => {
  const nomeBusca = request.params.nome_pokemon;

  try {
      // 1. A BUSCA AVANÇADA: Procura o nome DENTRO da tabela de traduções
      const cartas = await prisma.card.findMany({
        where: {
          traducoes: {
            some: {
              nome: {
                contains: nomeBusca
              }
            }
          }
        },
        include: {
          traducoes: true // Puxa os dados da tradução (Nome, Imagem, Ataques) junto com a carta!
        }
      });

      if (cartas.length === 0) {
        return reply.status(404).send({ erro: `A carta '${nomeBusca}' não foi encontrada no multiverso.` });
      }

      // 2. O TRADUTOR: Agora enviamos TODAS as traduções para a página web!
      const cartasFormatadas = cartas.map((carta: any) => {
          return {
              id_oficial: carta.id_oficial,
              id_global: carta.id_global,
              numero: carta.numero,
              raridade: carta.raridade,
              colecao: carta.colecao,
              // Em vez de pegar só a [0], enviamos a lista completa de idiomas!
              traducoes: carta.traducoes 
          };
      });

      return cartasFormatadas;
      
  } catch (erro) {
      console.error("❌ Erro no Banco de Dados:", erro);
      return reply.status(500).send({ erro: 'Erro interno ao consultar o multiverso.' });
  }
});

// ==========================================
// ROTA BISTURI: Correção Manual e Injeção de Dados
// ==========================================
app.put('/cartas/correcao', async (request: any, reply) => {
    const { id_oficial, language, nome, descricao, url_imagem } = request.body;

    try {
        const carta = await prisma.card.findFirst({
            where: { id_oficial: id_oficial },
            include: { traducoes: true }
        });

        if (!carta) {
            return reply.status(404).send({ erro: 'Carta não encontrada no Banco de Dados.' });
        }

        const traducaoExiste = carta.traducoes.find((t: any) => t.language.toUpperCase() === language.toUpperCase());

        if (traducaoExiste) {
            // ATUALIZAÇÃO: Se o idioma já existe, atualizamos apenas os campos preenchidos
            await prisma.card.update({
                where: { id: carta.id },
                data: {
                    traducoes: {
                        updateMany: {
                            where: { language: traducaoExiste.language },
                            data: {
                                nome: nome || traducaoExiste.nome,
                                descricao: descricao || traducaoExiste.descricao,
                                url_imagem: url_imagem || traducaoExiste.url_imagem
                            }
                        }
                    }
                }
            });
            return reply.status(200).send({ msg: `Dados de ${id_oficial} (${language}) corrigidos com sucesso!` });
        } else {
            // INJEÇÃO NOVA: Se a carta existe mas não tem este idioma, criamos a tradução manual
            await prisma.card.update({
                where: { id: carta.id },
                data: {
                    traducoes: {
                        create: {
                            language: language.toUpperCase(),
                            nome: nome || 'Desconhecido',
                            descricao: descricao || 'Sem descrição.',
                            url_imagem: url_imagem || ''
                        }
                    }
                }
            });
            return reply.status(201).send({ msg: `Idioma ${language} injetado manualmente em ${id_oficial}!` });
        }

    } catch (erro) {
        console.error("❌ Erro no Bisturi:", erro);
        return reply.status(500).send({ erro: 'Erro interno ao corrigir carta.' });
    }
});

// ==========================================
// ROTA ANALÍTICA: Centro de Comando (Dashboard)
// ==========================================
app.get('/api/dashboard', async (request: any, reply) => {
    try {
        const cartas = await prisma.card.findMany({
            include: { traducoes: true }
        });

        const relatorio: any = {};
        const idiomasGlobais = new Set<string>();

        // O TRADUTOR UNIVERSAL: Junta os dados antigos (Scrydex) e os novos (TCGDex)
        const mapaIdiomas: { [key: string]: string } = {
            'EN': 'English', 'ENGLISH': 'English',
            'PT': 'Portuguese (Brazil)', 'PORTUGUESE_BRAZIL': 'Portuguese (Brazil)',
            'PT-PT': 'Portuguese (Portugal)',
            'ES': 'Spanish', 'SPANISH': 'Spanish',
            'ES-LA': 'Spanish (Latin America)',
            'FR': 'French', 'FRENCH': 'French',
            'DE': 'German', 'GERMAN': 'German',
            'IT': 'Italian', 'ITALIAN': 'Italian',
            'JA': 'Japanese', 'JAPANESE': 'Japanese',
            'KO': 'Korean', 'KOREAN': 'Korean',
            'ZH-CN': 'Chinese (simplified)', 'CHINESE (SIMPLIFIED)': 'Chinese (simplified)',
            'ZH-TW': 'Chinese (traditional)', 'CHINESE (TRADITIONAL)': 'Chinese (traditional)',
            'ID': 'Indonesian', 'INDONESIAN': 'Indonesian',
            'TH': 'Thai', 'THAI': 'Thai',
            'RU': 'Russian', 'RUSSIAN': 'Russian',
            'PL': 'Polish', 'POLISH': 'Polish',
            'NL': 'Dutch', 'DUTCH': 'Dutch'
        };

        cartas.forEach((carta: any) => {
            const setNome = carta.colecao;

            if (!relatorio[setNome]) {
                relatorio[setNome] = {
                    nome: setNome,
                    totalOficial: 0,
                    cartasUnicas: new Set(),
                    idiomas: {}
                };
            }

            relatorio[setNome].cartasUnicas.add(carta.id_oficial);

            if (carta.numero && carta.numero.includes('/')) {
                const partes = carta.numero.split('/');
                const denom = partes[partes.length - 1]; 
                const numParsed = parseInt(denom.replace(/\D/g, ''), 10);
                
                if (!isNaN(numParsed) && numParsed > relatorio[setNome].totalOficial) {
                    relatorio[setNome].totalOficial = numParsed;
                }
            }

            carta.traducoes.forEach((trad: any) => {
                const langBruto = trad.language.toUpperCase();
                
                // Limpa o nome do idioma. Se não achar no mapa, usa o bruto.
                const langLimpo = mapaIdiomas[langBruto] || langBruto; 

                idiomasGlobais.add(langLimpo); // Adiciona o nome limpo à lista global

                if (!relatorio[setNome].idiomas[langLimpo]) {
                    relatorio[setNome].idiomas[langLimpo] = { cards: 0, images: 0 };
                }

                // Soma os valores nas gavetas fundidas!
                relatorio[setNome].idiomas[langLimpo].cards++;
                if (trad.url_imagem && trad.url_imagem.trim() !== '') {
                    relatorio[setNome].idiomas[langLimpo].images++;
                }
            });
        });

        Object.values(relatorio).forEach((set: any) => {
            const qtdReal = set.cartasUnicas.size;
            if (set.totalOficial < qtdReal) {
                set.totalOficial = qtdReal;
            }
            delete set.cartasUnicas; 
        });

        return {
            colecoes: Object.values(relatorio).sort((a: any, b: any) => a.nome.localeCompare(b.nome)),
            idiomasAtivos: Array.from(idiomasGlobais).sort() // Envia a lista limpa e ordenada
        };

    } catch (erro) {
        console.error("❌ Erro ao gerar dashboard:", erro);
        return reply.status(500).send({ erro: 'Erro interno ao gerar analíticas.' });
    }
});

// ==========================================
// INICIALIZAÇÃO DO SERVIDOR (NUVEM E LOCAL)
// ==========================================
const start = async () => {
    try {
        // Na nuvem, o Render define a porta (process.env.PORT). Se não existir, usa a 3000.
        const porta = process.env.PORT ? parseInt(process.env.PORT) : 3000;
        
        // '0.0.0.0' é a magia que permite que o servidor seja acessado pela internet!
        await app.listen({ port: porta, host: '0.0.0.0' });
        console.log(`\n🚀 Servidor do Multiverso a rodar na porta ${porta}`);
    } catch (erro) {
        console.error("❌ Erro ao iniciar servidor:", erro);
        process.exit(1);
    }
};

start();

start();