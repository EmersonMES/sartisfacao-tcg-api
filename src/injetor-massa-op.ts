import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🏴‍☠️ Iniciando a Grande Frota: Importação em Massa do One Piece...");

    // NOTA DO ARQUITETO: Quando encontrar o link do JSON de One Piece, coloque-o aqui.
    // Exemplo fictício: const urlAPI = 'https://raw.githubusercontent.com/comunidade/op-tcg/main/cartas.json';
    const urlAPI = 'COLOQUE_A_URL_DO_JSON_AQUI'; 

    try {
        /* DESCOMENTE ESTAS LINHAS QUANDO TIVER A URL REAL
        const resposta = await fetch(urlAPI);
        const dadosBrutos = await resposta.json();
        
        // Algumas APIs guardam as cartas dentro de um array chamado "data" ou "cards".
        const dados = dadosBrutos.data || dadosBrutos; 
        */

        // DADOS DE TESTE (Para provar que o script funciona)
        // Apague este bloco quando ativar o Fetch acima.
        const dados = [
            { id: "OP01-002", name: "Trafalgar Law", set: "Romance Dawn", rarity: "L", type: "Leader", color: "Red/Green", life: "4", power: "5000", effect: "Efeito incrivel aqui", image_url: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-002.png" },
            { id: "OP01-003", name: "Monkey D. Luffy", set: "Romance Dawn", rarity: "C", type: "Character", color: "Red", cost: "2", power: "3000", image_url: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-003.png" }
        ];

        console.log(`🗺️ Encontradas ${dados.length} cartas no mapa. Iniciando injeção...`);

        let contador = 0;

        for (const item of dados) {
            // O TRADUTOR UNIVERSAL: Mapeia o JSON da internet para a SUA tabela
            const cartaFormatada = {
                id_oficial: item.id || item.id_oficial,
                nome: item.name || item.nome || "Desconhecido",
                colecao: item.set || item.colecao || "Promo",
                raridade: item.rarity || item.raridade || "C",
                tipo: item.type || item.tipo || "Character",
                cores: item.color || item.cores || "Unknown",
                atributo: item.attribute || item.atributo || null,
                
                // Converte strings para números em segurança
                custo: item.cost ? parseInt(item.cost) : null,
                power: item.power ? parseInt(item.power) : null,
                counter: item.counter ? parseInt(item.counter) : null,
                vida: item.life ? parseInt(item.life) : null,
                
                efeito: item.effect || item.efeito || null,
                trigger: item.trigger || null,
                url_imagem: item.image_url || item.url_imagem || null
            };

            // Injeta no banco: se já existir, atualiza. Se não existir, cria.
            await prisma.cartaOnePiece.upsert({
                where: { id_oficial: cartaFormatada.id_oficial },
                update: cartaFormatada,
                create: cartaFormatada
            });

            contador++;
            // Avisa no terminal a cada 100 cartas para sabermos que não travou
            if (contador % 100 === 0) {
                console.log(`⏳ Progresso: ${contador} cartas ancoradas no banco de dados...`);
            }
        }

        console.log(`✅ Sucesso Absoluto! ${contador} cartas de One Piece foram adicionadas ao Multiverso.`);

    } catch (erro) {
        console.error("❌ O navio afundou durante a importação:", erro);
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });