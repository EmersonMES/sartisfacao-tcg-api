import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("🏴‍☠️ A preparar o navio para injeção de dados...");

    const frotaInicial = [
        {
            id_oficial: "OP01-001",
            nome: "Roronoa Zoro",
            colecao: "Romance Dawn",
            raridade: "L",
            tipo: "Leader",
            cores: "Red",
            atributo: "Slash",
            custo: null,
            power: 5000,
            counter: null,
            vida: 5,
            efeito: "[Don!! x1] [Your Turn] All of your Characters gain +1000 power.",
            trigger: null,
            url_imagem: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-001.png"
        },
        {
            id_oficial: "OP01-024",
            nome: "Monkey D. Luffy",
            colecao: "Romance Dawn",
            raridade: "SR",
            tipo: "Character",
            cores: "Red",
            atributo: "Strike",
            custo: 2,
            power: 3000,
            counter: null,
            vida: null,
            efeito: "[Rush] (This card can attack on the turn in which it is played.)",
            trigger: null,
            url_imagem: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-024.png"
        },
        {
            id_oficial: "OP01-029",
            nome: "Radical Beam!!",
            colecao: "Romance Dawn",
            raridade: "C",
            tipo: "Event",
            cores: "Red",
            atributo: null,
            custo: 1,
            power: null,
            counter: null,
            vida: null,
            efeito: "[Main] Up to 1 of your Leader or Character cards gains +2000 power during this battle. Then, if you have 2 or less Life cards, that card gains an additional +2000 power.",
            trigger: "[Trigger] Up to 1 of your Leader or Character cards gains +1000 power during this turn.",
            url_imagem: "https://asia-en.onepiece-cardgame.com/images/cardlist/card/OP01-029.png"
        }
    ];

    for (const carta of frotaInicial) {
        await prisma.cartaOnePiece.upsert({
            where: { id_oficial: carta.id_oficial },
            update: carta,
            create: carta
        });
        console.log(`✅ Carta Injetada: ${carta.nome} (${carta.id_oficial})`);
    }

    console.log("⚓ Injeção concluída com sucesso! O tesouro está guardado.");
}

main()
    .catch((erro) => {
        console.error("❌ Erro durante a injeção:", erro);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });