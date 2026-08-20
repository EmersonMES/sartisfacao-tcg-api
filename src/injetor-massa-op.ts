import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🏴‍☠️ Iniciando a Grande Frota: Importação Oficial da API optcgapi...");

    // A URL que você descobriu na documentação
    const urlAPI = 'https://www.optcgapi.com/api/allSetCards/'; 

    try {
        console.log("📡 A estabelecer ligação com a Grand Line (optcgapi.com)...");
        
        // Adicionamos um cabeçalho (User-Agent) para não sermos bloqueados pelo servidor deles
        const resposta = await fetch(urlAPI, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SartisfacaoTCG/1.0',
                'Accept': 'application/json'
            }
        });

        if (!resposta.ok) {
            throw new Error(`O servidor rejeitou a entrada: ${resposta.status} - ${resposta.statusText}`);
        }

        const dadosBrutos = await resposta.json();
        
        // O Django REST Framework costuma devolver diretamente a lista de cartas
        const dados = Array.isArray(dadosBrutos) ? dadosBrutos : (dadosBrutos.data || []);

        if (dados.length === 0) {
            throw new Error("A API respondeu, mas não enviou nenhuma carta.");
        }

        console.log(`🗺️ Jackpot! Encontradas ${dados.length} cartas. Iniciando a ancoragem no Supabase...`);

        let contador = 0;
        let erros = 0;

        for (const item of dados) {
            try {
                // O TRADUTOR CALIBRADO PARA A SUA IMAGEM
                const cartaFormatada = {
                    id_oficial: item.card_set_id || `SEM-ID-${contador}`,
                    nome: item.card_name || "Desconhecido",
                    colecao: item.set_name || "Coleção Desconhecida",
                    raridade: item.rarity || "C",
                    tipo: item.card_type || "Character",
                    cores: item.card_color || "Unknown",
                    atributo: item.attribute || null,
                    
                    // A API manda números como strings ("1", "2000"), precisamos converter para Int
                    custo: item.card_cost ? parseInt(item.card_cost) : null,
                    power: item.card_power ? parseInt(item.card_power) : null,
                    counter: item.counter_amount ? parseInt(item.counter_amount) : null,
                    vida: item.life ? parseInt(item.life) : null,
                    
                    efeito: item.card_text || null,
                    trigger: null, // A API não parece separar o trigger, vem tudo no card_text
                    url_imagem: item.card_image || null
                };

                // Injeção segura no Supabase
                await prisma.cartaOnePiece.upsert({
                    where: { id_oficial: cartaFormatada.id_oficial },
                    update: cartaFormatada,
                    create: cartaFormatada
                });

                contador++;
                
                // Mostra no terminal a cada 100 cartas
                if (contador % 100 === 0) {
                    console.log(`⏳ Progresso: ${contador} cartas devidamente guardadas...`);
                }
            } catch (errCarta) {
                erros++;
            }
        }

        console.log(`\n👑 MISSÃO CONCLUÍDA COM SUCESSO! 👑`);
        console.log(`✅ Total de Cartas Importadas: ${contador}`);
        if (erros > 0) console.log(`⚠️ Erros (Cartas Ignoradas): ${erros}`);

    } catch (erro) {
        console.error("❌ Ocorreu um problema grave durante a importação:", erro);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });