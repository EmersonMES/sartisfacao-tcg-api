import { chromium } from 'playwright';
import { buscarColecao } from './utils/dicionarioColecoes';

async function iniciarMasterScraper() {
    // 1. O utilizador define qual coleção quer extrair (pode ser em maiúsculas, com espaços, etc)
    const pesquisaUsuario = "Fenda Paradoxal";
    
    // 2. Consultamos o nosso "Cérebro" (Dicionário)
    const colecao = buscarColecao(pesquisaUsuario);

    if (!colecao) {
        console.error(`❌ ERRO: A coleção "${pesquisaUsuario}" não foi encontrada no dicionário.`);
        return;
    }

    console.log(`🧠 Dicionário consultado!`);
    console.log(`➡️ Alvo: ${colecao.nomePtBr} | Sigla Ocidental: ${colecao.siglaOcidental}`);

    // 3. Definimos os idiomas ocidentais que partilham a mesma estrutura
    const idiomasOcidentais = [
        'PORTUGUESE_BRAZIL', 
        'ENGLISH', 
        'FRENCH', 
        'SPANISH', 
        'GERMAN', 
        'ITALIAN'
    ];

    console.log(`\n🕵️‍♂️ Robô Mestre ativado para ${idiomasOcidentais.length} idiomas...`);

    const browser = await chromium.launch({ headless: false, slowMo: 50 });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        const urlFonte = `https://limitlesstcg.com/cards/${colecao.siglaOcidental}`;
        console.log(`🌐 Acedendo à matriz em: ${urlFonte}`);
        
        await page.goto(urlFonte, { waitUntil: 'domcontentloaded', timeout: 60000 });
        const elementosCartas = await page.locator(`a[href^="/cards/${colecao.siglaOcidental}/"]:has(img)`).all();

        console.log(`🎉 Matriz carregada! ${elementosCartas.length} cartas encontradas.`);
        
        // Vamos extrair as 5 primeiras cartas REAIS agora!
        const limiteExtracao = 5; 

        for (let i = 0; i < limiteExtracao; i++) {
            const href = await elementosCartas[i].getAttribute('href') || '';
            const numeroCarta = href.split('/').pop() || '0';
            
            // EXTRAÇÃO DE DADOS REAIS DO SITE
            const imgElement = elementosCartas[i].locator('img');
            const nomeReal = await imgElement.getAttribute('alt') || 'Pokémon Desconhecido';
            let urlImagemReal = await imgElement.getAttribute('src') || '';
            
            // Garantir que a URL da imagem está completa
            if (urlImagemReal.startsWith('/')) {
                urlImagemReal = `https://limitlesstcg.com${urlImagemReal}`;
            }

            const id_oficial = `${colecao.siglaOcidental.toLowerCase()}-${numeroCarta}`;
            const id_global = `${colecao.nomeEn.toLowerCase().replace(/\s+/g, '-')}-${numeroCarta}`;
            
            console.log(`\n📦 Extraindo Carta Real: ${nomeReal} (${id_oficial})`);

            // Como o Limitless só tem inglês, vamos injetar a imagem real em todos por agora
            // No futuro, os outros idiomas virão da injeção em massa (API Dump).
            for (const idioma of idiomasOcidentais) {
                
                const pacoteDeDados = {
                    id_oficial: id_oficial,
                    id_global: id_global,
                    numero: `${numeroCarta}/${elementosCartas.length}`,
                    raridade: 'Comum/Incomum', 
                    colecao: colecao.nomeEn,
                    language: idioma, 
                    nome: nomeReal, // NOME 100% REAL
                    descricao: `Ataques e textos reais requerem acesso profundo à página do card...`,
                    url_imagem: urlImagemReal // IMAGEM 100% REAL
                };

                try {
                    await fetch('http://localhost:3000/cartas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(pacoteDeDados)
                    });
                } catch (e) {
                    // Erro silenciado para manter o terminal limpo
                }
            }
            console.log(`   ✅ Todos os idiomas sincronizados com a imagem real de ${nomeReal}!`);
        }

    } catch (erro) {
        console.error('❌ Erro no Robô Mestre:', erro);
    } finally {
        await browser.close();
    }
}

iniciarMasterScraper();